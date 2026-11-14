/**
 * Copie locale de Data Dragon, pour les sessions de développement qui ne peuvent
 * pas joindre ddragon.leagueoflegends.com (environnement cloud sans accès).
 *
 *   npm run ddragon:mirror
 *
 * Télécharge le dernier patch : données en français, portraits, splash arts,
 * objets, sorts, runes. Le tout est rangé dans `.ddragon/` avec les mêmes chemins
 * que le CDN, puis archivé dans `ddragon-mirror.tgz` (une seule pièce à transférer).
 *
 * Servi par n'importe quel serveur statique, ce dossier remplace le CDN :
 * `DDRAGON_BASE_URL=http://localhost:4015`. Les visuels restent ceux de Data
 * Dragon ; en production, le site lit toujours le CDN de Riot.
 *
 * Relancer le script reprend où il s'était arrêté : les fichiers déjà là sont gardés.
 */
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import { z } from "zod";

/* eslint-disable no-console -- un script en ligne de commande parle dans le terminal. */

// DDRAGON_SOURCE : seulement pour tester le script contre un faux CDN.
const CDN = process.env.DDRAGON_SOURCE ?? "https://ddragon.leagueoflegends.com";
const OUT = ".ddragon";
const ARCHIVE = "ddragon-mirror.tgz";
const PARALLEL = 8;

const Versions = z.array(z.string()).min(1);
const Champions = z.object({ data: z.record(z.string(), z.object({ id: z.string() })) });
const Items = z.object({ data: z.record(z.string(), z.unknown()) });
const Spells = z.object({ data: z.record(z.string(), z.object({ id: z.string() })) });
const Runes = z.array(
  z.object({
    icon: z.string(),
    slots: z.array(z.object({ runes: z.array(z.object({ icon: z.string() })) })),
  }),
);

/** Télécharge un chemin du CDN vers `.ddragon/`, sauf s'il y est déjà. Rend son contenu. */
async function fetchPath(path: string, attempts = 3): Promise<Buffer> {
  const target = join(OUT, path);
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await fetch(`${CDN}/${path}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const body = Buffer.from(await response.arrayBuffer());
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, body);
      return body;
    } catch (error) {
      if (attempt >= attempts) throw new Error(`${path} : ${String(error)}`);
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

async function json<T>(path: string, schema: z.ZodType<T>): Promise<T> {
  const body = await fetchPath(path);
  return schema.parse(JSON.parse(body.toString("utf8")));
}

/** Télécharge une liste de chemins, quelques-uns à la fois, en sautant ceux déjà présents. */
async function fetchAll(label: string, paths: string[]): Promise<void> {
  const todo = paths.filter((path) => !existsSync(join(OUT, path)));
  const failed: string[] = [];
  let done = 0;
  const queue = [...todo];
  await Promise.all(
    Array.from({ length: PARALLEL }, async () => {
      for (let path = queue.shift(); path; path = queue.shift()) {
        try {
          await fetchPath(path);
        } catch {
          failed.push(path);
        }
        done += 1;
        process.stdout.write(`\r${label} : ${done}/${todo.length}   `);
      }
    }),
  );
  const kept = paths.length - todo.length;
  console.log(
    `\r${label} : ${todo.length - failed.length} téléchargés${kept ? `, ${kept} déjà là` : ""}${
      failed.length ? `, ${failed.length} introuvables` : ""
    }`,
  );
}

async function main() {
  const versions = await json("api/versions.json", Versions);
  const version = versions[0]!;
  console.log(`Data Dragon, patch ${version}\n`);
  const data = `cdn/${version}/data/fr_FR`;

  const champions = await json(`${data}/champion.json`, Champions);
  const items = await json(`${data}/item.json`, Items);
  const spells = await json(`${data}/summoner.json`, Spells);
  const runes = await json(`${data}/runesReforged.json`, Runes);
  const ids = Object.values(champions.data).map((champion) => champion.id);

  await fetchAll(
    "Fiches des champions",
    ids.map((id) => `${data}/champion/${id}.json`),
  );
  await fetchAll(
    "Portraits",
    ids.map((id) => `cdn/${version}/img/champion/${id}.png`),
  );
  await fetchAll(
    "Splash arts",
    ids.map((id) => `cdn/img/champion/splash/${id}_0.jpg`),
  );
  await fetchAll(
    "Objets",
    Object.keys(items.data).map((id) => `cdn/${version}/img/item/${id}.png`),
  );
  await fetchAll(
    "Sorts d'invocateur",
    Object.values(spells.data).map((spell) => `cdn/${version}/img/spell/${spell.id}.png`),
  );
  await fetchAll(
    "Runes",
    runes.flatMap((style) => [
      `cdn/img/${style.icon}`,
      ...style.slots.flatMap((slot) => slot.runes.map((rune) => `cdn/img/${rune.icon}`)),
    ]),
  );
  // Les premières icônes d'invocateur : celles des comptes neufs et de la démo.
  await fetchAll(
    "Icônes de profil",
    Array.from({ length: 30 }, (_, id) => `cdn/${version}/img/profileicon/${id}.png`),
  );

  // tar existe sur Windows 10 et 11, macOS et Linux.
  execFileSync("tar", ["-czf", ARCHIVE, "-C", OUT, "."], { stdio: "inherit" });
  console.log(`\nArchive prête : ${ARCHIVE}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
