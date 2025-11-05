from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from typing import TypedDict

from langgraph.graph import StateGraph

from financeagent_shared import NewsHeadline, RankedSymbol, Recommendation

from app.services.ranking import RecommendationRecord, compute_opportunity_score, select_recommendation

POSITIVE_TOKENS = {
    "gain",
    "surge",
    "growth",
    "positive",
    "beat",
    "up",
    "strong",
    "record",
}

NEGATIVE_TOKENS = {
    "loss",
    "decline",
    "drop",
    "down",
    "weak",
    "cut",
    "fall",
    "negative",
    "miss",
}


def _estimate_sentiment(text: str | None) -> float:
    if not text:
        return 0.0
    lowered = text.lower()
    score = 0
    for token in POSITIVE_TOKENS:
        if token in lowered:
            score += 1
    for token in NEGATIVE_TOKENS:
        if token in lowered:
            score -= 1
    if score == 0:
        return 0.0
    return max(-1.0, min(1.0, score / 3.0))


def _label_for_sentiment(value: float) -> str:
    if value <= -0.6:
        return "Strong Negative"
    if value <= -0.2:
        return "Negative"
    if value >= 0.6:
        return "Strong Positive"
    if value >= 0.2:
        return "Positive"
    return "Neutral"


class PipelineState(TypedDict, total=False):
    symbols: list[str]
    exchanges: dict[str, str]
    summary_headings: dict[str, str]
    summary_texts: dict[str, str]
    summary_sources: dict[str, list[NewsHeadline]]
    sentiment: dict[str, float]
    price_changes: dict[str, float]
    last_prices: dict[str, float]
    ranked: list[RankedSymbol]
    history: list[RecommendationRecord]
    recommendation: Recommendation | None
    as_of: date


@dataclass
class PipelineResult:
    ranked: list[RankedSymbol]
    recommendation: Recommendation | None
    summary_headings: dict[str, str]
    summary_texts: dict[str, str]
    summary_sources: dict[str, list[NewsHeadline]]


