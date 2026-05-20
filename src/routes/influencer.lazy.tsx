import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/influencer")({
  component: InfluencerPage,
});

function InfluencerPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Influencer Program
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Earn rewards by sharing your dining and nightlife experiences — details
        coming soon.
      </p>
    </div>
  );
}
