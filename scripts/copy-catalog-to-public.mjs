import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "data");

fs.mkdirSync(outDir, { recursive: true });

for (const file of ["products.json", "config.json", "faq.json"]) {
  fs.copyFileSync(path.join(root, "data", file), path.join(outDir, file));
}

console.log("Copied data/*.json → public/data/");
