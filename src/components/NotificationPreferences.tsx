/**
 * NotificationPreferences — settings panel for email, SMS, and push notifications.
 * Covers booking confirmations, reminders, and marketing preferences.
 */

import { useState } from "react";
import { Bell, Mail, MessageSquare, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";

export type NotifPrefs = {
  emailConfirmations: boolean;
  emailReminders: boolean;
  smsReminders: boolean;
  pushEnabled: boolean;
  phoneNumber?: string;
};

export function NotificationPreferences({
  initial,
  onSave,
}: {
  initial: NotifPrefs;
  onSave?: (prefs: NotifPrefs) => void;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [dirty, setDirty] = useState(false);

  function toggle(key: keyof NotifPrefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
    setDirty(true);
  }

  function save() {
    if (prefs.smsReminders && !prefs.phoneNumber?.trim()) {
      toast.error("Please enter your phone number for SMS reminders");
      return;
    }
    onSave?.(prefs);
    setDirty(false);
    toast.success("Notification preferences saved!");
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white/60 p-5 backdrop-blur">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-ink/50" />
        <h2 className="font-display text-lg font-bold text-ink">
          Notifications
        </h2>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
          <Mail className="h-3.5 w-3.5" /> Email
        </div>
        <Toggle
          label="Booking confirmations"
          description="Receive email when a reservation is confirmed"
          checked={prefs.emailConfirmations}
          onChange={() => toggle("emailConfirmations")}
        />
        <Toggle
          label="Reminders"
          description="Get reminded 24h before your reservation"
          checked={prefs.emailReminders}
          onChange={() => toggle("emailReminders")}
        />
      </div>

      {/* SMS */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
          <MessageSquare className="h-3.5 w-3.5" /> SMS
        </div>
        <Toggle
          label="SMS reminders"
          description="Text message 2h before your reservation"
          checked={prefs.smsReminders}
          onChange={() => toggle("smsReminders")}
        />
        {prefs.smsReminders && (
          <div className="ml-8">
            <input
              type="tel"
              value={prefs.phoneNumber || ""}
              onChange={(e) => {
                setPrefs((p) => ({ ...p, phoneNumber: e.target.value }));
                setDirty(true);
              }}
              placeholder="+1 (555) 000-0000"
              className="w-full rounded-lg border border-ink/15 bg-cream/50 px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-coral focus:outline-none focus:ring-1 focus:ring-coral/50"
            />
          </div>
        )}
      </div>

      {/* Push */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink/50">
          <Smartphone className="h-3.5 w-3.5" /> Push
        </div>
        <Toggle
          label="Push notifications"
          description="Real-time alerts for waitlist, events, and more"
          checked={prefs.pushEnabled}
          onChange={() => toggle("pushEnabled")}
        />
      </div>

      {/* Save */}
      {dirty && (
        <button
          type="button"
          onClick={save}
          className="inline-flex items-center justify-center gap-1.5 self-end rounded-full border-2 border-ink bg-coral px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-widest text-cream shadow-brut transition hover:-translate-y-0.5"
        >
          <Save className="h-3.5 w-3.5" /> Save preferences
        </button>
      )}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition hover:bg-ink/5"
    >
      <div
        className={`flex h-5 w-9 shrink-0 items-center rounded-full px-0.5 transition ${
          checked ? "bg-coral" : "bg-ink/20"
        }`}
      >
        <div
          className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
      <div>
        <div className="text-sm font-bold text-ink">{label}</div>
        <div className="text-[11px] text-ink/50">{description}</div>
      </div>
    </button>
  );
}
