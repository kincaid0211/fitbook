import fs from "node:fs";

const css = fs.readFileSync("src/styles.css", "utf8");
const mock = fs
  .readFileSync("src/mockData.js", "utf8")
  .replace(/^export const sampleUrl/m, "const sampleUrl")
  .replace(/^export const adventure/m, "const adventure");
const app = fs
  .readFileSync("src/app.js", "utf8")
  .replace('import { adventure, sampleUrl } from "./mockData.js";\n\n', "");

const standalone = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>知识历险</title>
    <style>${css}</style>
  </head>
  <body>
    <main id="app"></main>
    <script>${mock}\n\n${app}</script>
  </body>
</html>
`;

fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/demo.html", standalone);
console.log("Generated dist/demo.html");

