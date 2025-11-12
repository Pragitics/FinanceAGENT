import type { NewsHeadline } from "@financeagent/shared";
import { twMerge } from "tailwind-merge";

type HeadlineListProps = {
  headlines: NewsHeadline[];
  className?: string;
};

export function HeadlineList({ headlines, className }: HeadlineListProps) {
  if (!headlines.length) {
    return <p className={twMerge("text-sm text-slate-400", className)}>No recent headlines.</p>;
  }
  return (
    <div className={twMerge("space-y-3", className)}>
      {headlines.map((item) => (
        <article key={item.url} className="space-y-1 border-b border-slate-800 pb-3 last:border-none last:pb-0">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="block text-sm font-semibold text-sky-300 hover:text-sky-200"
          >
            {item.headline}
          </a>
          {item.summary && <p className="text-xs text-slate-300">{item.summary}</p>}
          <div className="text-[0.7rem] text-slate-500">
            Source: {item.source ?? "Perplexity"} ·{" "}
            <a href={item.url} target="_blank" rel="noreferrer" className="underline decoration-slate-600 hover:text-sky-200">
              View article
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
