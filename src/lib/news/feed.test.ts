import { describe, expect, it } from "vitest";

import {
  EXCERPT_LENGTH,
  decodeEntities,
  frenchSpacing,
  keepRecent,
  mergeArticles,
  parseFeed,
  plainText,
  toArticles,
  truncate,
  type Article,
} from "./feed";
import type { NewsSource } from "./sources";

const english: NewsSource = {
  id: "en",
  name: "Site EN",
  lang: "en",
  feedUrl: "https://example.com/feed",
};
const french: NewsSource = {
  id: "fr",
  name: "Site FR",
  lang: "fr",
  feedUrl: "https://example.fr/feed",
  match: /league of legends|\bworlds\b/i,
};

const feed = (items: string) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel><title>Flux</title><link>https://example.com</link><description>Test</description>${items}</channel>
</rss>`;

const ITEM = `<item>
  <title><![CDATA[Faker &amp; Chovy : l’échiquier signé]]></title>
  <link>https://example.com/articles/echiquier</link>
  <dc:creator>Rédaction</dc:creator>
  <pubDate>Sun, 18 Oct 2026 14:30:00 +0000</pubDate>
  <category><![CDATA[League of Legends]]></category>
  <category>Esports</category>
  <description><![CDATA[<p>Un échiquier signé par <strong>Faker</strong> et Chovy est mis en vente.</p>]]></description>
  <media:thumbnail url="https://cdn.example.com/echiquier.jpg?w=640&amp;q=80" />
</item>`;

describe("parseFeed", () => {
  it("lit les articles d'un flux RSS 2.0", () => {
    const [item, ...rest] = parseFeed(feed(ITEM));
    expect(rest).toHaveLength(0);
    expect(item?.link).toBe("https://example.com/articles/echiquier");
    expect(item?.category).toEqual(["League of Legends", "Esports"]);
    expect(item?.["media:thumbnail"]).toHaveLength(1);
  });

  it("accepte un flux vide", () => {
    expect(parseFeed(feed(""))).toEqual([]);
  });

  it("ignore un article illisible sans perdre les autres", () => {
    expect(
      parseFeed(feed(`<item><description>sans titre</description></item>${ITEM}`)),
    ).toHaveLength(1);
  });

  it("refuse ce qui n'est pas un flux RSS", () => {
    expect(() => parseFeed("<html><body>Page</body></html>")).toThrow();
  });

  it("garde le texte tel quel (un titre en chiffres reste du texte)", () => {
    const [item] = parseFeed(
      feed(`<item><title>2026</title><link>https://example.com/a</link></item>`),
    );
    expect(item?.title).toBe("2026");
  });
});

describe("toArticles", () => {
  it("donne titre, extrait sans HTML, date, image et source", () => {
    const [article] = toArticles(english, parseFeed(feed(ITEM)));
    expect(article).toEqual({
      url: "https://example.com/articles/echiquier",
      title: "Faker & Chovy : l’échiquier signé",
      excerpt: "Un échiquier signé par Faker et Chovy est mis en vente.",
      publishedAt: new Date("2026-10-18T14:30:00Z"),
      imageUrl: "https://cdn.example.com/echiquier.jpg?w=640&q=80",
      publisher: "Site EN",
      source: { id: "en", name: "Site EN", lang: "en" },
    });
  });

  it("raccourcit un long extrait et retire la mention ajoutée par WordPress", () => {
    const long = "Mot ".repeat(100);
    const items = parseFeed(
      feed(`<item><title>A</title><link>https://example.com/a</link>
        <description>${long}The post A appeared first on Site.</description></item>`),
    );
    const [article] = toArticles(english, items);
    expect(article!.excerpt.length).toBeLessThanOrEqual(EXCERPT_LENGTH + 1);
    expect(article!.excerpt.endsWith("…")).toBe(true);
    expect(article!.excerpt).not.toContain("appeared first");
  });

  it("écarte les liens qui ne sont pas des adresses web", () => {
    const items = parseFeed(
      feed(`<item><title>A</title><link>javascript:alert(1)</link></item>
            <item><title>B</title><link>/relatif</link></item>`),
    );
    expect(toArticles(english, items)).toEqual([]);
  });

  it("n'accepte que des images en https", () => {
    const items = parseFeed(
      feed(`<item><title>A</title><link>https://example.com/a</link>
        <enclosure url="http://cdn.example.com/a.jpg" type="image/jpeg" length="1" /></item>`),
    );
    expect(toArticles(english, items)[0]?.imageUrl).toBeNull();
  });

  it("prend l'image jointe quand il n'y a pas de vignette", () => {
    const items = parseFeed(
      feed(`<item><title>A</title><link>https://example.com/a</link>
        <enclosure url="https://cdn.example.com/a.mp3" type="audio/mpeg" length="1" />
        <enclosure url="https://cdn.example.com/a.jpg" type="image/jpeg" length="1" /></item>`),
    );
    expect(toArticles(english, items)[0]?.imageUrl).toBe("https://cdn.example.com/a.jpg");
  });

  it("filtre un flux généraliste sur le titre ou les catégories", () => {
    const items = parseFeed(
      feed(`<item><title>Le patch de GTA</title><link>https://example.fr/gta</link><category>GTA</category></item>
            <item><title>Programme des Worlds</title><link>https://example.fr/worlds</link></item>
            <item><title>Nouveau skin</title><link>https://example.fr/skin</link><category>League of Legends</category></item>`),
    );
    expect(toArticles(french, items).map((article) => article.url)).toEqual([
      "https://example.fr/worlds",
      "https://example.fr/skin",
    ]);
  });

  it("lit un agrégateur : site d'origine, titre sans suffixe, pas d'extrait", () => {
    const aggregator: NewsSource = {
      id: "gnews",
      name: "Google Actualités",
      lang: "fr",
      feedUrl: "https://news.google.com/rss",
      aggregator: true,
    };
    const items = parseFeed(
      feed(`<item>
        <title>Worlds 2026 : la KC en phase suisse - Millenium</title>
        <link>https://news.google.com/rss/articles/abc?oc=5</link>
        <pubDate>Mon, 19 Oct 2026 07:00:00 GMT</pubDate>
        <description>&lt;a href="https://news.google.com/rss/articles/abc"&gt;Worlds 2026 : la KC en phase suisse&lt;/a&gt;&amp;nbsp;&amp;nbsp;&lt;font color="#6f6f6f"&gt;Millenium&lt;/font&gt;</description>
        <source url="https://www.millenium.org">Millenium</source>
      </item>`),
    );
    const [article] = toArticles(aggregator, items);
    expect(article?.publisher).toBe("Millenium");
    expect(article?.title).toBe("Worlds 2026\u00a0: la KC en phase suisse");
    expect(article?.excerpt).toBe("");
    expect(article?.url).toBe("https://news.google.com/rss/articles/abc?oc=5");
  });

  it("laisse la date vide quand elle est illisible", () => {
    const items = parseFeed(
      feed(
        `<item><title>A</title><link>https://example.com/a</link><pubDate>bientôt</pubDate></item>`,
      ),
    );
    expect(toArticles(english, items)[0]?.publishedAt).toBeNull();
  });
});

