import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/translate")({
  head: () => ({
      meta: [
          { title: "AI Translator — translate text between 30+ languages" },
          {
              name: "description",
              content: "Free AI-powered translator. Translate text between 30+ languages with natural, formal, casual, or literal tones.",
          },
      ],
  }),
});
