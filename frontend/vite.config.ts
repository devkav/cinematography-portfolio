import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const SITE_URL = "https://maggieclucy.com";

interface PagePreview {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
}

// Link previews (iMessage, Slack, etc.) don't run JavaScript, so pages with their own preview get a
// copy of index.html with these tags swapped in. Each is written to dist/<path> with no extension so
// CloudFront serves it for that URL instead of falling back to index.html.
const PAGE_PREVIEWS: Record<string, PagePreview> = {
  "adrenaline-rush": {
    title: "Adrenaline Rush | Maggie Lucy",
    description: "An experimental virtual production short film shot on RIT's LED volume at MAGIC Spell Studios.",
    image: "https://d3amd0zp63qrni.cloudfront.net/assets/images/film-pages/adrenaline-rush/preview.jpg",
    imageAlt: "A driver behind the wheel with neon light streaking past, from Adrenaline Rush"
  }
};

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function setTag(html: string, attribute: string, key: string, value: string) {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${key}"\\s+content=")[^"]*(")`);

  if (!pattern.test(html)) {
    throw new Error(`index.html is missing <meta ${attribute}="${key}">`);
  }

  return html.replace(pattern, `$1${escapeAttribute(value)}$2`);
}

function pagePreviews(): Plugin {
  let outDir = "dist";

  return {
    name: "page-previews",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, "index.html"), "utf8");

      for (const [page, { title, description, image, imageAlt }] of Object.entries(PAGE_PREVIEWS)) {
        let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escapeAttribute(title)}</title>`);

        html = setTag(html, "name", "description", description);
        html = setTag(html, "property", "og:title", title);
        html = setTag(html, "property", "og:description", description);
        html = setTag(html, "property", "og:url", `${SITE_URL}/${page}`);
        html = setTag(html, "property", "og:image", image);
        html = setTag(html, "property", "og:image:alt", imageAlt);
        html = setTag(html, "name", "twitter:title", title);
        html = setTag(html, "name", "twitter:description", description);
        html = setTag(html, "name", "twitter:image", image);

        fs.writeFileSync(path.join(outDir, page), html);
      }
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pagePreviews()],
  define: {
    global: "globalThis"
  }
});
