import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/faq")({
  component: FaqPage,
});

function FaqPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">FAQ</h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Frequently asked questions — coming soon.
      </p>
    </div>
  );
}
