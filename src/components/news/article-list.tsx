import { ArrowUpRight } from "lucide-react";

import { t } from "@/i18n/fr";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/format";
import type { Article } from "@/lib/news";

import { ArticleThumb } from "./article-thumb";

const copy = t.news.articles;

/**
 * Les articles, du plus récent au plus ancien : vignette, source, langue,
 * date, titre et deux lignes d'extrait. Chaque ligne mène à l'article, sur le
 * site qui l'a publié.
 */
export function ArticleList({ articles, now }: { articles: Article[]; now: Date }) {
  return (
    <ul className="flex flex-col gap-2">
      {articles.map((article) => (
        <li key={article.url}>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            title={copy.opensOn(article.publisher)}
            className={cn(
              "group grid items-start gap-4 rounded-panel border border-line bg-surface p-3 transition-colors duration-(--duration-fast) ease-(--ease-out) hover:border-line-strong hover:bg-raised sm:p-3.5",
              // Sans vignette (la plupart des articles d'agrégateur), la ligne reste compacte.
              article.imageUrl
                ? "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[10rem_minmax(0,1fr)]"
                : "grid-cols-[minmax(0,1fr)]",
            )}
          >
            {article.imageUrl ? (
              <ArticleThumb
                src={article.imageUrl}
                className="order-last aspect-[4/3] w-20 sm:order-first sm:aspect-video sm:w-40"
              />
            ) : null}
            <div className="flex min-w-0 flex-col gap-1">
              <p className="flex items-center gap-2 text-xs text-ink-faint">
                <span className="truncate font-semibold text-ink-muted">{article.publisher}</span>
                <span className="rounded-[4px] border border-line-strong px-1 text-[0.625rem] leading-4 font-bold tracking-[0.04em] text-ink-muted">
                  {copy.langTag[article.source.lang]}
                </span>
                {article.publishedAt ? (
                  <time dateTime={article.publishedAt.toISOString()} className="whitespace-nowrap">
                    {formatRelative(article.publishedAt, now)}
                  </time>
                ) : null}
                <ArrowUpRight
                  aria-hidden
                  className="ml-auto size-4 shrink-0 transition-[translate,color] duration-(--duration-base) ease-(--ease-spring) group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-ink"
                />
              </p>
              <h3 className="line-clamp-3 font-semibold text-ink sm:line-clamp-2 sm:text-lg sm:leading-snug">
                {article.title}
                <span className="sr-only"> ({copy.opensOn(article.publisher)})</span>
              </h3>
              {article.excerpt ? (
                <p className="hidden text-sm text-ink-muted sm:line-clamp-2">{article.excerpt}</p>
              ) : null}
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
