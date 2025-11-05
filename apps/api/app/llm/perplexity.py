from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Iterable, List, Dict, Any

import httpx


@dataclass
class PerplexityClient:
    api_key: str
    base_url: str = "https://api.perplexity.ai"
    model: str = "sonar-medium-online"

    def _request(self, prompt: str, max_tokens: int = 256) -> str | None:
        url = self.base_url.rstrip("/") + "/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": "You are an equity research assistant."},
                {"role": "user", "content": prompt},
            ],
            "max_tokens": max_tokens,
            "temperature": 0.1,
        }
        try:
            with httpx.Client(timeout=20) as client:
                response = client.post(url, headers=headers, json=payload)
            if response.status_code != 200:
                return None
            data = response.json()
            choices = data.get("choices") or []
            if not choices:
                return None
            content = choices[0].get("message", {}).get("content")
            return content.strip() if isinstance(content, str) else None
        except (httpx.HTTPError, json.JSONDecodeError):
            return None

    def summarize_headline(self, symbol: str, headline: str) -> str | None:
        prompt = (
            "Summarize the following news headline about the stock {symbol}. "
            "Return one concise sentence (max 35 words) that captures the key takeaway.\n"
            f"Headline: {headline}"
        ).format(symbol=symbol)
        return self._request(prompt, max_tokens=120)

    def summarize_headlines(self, symbol: str, headlines: Iterable[str]) -> str | None:
        joined = "\n".join(f"- {headline}" for headline in headlines)
        prompt = (
            "Summarize the key developments from the following headlines about {symbol}. "
            "Return two sentences (max 60 words total).\n"
            f"Headlines:\n{joined}"
        ).format(symbol=symbol)
        return self._request(prompt, max_tokens=160)

    def sentiment_for_text(self, symbol: str, text: str) -> float | None:
        prompt = (
            "Rate the overall sentiment for investors for the following summary about {symbol}. "
            "Respond with ONLY a number between -1 and 1 (negative to positive).\n"
            f"Summary: {text}"
        ).format(symbol=symbol)
        raw = self._request(prompt, max_tokens=20)
        if not raw:
            return None
        match = re.search(r"-?\d+(?:\.\d+)?", raw)
        if not match:
            return None
        try:
            value = float(match.group(0))
        except ValueError:
            return None
        return max(-1.0, min(1.0, value))

    def sentiment_with_price(self, symbol: str, summaries: Iterable[str], price_change_pct: float) -> float | None:
        summary_text = " \n".join(summaries)
        prompt = (
            "Given the following daily price change and news summaries, rate the investment sentiment for {symbol}. "
            "A large negative price change combined with negative news should result in a score near -1. "
            "A positive move with good news should be near +1. Respond with ONLY a number between -1 and 1.\n"
            f"Price change pct: {price_change_pct:.2f}\n"
            f"Summaries:\n{summary_text}"
        ).format(symbol=symbol)
        raw = self._request(prompt, max_tokens=20)
        if not raw:
            return None
        match = re.search(r"-?\d+(?:\.\d+)?", raw)
        if not match:
            return None
        try:
            value = float(match.group(0))
        except ValueError:
            return None
        return max(-1.0, min(1.0, value))

    def generate_stock_summary(self, symbol: str, exchange: str | None = None, max_sources: int = 3) -> dict[str, Any] | None:
        context = f"{symbol} stock"
        if exchange:
            context += f" listed on the {exchange} exchange"
        prompt = (
            "Provide a concise investor-focused update for {context}. "
            "Respond strictly as JSON with the following structure:\n"
            '{{"heading": "...", "summary": "...", "sources": [{{"title": "...", "url": "...", "source": "..."}}]}}\n'
            "Summaries must be under 60 words, fact-based, and derived from reputable financial publications. "
            "Include up to {max_sources} sources with direct article links."
        ).format(context=context, max_sources=max_sources)
        raw = self._request(prompt, max_tokens=400)
        if not raw:
            return None
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if not match:
                return None
            try:
                data = json.loads(match.group(0))
            except json.JSONDecodeError:
                return None
        if not isinstance(data, dict):
            return None
        heading = data.get("heading")
        summary = data.get("summary")
        sources = data.get("sources") or []
        if not heading or not summary:
            return None
        cleaned_sources: List[Dict[str, Any]] = []
        for source in sources[:max_sources]:
            if not isinstance(source, dict):
                continue
            title = source.get("title") or source.get("headline")
            url = source.get("url")
            publisher = source.get("source") or source.get("publisher") or "Perplexity"
            if not title or not url:
                continue
            cleaned_sources.append({"title": title.strip(), "url": url.strip(), "source": publisher.strip()})
        return {"heading": heading.strip(), "summary": summary.strip(), "sources": cleaned_sources}

    def fetch_news_articles(self, symbol: str, exchange: str | None = None, max_items: int = 3) -> List[Dict[str, Any]]:
        context = f"{symbol} stock"
        if exchange:
            context += f" listed on the {exchange} exchange"

        def build_prompt(retry: bool) -> str:
            base = (
                "Find the latest {max_items} news stories about {context} from reputable "
                "financial outlets such as The Economic Times, Business Standard, Mint, Moneycontrol, "
                "Bloomberg, or Reuters. Respond strictly as JSON in the following format:\n"
                '[{{"headline": "...", "url": "...", "source": "...", "summary": "...", "published_at": "ISO8601"}}]\n'
                "Each summary must explicitly mention the company or ticker {symbol}. "
                "Summaries must be under 45 words and provide actionable context for investors."
            ).format(max_items=max_items, context=context, symbol=symbol)
            if retry:
                base += " If you are unsure about relevance, focus on headlines that clearly reference the company/ticker and reputable financial sources."
            return base

        for attempt in range(2):
            raw = self._request(build_prompt(retry=attempt == 1), max_tokens=400)
            if not raw:
                continue
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                match = re.search(r"(\[.*\])", raw, re.DOTALL)
                if not match:
                    continue
                try:
                    data = json.loads(match.group(1))
                except json.JSONDecodeError:
                    continue
            if not isinstance(data, list):
                continue

            articles: List[Dict[str, Any]] = []
            seen_urls: set[str] = set()
            for item in data:
                if not isinstance(item, dict):
                    continue
                headline = item.get("headline")
                url = item.get("url")
                summary = item.get("summary")
                published = item.get("published_at")
                source = (item.get("source") or "Perplexity").strip()
                if not (headline and url and summary):
                    continue
                url = url.strip()
                if url in seen_urls:
                    continue
                normalized_symbol = symbol.upper().split(".")[0]
                combined = f"{headline} {summary}".lower()
                simple_combined = re.sub(r"[^a-z0-9]", "", combined)
                candidates = {
                    normalized_symbol.lower(),
                    symbol.lower(),
                    normalized_symbol.lower().replace(" ", ""),
                }
                if not any(c and (c in combined or c in simple_combined) for c in candidates):
                    continue
                articles.append(
                    {
                        "headline": headline.strip(),
                        "url": url,
                        "summary": summary.strip(),
                        "published_at": published,
                        "source": source,
                    }
                )
                seen_urls.add(url)
                if len(articles) >= max_items:
                    break
            if articles:
                return articles
        return []
