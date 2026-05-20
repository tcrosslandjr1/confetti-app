import { createLazyFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminPageHeader, AdminFilterBar, AdminLoadingState, AdminEmptyState, AdminKpiGrid, AdminKpiCard } from '@/components/admin/AdminUI';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const Route = createLazyFileRoute('/admin/city-ideas')({ component: CityIdeasPage });

const CATEGORIES = [
  { key: 'all', label: 'All categories' },
  { key: 'food', label: '🍽️ Food' },
  { key: 'game_night', label: '🎲 Game night' },
  { key: 'lounge', label: '🍸 Lounges' },
  { key: 'rooftop_bar', label: '🌆 Rooftop bars' },
];

function CityIdeasPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('all');
  const [category, setCategory] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['city-ideas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('city_ideas')
        .select('*')
        .order('trending_score', { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data || [];
    },
  });

  const cities = useMemo(() => {
    const s = new Set<string>();
    data?.forEach((r: any) => s.add(r.city));
    return ['all', ...Array.from(s).sort()];
  }, [data]);

  const filtered = useMemo(() => {
    return (data || []).filter((r: any) => {
      if (city !== 'all' && r.city !== city) return false;
      if (category !== 'all' && r.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!r.title.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q) && !r.city.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, city, category, search]);

  const kpis = useMemo(() => {
    const total = data?.length || 0;
    const cityCount = new Set(data?.map((r: any) => r.city)).size;
    const byCat: Record<string, number> = {};
    data?.forEach((r: any) => { byCat[r.category] = (byCat[r.category] || 0) + 1; });
    return { total, cityCount, byCat };
  }, [data]);

  return (
    <div className="space-y-6">
      <AdminPageHeader title="City Ideas" description="AI-curated trending experiences from web, TikTok & Instagram" />

      <AdminKpiGrid>
        <AdminKpiCard label="Total ideas" value={kpis.total} tone="coral" />
        <AdminKpiCard label="Cities covered" value={kpis.cityCount} tone="purple" />
        <AdminKpiCard label="Rooftop bars" value={kpis.byCat.rooftop_bar || 0} tone="teal" />
        <AdminKpiCard label="Game night" value={kpis.byCat.game_night || 0} tone="amber" />
      </AdminKpiGrid>

      <AdminFilterBar
        query={search}
        onQueryChange={setSearch}
        placeholder="Search ideas, venues, cities..."
      >
        <Select value={city} onValueChange={setCity}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent className="max-h-80">
            {cities.map(c => <SelectItem key={c} value={c}>{c === 'all' ? 'All cities' : c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </AdminFilterBar>

      {isLoading ? (
        <AdminLoadingState />
      ) : filtered.length === 0 ? (
        <AdminEmptyState title="No ideas match" />
      ) : (
        <div className="text-sm text-muted-foreground">Showing {filtered.length} of {kpis.total}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((idea: any) => (
          <Card key={idea.id} className="p-4 space-y-2 hover:shadow-md transition">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold leading-snug">{idea.title}</h3>
              <Badge variant="outline" className="shrink-0">{'$'.repeat(idea.price_tier || 2)}</Badge>
            </div>
            <div className="flex flex-wrap gap-1 text-xs">
              <Badge variant="secondary">{idea.city}</Badge>
              <Badge>{CATEGORIES.find(c => c.key === idea.category)?.label || idea.category}</Badge>
              {idea.neighborhood && <Badge variant="outline">{idea.neighborhood}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-3">{idea.description}</p>
            {idea.venue_hint && <p className="text-xs"><span className="text-muted-foreground">Venue:</span> <span className="font-medium">{idea.venue_hint}</span></p>}
            {idea.best_time && <p className="text-xs text-muted-foreground">⏰ {idea.best_time}</p>}
            <div className="flex flex-wrap gap-1 pt-1">
              {(idea.vibe_tags || []).slice(0, 5).map((t: string) => (
                <span key={t} className="text-xs text-muted-foreground">#{t}</span>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
