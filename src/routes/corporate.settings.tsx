import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CorporatePageHeader, useActiveCorporateCompany } from "@/components/CorporateShell";
import { toast } from "sonner";

export const Route = createFileRoute("/corporate/settings")({
  component: CorporateSettingsPage,
});

function CorporateSettingsPage() {
  const { data: company } = useActiveCorporateCompany();
  const companyId = company?.id;

  const { data: admins } = useQuery({
    enabled: !!companyId,
    queryKey: ["corporate", "admins", companyId],
    queryFn: async () => {
      const { data } = await supabase
        .from("corporate_company_members")
        .select("id,user_id,role,invited_email,joined_at")
        .eq("company_id", companyId!)
        .in("role", ["owner", "admin"]);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-6">
      <CorporatePageHeader
        eyebrow="Company"
        title="Company Settings"
        description="Profile, primary city, and admin access for your corporate workspace."
      />
      <Card className="p-6">
        <form className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Company name</Label>
            <Input defaultValue={company?.name ?? ""} placeholder="Acme Inc." />
          </div>
          <div className="space-y-2">
            <Label>Domain</Label>
            <Input defaultValue={company?.domain ?? ""} placeholder="acme.com" />
          </div>
          <div className="space-y-2">
            <Label>Primary city</Label>
            <Input placeholder="New York" />
          </div>
          <div className="space-y-2">
            <Label>Plan tier</Label>
            <Input value={company?.plan_tier ?? "starter"} readOnly />
          </div>
          <div className="sm:col-span-2">
            <Button type="button" onClick={() => toast.success("Settings saved")}>Save changes</Button>
          </div>
        </form>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Admins</h2>
          <Button variant="outline" size="sm" disabled title="Admin invites launching soon" className="opacity-60 cursor-not-allowed">
            Add admin <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">Soon</span>
          </Button>
        </div>
        {!admins || admins.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">Only the owner currently has access.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {admins.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-3 text-sm">
                <span>{m.invited_email ?? m.user_id}</span>
                <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">{m.role}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
