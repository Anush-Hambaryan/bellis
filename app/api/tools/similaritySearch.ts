import { tool } from "langchain";
import { z } from "zod";
import { vectorStore } from "@/app/lib/vectorStore";

const RESULT_LIMIT = 3;
const CANDIDATE_LIMIT = 4;

export const similaritySearch = tool(
  async ({ word, filter }) => {
    const hits = await vectorStore
      .similaritySearchWithScore(word, CANDIDATE_LIMIT, filter)
      .catch(() => []);

    return hits
      .filter(([doc]) => {
        const storedWord = typeof doc.metadata.normalizedWord === "string"
          ? doc.metadata.normalizedWord
          : doc.pageContent;
        return storedWord !== word;
      })
      .slice(0, RESULT_LIMIT);
  },
  {
    name: "similarity_search",
    description: "Fetch past searches similar to the current word",
    schema: z.object({
      word: z.string().describe("The English word or phrase the user is looking up."),
      filter: z.object({ userEmail: z.string() }).optional(),
    }),
  }
);
