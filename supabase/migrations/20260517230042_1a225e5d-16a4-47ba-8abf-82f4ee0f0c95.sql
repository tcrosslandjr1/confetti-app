-- Rename vendor_accounts to vendors
ALTER TABLE public.vendor_accounts RENAME TO vendors;

-- Rename the cosmetic policy name on the renamed table
ALTER POLICY "Service role manages vendor accounts" ON public.vendors RENAME TO "Service role manages vendors";
ALTER POLICY "Vendors view own account" ON public.vendors RENAME TO "Vendors view own vendor row";

-- FK from vendor_payouts.vendor_account_id and the policy on vendor_payouts
-- continue to work automatically (Postgres tracks dependencies by OID).
-- The pg_policies qual text auto-regenerates to reference "vendors".