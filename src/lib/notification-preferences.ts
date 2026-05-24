/**
 * notification-preferences.ts
 * Load/save user notification preferences from Supabase.
 */

import { supabase } from "@/integrations/supabase/client";
export interface NotifPrefs {
  emailConfirmations: boolean;
  emailReminders: boolean;
  smsReminders: boolean;
  pushEnabled: boolean;
  phoneNumber?: string;
}

const DEFAULTS: NotifPrefs = {
  emailConfirmations: true,
  emailReminders: true,
  smsReminders: false,
  pushEnabled: false,
};

/** Load notification preferences for the current user. Returns defaults if no row exists. */
export async function loadNotificationPreferences(): Promise<NotifPrefs> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULTS;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return DEFAULTS;

  return {
    emailConfirmations: data.email_confirmations ?? true,
    emailReminders: data.email_reminders ?? true,
    smsReminders: data.sms_reminders ?? false,
    pushEnabled: data.push_enabled ?? false,
    phoneNumber: data.phone_number ?? undefined,
  };
}

/** Save notification preferences (upsert). */
export async function saveNotificationPreferences(prefs: NotifPrefs): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        email_confirmations: prefs.emailConfirmations,
        email_reminders: prefs.emailReminders,
        sms_reminders: prefs.smsReminders,
        push_enabled: prefs.pushEnabled,
        phone_number: prefs.phoneNumber?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) throw error;
}
