
-- Add to realtime publication (no-op if already member)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'bookings',
    'support_tickets',
    'user_support_tickets',
    'support_ticket_messages',
    'messages',
    'threads',
    'promoter_payouts',
    'payout_records'
  ])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- REPLICA IDENTITY FULL so UPDATE/DELETE payloads include the old row (needed for client-side reconciliation)
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER TABLE public.support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.user_support_tickets REPLICA IDENTITY FULL;
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.threads REPLICA IDENTITY FULL;
ALTER TABLE public.promoter_payouts REPLICA IDENTITY FULL;
ALTER TABLE public.payout_records REPLICA IDENTITY FULL;
