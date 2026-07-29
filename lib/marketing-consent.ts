import { createServiceClient } from "@/utils/supabase/admin";

/** Bumped when Privacy marketing section text materially changes. */
export const MARKETING_PRIVACY_VERSION = "2026-07-29";

export type MarketingConsentSource = "registration" | "account";

export async function setMarketingConsent(options: {
  userId: string;
  granted: boolean;
  source: MarketingConsentSource;
  locale?: string | null;
}): Promise<{ error: string | null }> {
  const admin = createServiceClient();
  const now = new Date().toISOString();

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      marketing_email_opt_in: options.granted,
      marketing_email_opt_in_at: now,
    })
    .eq("id", options.userId);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: eventError } = await admin.from("marketing_consent_events").insert({
    user_id: options.userId,
    granted: options.granted,
    privacy_version: MARKETING_PRIVACY_VERSION,
    source: options.source,
    locale: options.locale?.slice(0, 8) || null,
  });

  if (eventError) {
    return { error: eventError.message };
  }

  return { error: null };
}
