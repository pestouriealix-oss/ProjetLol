import { ArrowUpRight, CircleAlert } from "lucide-react";
import type { Metadata } from "next";
import { z } from "zod";

import { PageShell } from "@/components/layout/page-shell";
import { ArticleList } from "@/components/news/article-list";
import { PatchList } from "@/components/news/patch-list";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { ErrorNotice } from "@/components/ui/notice";
import { Panel } from "@/components/ui/panel";
import { TabLinks } from "@/components/ui/tab-links";
import { t } from "@/i18n/fr";
import { requireUser } from "@/lib/auth/session";
import type { Patch } from "@/lib/ddragon/patch-list";
import { listPatches } from "@/lib/ddragon/patches";
import { listArticles, type ArticleList as Articles } from "@/lib/news";

export const metadata: Metadata = { title: t.news.title };

const copy = t.news;

const VIEWS = ["articles", "patchs"] as const;
const LANGUAGES = ["tout", "fr", "en"] as const;
type View = (typeof VIEWS)[number];
type Language = (typeof LANGUAGES)[number];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const viewParam = z.enum(VIEWS).catch("articles");
const languageParam = z.enum(LANGUAGES).catch("tout");

type NewsSearchParams = Promise<{ vue?: string | string[]; langue?: string | string[] }>;

const href = (view: View, language: Language = "tout") =>
  view === "patchs"
    ? "/news?vue=patchs"
    : language === "tout"
      ? "/news"
      : `/news?langue=${language}`;

export default async function NewsPage({ searchParams }: { searchParams: NewsSearchParams }) {
  await requireUser();
  const params = await searchParams;
  const view = viewParam.parse(first(params.vue) ?? "articles");
  const language = languageParam.parse(first(params.langue) ?? "tout");

  return (
    <PageShell route="news" title={copy.title}>
      <p className="-mt-4 max-w-[60ch] text-lg text-ink-muted">{copy.intro}</p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabLinks
              label={copy.views.label}
              current={view}
              items={[
                { key: "articles", label: copy.views.articles, href: href("articles", language) },
                { key: "patchs", label: copy.views.patches, href: href("patchs") },
              ]}
            />
            {view === "articles" ? (
              <TabLinks
                label={copy.languages.label}
                current={language}
                items={LANGUAGES.map((key) => ({
                  key,
                  label: copy.languages[key === "tout" ? "all" : key],
                  href: href("articles", key),
                }))}
              />
            ) : null}
          </div>

          {view === "articles" ? <ArticlesView language={language} /> : <PatchesView />}
        </div>

        <Panel className="p-5">
          <h2 className="display text-xl text-ink">{copy.official.title}</h2>
          <ul className="flex flex-col pt-2">
            {copy.official.links.map((link) => (
              <li key={link.href} className="border-t border-line first:border-t-0">
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between gap-3 py-3 font-semibold text-ink-muted transition-colors duration-(--duration-fast) hover:text-ink"
                >
                  {link.label}
                  <ArrowUpRight
                    aria-hidden
                    className="size-4 shrink-0 text-ink-faint transition-colors duration-(--duration-fast) group-hover:text-accent"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </PageShell>
  );
}

async function PatchesView() {
  // Riot peut ne pas répondre : la page s'affiche quand même, avec ses liens.
  let patches: Patch[] | null;
  try {
    patches = await listPatches();
  } catch (error) {
    console.error("Liste des patchs indisponible", error);
    patches = null;
  }
  return (
    <div className="flex flex-col gap-8">
      <PatchList patches={patches} />
    </div>
  );
}

async function ArticlesView({ language }: { language: Language }) {
  const { articles, failed }: Articles = await listArticles();
  const shown =
    language === "tout" ? articles : articles.filter((article) => article.source.lang === language);
  const allFailed = articles.length === 0 && failed.length > 0;

  return (
    <section aria-labelledby="articles-title" className="flex flex-col gap-3">
      <h2 id="articles-title" className="sr-only">
        {copy.articles.title}
      </h2>

      {allFailed ? (
        <div>
          <p className="display text-2xl text-ink">{copy.articles.errorTitle}</p>
          <ErrorNotice className="mt-3">{copy.articles.errorBody}</ErrorNotice>
        </div>
      ) : (
        <>
          {failed.length > 0 ? (
            <p className="flex items-start gap-2 rounded-control border border-warn/40 bg-warn-soft px-3 py-2.5 text-sm text-ink">
              <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-warn" />
              {copy.articles.partial(failed.map((source) => source.name).join(", "), failed.length)}
            </p>
          ) : null}

          {shown.length > 0 ? (
            <ArticleList articles={shown} now={new Date()} />
          ) : articles.length > 0 ? (
            <Panel className="flex flex-col items-start gap-3 p-6">
              <p className="display text-2xl text-ink">{copy.articles.emptyLanguageTitle}</p>
              <p className="text-ink-muted">{copy.articles.emptyLanguageBody}</p>
              <Button asChild variant="secondary">
                <Link href={href("articles")} scroll={false}>
                  {copy.articles.showAll}
                </Link>
              </Button>
            </Panel>
          ) : (
            <Panel className="flex flex-col gap-2 p-6">
              <p className="display text-2xl text-ink">{copy.articles.emptyTitle}</p>
              <p className="text-ink-muted">{copy.articles.emptyBody}</p>
            </Panel>
          )}
        </>
      )}

      <p className="text-xs text-ink-faint">{copy.articles.credit}</p>
    </section>
  );
}
