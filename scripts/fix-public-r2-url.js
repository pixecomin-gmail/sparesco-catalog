const fs = require("fs");
const path = require("path");

const OLD_URL = "https://pub-b8cf8833c33242d391ce938e51d3c590.r2.dev";
const NEW_URL = "https://pub-f66ad83430274d9284d9172bc855e8cd.r2.dev";

const files = [
  "public/data/products-index.json",
  ...fs
    .readdirSync("public/data/products")
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.join("public/data/products", file)),
];

let updated = 0;

for (const file of files) {
  const content = fs.readFileSync(file, "utf8");

  if (!content.includes(OLD_URL)) continue;

  fs.writeFileSync(file, content.split(OLD_URL).join(NEW_URL));
  updated++;
  console.log("updated:", file);
}

console.log(`Done. Updated ${updated} files.`);