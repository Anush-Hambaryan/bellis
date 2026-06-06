import { tool } from "langchain";
import { z } from "zod";

type BraveImageResult = {
  type: string;
  title: string;
  url: string;
  source: string;
  page_fetched: string;
  thumbnail: { src: string; width: number; height: number };
  properties: { url: string; placeholder: string; width: number; height: number };
  meta_url: { scheme: string; netloc: string; hostname: string; favicon: string; path: string };
  confidence: "high" | "medium" | "low";
};

export type BraveImageSearchResponse = {
  type: "images";
  query: { original: string; altered: string; spellcheck_off: boolean; show_strict_warning: boolean };
  results: BraveImageResult[];
  extra: { might_be_offensive: boolean };
};

export const imageSearch = tool(
  async ({ word }) => {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/images/search?q=${encodeURIComponent(word.trim())}&count=5&safesearch=strict`,
      {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "gzip",
          "X-Subscription-Token": process.env.BRAVE_API_KEY ?? "",
        },
      }
    );
    if (!res.ok) return `No images found for "${word}".`;

    const data: BraveImageSearchResponse = await res.json();

    if (!data.results || !Array.isArray(data.results) || data.results.length === 0)
      return `No images found for "${word}".`;

    return data.results.map(({ title, url, thumbnail, properties, confidence }) => ({
      title,
      url,
      thumbnailSrc: thumbnail.src,
      imageUrl: properties.url,
      confidence,
    }));
  },
  {
    name: "image_search",
    description:
      "Search for images illustrating an English word or concept. Returns titles, page URLs, and thumbnail URLs.",
    schema: z.object({
      word: z.string().describe("The English word or phrase to search images for"),
    }),
  }
);
