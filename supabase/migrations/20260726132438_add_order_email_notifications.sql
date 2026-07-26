create table public.order_email_notifications (
  order_id uuid primary key references public.orders(id) on delete cascade,
  status text not null default 'processing'
    check (status in ('processing', 'sent', 'failed')),
  attempts integer not null default 1 check (attempts > 0),
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  brevo_message_ids text[],
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.order_email_notifications enable row level security;

comment on table public.order_email_notifications is
  'Tracks idempotent customer and sales emails for paid orders.';
