import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/weather")({
  head: () => ({
      meta: [
          { title: "Local Weather — current conditions and 7-day forecast" },
          {
              name: "description",
              content: "Check your local weather with current conditions, hourly trend, and a 7-day forecast. Free, no sign-up required.",
          },
      ],
  }),
});
