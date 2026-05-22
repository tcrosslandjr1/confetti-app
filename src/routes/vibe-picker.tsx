import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { VibePicker } from "@/components/VibePicker";

export const Route = createFileRoute("/vibe-picker")({
  component: VibePickerPage,
  head: () => ({
    meta: [
      { title: "Pick your vibe — Confetti" },
      { name: "description", content: "Tap your vibe and let Confetti build the night." },
    ],
  }),
});

function VibePickerPage() {
  const navigate = useNavigate();
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <VibePicker
        onSubmit={(vibes) => {
          navigate({ to: "/plan", search: { vibes: vibes.join(",") } as never });
        }}
      />
    </main>
  );
}
