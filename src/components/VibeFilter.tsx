import { Sliders, Users, Volume2, Shirt, RotateCcw } from "lucide-react";
import {
  CROWD_LABEL,
  DEFAULT_VIBE,
  DRESS_LABEL,
  NOISE_LABEL,
  type Crowd,
  type Dress,
  type Noise,
  type VibePrefs,
} from "@/lib/vibe";

type Props = {
  prefs: VibePrefs;
  onChange: (next: VibePrefs) => void;
};

const CROWDS: Crowd[] = ["chill", "lively", "packed"];
const NOISES: Noise[] = ["quiet", "moderate", "loud"];
const DRESSES: Dress[] = ["casual", "smart", "dressy"];

export function VibeFilter({ prefs, onChange }: Props) {
  const reset = () => onChange(DEFAULT_VIBE);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <Sliders className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Vibe filter
            </p>
            <p className="text-sm font-semibold">Tune the room you want tonight</p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Group
          icon={<Users className="h-3.5 w-3.5" />}
          label="Crowd"
          options={CROWDS}
          value={prefs.crowd}
          render={(v) => CROWD_LABEL[v]}
          onPick={(v) => onChange({ ...prefs, crowd: v })}
        />
        <Group
          icon={<Volume2 className="h-3.5 w-3.5" />}
          label="Noise"
          options={NOISES}
          value={prefs.noise}
          render={(v) => NOISE_LABEL[v]}
          onPick={(v) => onChange({ ...prefs, noise: v })}
        />
        <Group
          icon={<Shirt className="h-3.5 w-3.5" />}
          label="Dress"
          options={DRESSES}
          value={prefs.dress}
          render={(v) => DRESS_LABEL[v]}
          onPick={(v) => onChange({ ...prefs, dress: v })}
        />
      </div>
    </div>
  );
}

function Group<T extends string>({
  icon,
  label,
  options,
  value,
  render,
  onPick,
}: {
  icon: React.ReactNode;
  label: string;
  options: readonly T[];
  value: T;
  render: (v: T) => string;
  onPick: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {icon} {label}
      </p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(o)}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition-pop ${
                active
                  ? "border-primary bg-primary text-primary-foreground shadow-pop"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              }`}
            >
              {render(o)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
