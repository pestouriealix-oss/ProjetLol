/**
 * Fabrique le paquet à envoyer à Overwolf : le dossier dist zippé (manifeste
 * à la racine), renommé en .opk. Le numéro de version vient du manifeste.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";

import JSZip from "jszip";

const dist = new URL("../dist/", import.meta.url).pathname;
const manifest = JSON.parse(await readFile(join(dist, "manifest.json"), "utf8"));
const pkg = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
if (manifest.meta.version !== pkg.version) {
  console.error(`Versions différentes : manifest ${manifest.meta.version}, package.json ${pkg.version}.`);
  process.exit(1);
}

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else yield path;
  }
}

const zip = new JSZip();
for await (const path of files(dist)) {
  zip.file(relative(dist, path).split("\\").join("/"), await readFile(path));
}
const out = new URL(`../gufo-${manifest.meta.version}.opk`, import.meta.url).pathname;
await writeFile(out, await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }));
console.log(`Paquet prêt : ${out}`);
