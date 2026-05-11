import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Star, MapPin, Clock, Phone, Plus, Calendar, Sparkles } from "lucide-react";
import { TabBar } from "@/components/loop/TabBar";
import { toast } from "sonner";

export const Route = createFileRoute("/venue/$id")({
  head: () => ({ meta: [{ title: "Venue — Loop" }] }),
  component: VenuePage,
});

const PHOTOS = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&auto=format&fit=crop",
];

function VenuePage() {
  const { id } = Route.useParams();
  const tags = ["TikTok Viral", "Rooftop", "Craft Cocktails", "Date Night"];

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="relative h-72 overflow-hidden">
        <img src={PHOTOS[0]} alt="venue hero" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-ink/60 to-transparent" />
        <Link to="/viral" className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border-2 border-ink bg-cream/95 shadow-brut">
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="mx-auto max-w-md px-4 -mt-8">
        <div className="rounded-3xl border-2 border-ink bg-card p-5 shadow-brut">
          <div className="flex items-baseline justify-between gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight">Aera Rooftop</h1>
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60">#{id.slice(0, 6)}</span>
          </div>
          <div className="text-sm text-muted-foreground">Cocktail bar · Logan Circle</div>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 font-bold"><Star className="h-4 w-4 fill-gold text-gold" /> 4.7</span>
            <span className="text-muted-foreground">$$$</span>
            <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> 0.4 mi</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <span key={t} className="rounded-full border-2 border-ink bg-gold/30 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest">{t}</span>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-dashed border-coral bg-coral/5 p-4">
          <div className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-widest text-coral"><Sparkles className="h-3 w-3" /> Why we picked this</div>
          <p className="mt-2 text-sm">Sunset views and a tightly-edited cocktail list make this the perfect closer for a date-night Loop. It's been trending on TikTok this week with creator visits up 3x.</p>
        </div>

        <div className="mt-4 grid gap-2">
          <InfoRow icon={Clock} label="Hours" value="Tue–Sun · 5pm – 1am" />
          <InfoRow icon={Phone} label="Phone" value="(202) 555-0142" />
          <InfoRow icon={MapPin} label="Address" value="1421 P St NW, Washington DC" />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <button onClick={() => toast.success("Added to your Loop")} className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-cream px-4 py-3 text-sm font-bold shadow-brut transition-pop hover:-translate-y-0.5">
            <Plus className="h-4 w-4" /> Add to Loop
          </button>
          <button onClick={() => toast.success("Booking handoff coming soon")} className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-ink bg-coral px-4 py-3 text-sm font-bold text-cream shadow-brut transition-pop hover:-translate-y-0.5">
            <Calendar className="h-4 w-4" /> Book Now
          </button>
        </div>

        <div className="mt-6">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest text-ink/60 mb-2">Photos</div>
          <div className="grid grid-cols-2 gap-2">
            {PHOTOS.map((p, i) => (
              <img key={i} src={p} alt="" className="aspect-square w-full rounded-2xl border-2 border-ink object-cover" />
            ))}
          </div>
        </div>
      </div>
      <TabBar />
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-muted"><Icon className="h-4 w-4" /></span>
      <div>
        <div className="font-mono text-[9px] font-bold uppercase tracking-widest text-ink/60">{label}</div>
        <div className="text-sm font-semibold">{value}</div>
      </div>
    </div>
  );
}
