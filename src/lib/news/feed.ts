import { XMLParser } from "fast-xml-parser";
import { z } from "zod";

import type { NewsSource } from "./sources";

/**
 * Lecture d'un flux RSS 2.0 et mise en forme des articles. Rien ici ne touche
 * au réseau : ces fonctions se testent avec un texte XML.
 */

export type Article = {
  /** L'adresse de l'article, qui sert aussi d'identifiant. */
  url: string;
  title: string;
  /** Une ou deux phrases au plus, sans HTML. Jamais le texte de l'article. */
  excerpt: string;
  publishedAt: Date | null;
  imageUrl: string | null;
  source: Pick<NewsSource, "id" | "name" | "lang">;
};

/** Longueur maximale de l'extrait, en caractères. */
export const EXCERPT_LENGTH = 180;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  // Tout reste du texte : un titre « 2026 » ne doit pas devenir un nombre.
  parseTagValue: false,
  parseAttributeValue: false,
  // Les entités (&amp;, &#8217;…) sont décodées plus bas, une seule fois.
  processEntities: false,
  isArray: (name) => name === "item" || name === "category",
});

/** Texte d'une balise : chaîne simple, ou objet quand elle porte des attributs. */
const text = z
  .union([z.string(), z.object({ "#text": z.string() })])
  .transform((value) => (typeof value === "string" ? value : value["#text"]));

const withUrl = z.object({ "@_url": z.string(), "@_type": z.string().optional() });
const oneOrMany = <Schema extends z.ZodType>(schema: Schema) =>
  z.union([schema, z.array(schema)]).transform((value) => (Array.isArray(value) ? value : [value]));

const itemSchema = z.object({
  title: text,
  link: text,
  pubDate: text.optional(),
  description: text.optional(),
  category: z.array(text).optional(),
  "media:thumbnail": oneOrMany(withUrl).optional(),
  "media:content": oneOrMany(withUrl).optional(),
  enclosure: oneOrMany(withUrl).optional(),
});

const feedSchema = z.object({
  rss: z.object({
    channel: z.object({ item: z.array(z.unknown()).optional() }),
  }),
});

export type FeedItem = z.infer<typeof itemSchema>;

/**
 * Les articles d'un flux. Un flux illisible lève une erreur ; un article
 * illisible est simplement ignoré, pour ne pas perdre tout le flux.
 */
export function parseFeed(xml: string): FeedItem[] {
  const feed = feedSchema.parse(parser.parse(xml));
  return (feed.rss.channel.item ?? []).flatMap((item) => {
    const parsed = itemSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
  laquo: "«",
  raquo: "»",
  ndash: "–",
  mdash: "—",
  eacute: "é",
  egrave: "è",
  agrave: "à",
  ccedil: "ç",
};

/** Décode les entités HTML courantes. Une entité inconnue reste telle quelle. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code: string) => {
    if (code.startsWith("#")) {
      const point =
        code[1] === "x" || code[1] === "X"
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
      return Number.isFinite(point) && point > 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : entity;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? entity;
  });
}

/** Texte brut : sans balises, sans entités, espaces ordinaires regroupés. */
export function plainText(value: string): string {
  return (
    decodeEntities(value.replace(/<[^>]*>/g, " "))
      // Les espaces insécables (typographie française) sont gardés.
      .replace(/[^\S\u00a0\u202f]+/g, " ")
      .trim()
  );
}

/**
 * Typographie française : espace insécable avant « : ; ! ? » et à l'intérieur
 * des guillemets, pour qu'un signe ne se retrouve jamais seul en début de ligne.
 */
export function frenchSpacing(value: string): string {
  return value.replace(/ ([:;!?»])/g, "\u00a0$1").replace(/« /g, "«\u00a0");
}

/** Coupe à la fin d'un mot, avant `length`, et ajoute « … ». */
export function truncate(value: string, length: number): string {
  if (value.length <= length) return value;
  const cut = value.slice(0, length);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > length * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** Une adresse web absolue (http ou https), ou null. */
function webUrl(value: string | undefined, { httpsOnly = false } = {}): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:" || (!httpsOnly && url.protocol === "http:"))
      return url.toString();
  } catch {
    // Adresse invalide : ignorée.
  }
  return null;
}

/** Phrase ajoutée par WordPress à la fin des extraits (« The post … appeared first on … »). */
const WORDPRESS_FOOTER = /\s*The post .* appeared first on .*$/i;

function imageOf(item: FeedItem): string | null {
  const candidates = [
    ...(item["media:thumbnail"] ?? []),
    ...(item["media:content"] ?? []).filter(
      (media) => !media["@_type"] || media["@_type"].startsWith("image/"),
    ),
    ...(item.enclosure ?? []).filter((media) => media["@_type"]?.startsWith("image/")),
  ];
  for (const candidate of candidates) {
    // Uniquement en https : une image en http serait bloquée par le navigateur.
    const url = webUrl(decodeEntities(candidate["@_url"]), { httpsOnly: true });
    if (url) return url;
  }
  return null;
}

/** Les articles d'une source, prêts à afficher. */
export function toArticles(source: NewsSource, items: FeedItem[]): Article[] {
  return items.flatMap((item) => {
    const url = webUrl(decodeEntities(item.link));
    const tidy = (value: string) =>
      source.lang === "fr" ? frenchSpacing(plainText(value)) : plainText(value);
    const title = tidy(item.title);
    if (!url || title === "") return [];

    if (source.match) {
      const topics = [title, ...(item.category ?? []).map(plainText)];
      if (!topics.some((topic) => source.match!.test(topic))) return [];
    }

    const published = item.pubDate ? new Date(item.pubDate) : null;
    return [
      {
        url,
        title,
        excerpt: truncate(
          tidy(item.description ?? "").replace(WORDPRESS_FOOTER, ""),
          EXCERPT_LENGTH,
        ),
        publishedAt: published && !Number.isNaN(published.getTime()) ? published : null,
        imageUrl: imageOf(item),
        source: { id: source.id, name: source.name, lang: source.lang },
      },
    ];
  });
}

/** Au-delà de cet âge, un article n'est plus une actu : il n'est pas affiché. */
export const MAX_ARTICLE_AGE_DAYS = 14;

/**
 * Les articles publiés depuis moins de `maxAgeDays` jours. Un article sans date
 * lisible est écarté : rien ne garantit qu'il soit récent.
 */
export function keepRecent(
  articles: Article[],
  now: Date,
  maxAgeDays: number = MAX_ARTICLE_AGE_DAYS,
): Article[] {
  const oldest = now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000;
  return articles.filter(
    (article) => article.publishedAt !== null && article.publishedAt.getTime() >= oldest,
  );
}

/**
 * Regroupe les articles de toutes les sources : du plus récent au plus ancien,
 * sans doublon (même adresse), dans la limite donnée.
 */
export function mergeArticles(lists: Article[][], limit: number): Article[] {
  const seen = new Set<string>();
  return lists
    .flat()
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))
    .filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    })
    .slice(0, limit);
}
