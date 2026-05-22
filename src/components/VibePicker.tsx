import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface VibeOption {
  id: string;
  label: string;
  group: "social" | "food" | "activity" | "mood" | "budget";
}

export const DEFAULT_VIBE_OPTIONS: VibeOption[] = [
  { id: "lounge",       label: "Lounge",       group: "social" },
  { id: "hookah",       label: "Hookah",       group: "social" },
  { id: "seafood",      label: "Seafood",      group: "food" },
  { id: "crab-house",   label: "Crab House",   group: "food" },
  { id: "casino-night", label: "Casino Night", group: "activity" },
  { id: "rooftop",      label: "Rooftop",      group: "social" },
  { id: "karaoke",      label: "Karaoke",      group: "social" },
  { id: "comedy",       label: "Comedy",       group: "social" },
  { id: "dancing",      label: "Dancing",      group: "social" },
  { id: "chill",        label: "Chill",        group: "mood" },
  { id: "upscale",      label: "Upscale",      group: "mood" },
  { id: "budget",       label: "Budget",       group: "budget" },
];

interface VibePickerProps {
  options?: VibeOption[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  onSubmit?: (selected: string[]) => void;
  maxSelections?: number;
  submitLabel?: string;
}

export function VibePicker({
  options = DEFAULT_VIBE_OPTIONS,
  value,
  onChange,
  onSubmit,
  maxSelections,
  submitLabel = "Build my plan",
}: VibePickerProps) {
  const [internal, setInternal] = useState<string[]>(value ?? []);
  const selected = value ?? internal;

  const toggle = (id: string) => {
    const has = selected.includes(id);
    let next = has ? selected.filter((s) => s !== id) : [...selected, id];
    if (!has && maxSelections && next.length > maxSelections) {
      next = next.slice(next.length - maxSelections);
    }
    if (!value) setInternal(next);
    onChange?.(next);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">Pick your vibe</h2>
        <p className="text-sm text-muted-foreground">
          Tap anything that sounds good tonight. We'll do the rest.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                "hover:scale-105 active:scale-95",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-md"
                  : "border-border bg-card text-foreground hover:border-primary/50",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/40 p-3">
          <span className="text-xs font-medium text-muted-foreground">Your vibe:</span>
          {selected.map((id) => {
            const opt = options.find((o) => o.id === id);
            return (
              <Badge key={id} variant="secondary" className="capitalize">
                {opt?.label ?? id}
              </Badge>
            );
          })}
        </div>
      )}

      {onSubmit && (
        <Button
          size="lg"
          className="w-full sm:w-auto"
          disabled={selected.length === 0}
          onClick={() => onSubmit(selected)}
        >
          {submitLabel}
        </Button>
      )}
    </div>
  );
}
