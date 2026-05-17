import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function HeroImageManager({
  heroUrl,
  onChange,
}: {
  heroUrl: string | null | undefined;
  onChange: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hero image</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="aspect-[16/10] w-full overflow-hidden rounded-xl border bg-muted sm:w-64">
            {heroUrl ? (
              <img src={heroUrl} alt="Hero" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                No hero set
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2 text-sm text-muted-foreground">
            <p>Recommended: 1600 × 1000, JPG, bright outdoor or interior shot.</p>
            <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2">
              <Sparkles className="mt-0.5 h-4 w-4 text-primary" />
              <p className="text-xs">
                Hover any photo in the grid below and tap <strong>Hero</strong> to swap it.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onChange}>
              Change hero image
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
