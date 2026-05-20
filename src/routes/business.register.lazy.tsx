import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/business/register")({
  component: BusinessRegisterPage,
});

function BusinessRegisterPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-16 text-center">
      <h1 className="text-4xl font-bold tracking-tight">
        Register Your Business
      </h1>
      <p className="mx-auto mt-4 max-w-md text-muted-foreground">
        Join the Confetti network and reach new customers — registration coming
        soon.
      </p>
    </div>
  );
}