describe("mise en forme du texte", () => {
  it("décode les entités nommées et numériques", () => {
    expect(decodeEntities("l&#8217;&eacute;quipe &amp; co &#x2014; &inconnue;")).toBe(
      "l’équipe & co — &inconnue;",
    );
  });

  it("retire les balises et regroupe les espaces, sauf les insécables", () => {
    expect(plainText("<p>Un</p>\n<p>deux&nbsp;trois</p>")).toBe("Un deux\u00a0trois");
  });

  it("met les espaces insécables de la typographie française", () => {
    expect(frenchSpacing("Worlds : qui gagne ? « KC » !")).toBe(
      "Worlds\u00a0: qui gagne\u00a0? «\u00a0KC\u00a0»\u00a0!",
    );
  });

  it("applique la typographie française aux seuls articles en français", () => {
    const items = parseFeed(
      feed(`<item><title>Worlds : le programme</title><link>https://example.fr/a</link></item>`),
    );
    expect(toArticles(french, items)[0]?.title).toBe("Worlds\u00a0: le programme");
    expect(toArticles(english, items)[0]?.title).toBe("Worlds : le programme");
  });

  it("coupe à la fin d'un mot", () => {
    expect(truncate("Karmine Corp gagne la finale", 16)).toBe("Karmine Corp…");
    expect(truncate("Court", 16)).toBe("Court");
  });
});

describe("keepRecent", () => {
  const at = (date: string | null): Article => ({
    url: date ?? "sans-date",
    title: "",
    excerpt: "",
    publishedAt: date ? new Date(date) : null,
    imageUrl: null,
    publisher: "Site EN",
    source: { id: "en", name: "Site EN", lang: "en" },
  });

  it("ne garde que les articles de moins de deux semaines, datés", () => {
    const now = new Date("2026-10-19T12:00:00Z");
    const kept = keepRecent(
      [
        at("2026-10-19T08:00:00Z"),
        at("2026-10-06T12:00:00Z"),
        at("2026-08-12T12:00:00Z"),
        at(null),
      ],
      now,
    );
    expect(kept.map((article) => article.url)).toEqual([
      "2026-10-19T08:00:00Z",
      "2026-10-06T12:00:00Z",
    ]);
  });
});

describe("mergeArticles", () => {
  const article = (url: string, date: string | null): Article => ({
    url,
    title: url,
    excerpt: "",
    publishedAt: date ? new Date(date) : null,
    imageUrl: null,
    publisher: "Site EN",
    source: { id: "en", name: "Site EN", lang: "en" },
  });

  it("trie du plus récent au plus ancien, sans doublon, dans la limite", () => {
    const merged = mergeArticles(
      [
        [article("a", "2026-10-17"), article("b", "2026-10-19")],
        [article("c", "2026-10-18"), article("a", "2026-10-17"), article("d", null)],
      ],
      3,
    );
    expect(merged.map((item) => item.url)).toEqual(["b", "c", "a"]);
  });
});
