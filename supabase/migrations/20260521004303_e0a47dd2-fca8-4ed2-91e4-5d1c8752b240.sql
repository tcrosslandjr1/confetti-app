
ALTER TABLE public.support_tickets ADD COLUMN IF NOT EXISTS due_date timestamptz;
CREATE INDEX IF NOT EXISTS support_tickets_due_date_idx ON public.support_tickets(due_date) WHERE due_date IS NOT NULL;