class DailyRankingPipeline:
    def __init__(
        self,
        summary_provider,
        price_provider,
        weights: tuple[float, float],
        huge_correction_threshold: float,
        llm_client=None,
    ) -> None:
        self.summary_provider = summary_provider
        self.price_provider = price_provider
        self.weights = weights
        self.huge_correction_threshold = huge_correction_threshold
        self.llm_client = llm_client
        self.graph = self._build_graph()

    def _build_graph(self):
        graph: StateGraph = StateGraph(PipelineState)
        graph.add_node("generate_summary", self._generate_summary_node)
        graph.add_node("finalize_summary", self._summarize_node)
        graph.add_node("price", self._price_node)
        graph.add_node("sentiment", self._sentiment_node)
        graph.add_node("rank", self._rank_node)
        graph.add_node("recommend", self._recommend_node)

        graph.set_entry_point("generate_summary")
        graph.add_edge("generate_summary", "finalize_summary")
        graph.add_edge("finalize_summary", "price")
        graph.add_edge("price", "sentiment")
        graph.add_edge("sentiment", "rank")
        graph.add_edge("rank", "recommend")
        graph.add_edge("recommend", "__end__")

        return graph.compile()

    def run(
        self,
        symbols: list[str],
        history: list[RecommendationRecord],
        as_of: date,
        exchanges: dict[str, str] | None = None,
    ) -> PipelineResult:
        state: PipelineState = {
            "symbols": symbols,
            "history": history,
            "as_of": as_of,
            "recommendation": None,
            "exchanges": exchanges or {},
        }
        final_state = self.graph.invoke(state)
        ranked = final_state.get("ranked", [])
        recommendation = final_state.get("recommendation")
        summary_headings = final_state.get("summary_headings", {})
        summary_texts = final_state.get("summary_texts", {})
        summary_sources = final_state.get("summary_sources", {})
        return PipelineResult(
            ranked=ranked,
            recommendation=recommendation,
            summary_headings=summary_headings,
            summary_texts=summary_texts,
            summary_sources=summary_sources,
        )

    def _generate_summary_node(self, state: PipelineState, **kwargs) -> PipelineState:
        symbols = state.get("symbols", [])
        exchanges = state.get("exchanges", {})
        data = self.summary_provider.generate(symbols, exchanges) if symbols else {}
        headings: dict[str, str] = {}
        summaries: dict[str, str] = {}
        sources: dict[str, list[NewsHeadline]] = {}
        for symbol, (heading, summary, source_items) in data.items():
            if heading:
                headings[symbol] = heading
            if summary:
                summaries[symbol] = summary
            if source_items:
                sources[symbol] = source_items
        return {
            "summary_headings": headings,
            "summary_texts": summaries,
            "summary_sources": sources,
        }

    def _summarize_node(self, state: PipelineState, **kwargs) -> PipelineState:
        headings = dict(state.get("summary_headings", {}))
        summaries = dict(state.get("summary_texts", {}))
        sources = dict(state.get("summary_sources", {}))
        for symbol in state.get("symbols", []):
            summaries.setdefault(symbol, f"No verified summary available for {symbol}.")
            headings.setdefault(symbol, symbol)
            sources.setdefault(symbol, [])
        return {
            "summary_headings": headings,
            "summary_texts": summaries,
            "summary_sources": sources,
        }

    def _sentiment_node(self, state: PipelineState, **kwargs) -> PipelineState:
        price_changes = state.get("price_changes", {})
        summaries = state.get("summary_texts", {})
        sentiment: dict[str, float] = {}
        for symbol in state.get("symbols", []):
            summary_text = summaries.get(symbol, "")
            price_change = float(price_changes.get(symbol, 0.0))
            base_score = _estimate_sentiment(summary_text)

            if self.llm_client and summary_text:
                llm_score = self.llm_client.sentiment_with_price(symbol, [summary_text], price_change)
                if llm_score is not None:
                    sentiment[symbol] = llm_score
                    continue

            price_component = 0.0
            if price_change < 0:
                price_component = max(-1.0, price_change / 10.0)
            elif price_change > 0:
                price_component = min(1.0, price_change / 20.0)
            combined = base_score + price_component
            sentiment[symbol] = max(-1.0, min(1.0, combined))
        return {"sentiment": sentiment}

    def _price_node(self, state: PipelineState, **kwargs) -> PipelineState:
        symbols = state.get("symbols", [])
        exchanges = state.get("exchanges", {})
        info = self.price_provider.fetch(symbols, exchanges) if symbols else {}
        price_changes: dict[str, float] = {}
        last_prices: dict[str, float] = {}
        for symbol, details in info.items():
            price_changes[symbol] = float(details.get("change_pct", 0.0))
            last = details.get("last_price")
            if last is not None:
                last_prices[symbol] = float(last)
        return {"price_changes": price_changes, "last_prices": last_prices}

    def _rank_node(self, state: PipelineState, **kwargs) -> PipelineState:
        symbols = state.get("symbols", [])
        price_changes = state.get("price_changes", {})
        last_prices = state.get("last_prices", {})
        sentiment = state.get("sentiment", {})
        summary_headings = state.get("summary_headings", {})
        summary_texts = state.get("summary_texts", {})
        summary_sources = state.get("summary_sources", {})

        ranked_items: list[RankedSymbol] = []
        tmp: list[tuple[float, RankedSymbol]] = []
        for symbol in symbols:
            price_change = float(price_changes.get(symbol, 0.0))
            sentiment_score = float(sentiment.get(symbol, 0.0))
            bias = compute_opportunity_score(price_change, sentiment_score, self.weights)
            headlines = summary_sources.get(symbol, [])
            tmp.append(
                (
                    bias,
                    RankedSymbol(
                        symbol=symbol,
                        opportunity_score=bias,
                        price_change_pct=price_change,
                        last_price=last_prices.get(symbol),
                        sentiment_score=sentiment_score,
                        rank=0,
                        headlines=headlines,
                        overview_summary=summary_texts.get(symbol),
                        overview_heading=summary_headings.get(symbol),
                    ),
                )
            )

        tmp.sort(key=lambda item: item[0], reverse=True)
        for idx, (_, ranked) in enumerate(tmp, start=1):
            ranked.rank = idx
            ranked.sentiment_label = _label_for_sentiment(ranked.sentiment_score)
            ranked_items.append(ranked)

        return {"ranked": ranked_items}

    def _recommend_node(self, state: PipelineState, **kwargs) -> PipelineState:
        ranked = state.get("ranked", [])
        history = state.get("history", [])
        as_of: date = state.get("as_of", date.today())
        recommendation = select_recommendation(ranked, history, as_of, self.huge_correction_threshold)
        return {"recommendation": recommendation}
