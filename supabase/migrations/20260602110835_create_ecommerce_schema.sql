create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  hero_image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category_id uuid references public.categories(id) on delete set null,
  collection_id uuid references public.collections(id) on delete set null,
  activity text,
  image_url text,
  image_tone text,
  size_guide_text text,
  is_featured boolean not null default false,
  is_new boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text unique,
  color text,
  color_value text,
  size text,
  price_kes integer not null check (price_kes >= 0),
  compare_at_price_kes integer check (compare_at_price_kes is null or compare_at_price_kes >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  image_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (product_id, image_url)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text,
  email text unique,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  full_name text,
  phone text,
  county text,
  town text,
  address_line text,
  delivery_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete cascade,
  session_id text,
  status text not null default 'active' check (status in ('active', 'ordered', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (customer_id is not null or session_id is not null)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, variant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'fulfilled', 'cancelled')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'failed', 'refunded')),
  subtotal_kes integer not null check (subtotal_kes >= 0),
  delivery_fee_kes integer not null default 0 check (delivery_fee_kes >= 0),
  total_kes integer not null check (total_kes >= 0),
  delivery_county text,
  delivery_town text,
  delivery_address text,
  customer_phone text,
  customer_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  variant_id uuid references public.product_variants(id) on delete set null,
  product_name text not null,
  sku text,
  color text,
  size text,
  unit_price_kes integer not null check (unit_price_kes >= 0),
  quantity integer not null check (quantity > 0),
  line_total_kes integer not null check (line_total_kes >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount_kes integer not null check (amount_kes >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
  paid_at timestamptz,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_collection_id_idx on public.products(collection_id);
create index if not exists product_variants_product_id_idx on public.product_variants(product_id);
create index if not exists product_images_product_id_idx on public.product_images(product_id);
create index if not exists addresses_customer_id_idx on public.addresses(customer_id);
create index if not exists carts_customer_id_idx on public.carts(customer_id);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);
create index if not exists orders_customer_id_idx on public.orders(customer_id);
create index if not exists order_items_order_id_idx on public.order_items(order_id);
create index if not exists payments_order_id_idx on public.payments(order_id);
create unique index if not exists payments_provider_reference_idx
  on public.payments(provider, provider_reference)
  where provider_reference is not null;

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_collections_updated_at on public.collections;
create trigger set_collections_updated_at
before update on public.collections
for each row execute function public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists set_product_variants_updated_at on public.product_variants;
create trigger set_product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

drop trigger if exists set_customers_updated_at on public.customers;
create trigger set_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists set_addresses_updated_at on public.addresses;
create trigger set_addresses_updated_at
before update on public.addresses
for each row execute function public.set_updated_at();

drop trigger if exists set_carts_updated_at on public.carts;
create trigger set_carts_updated_at
before update on public.carts
for each row execute function public.set_updated_at();

drop trigger if exists set_cart_items_updated_at on public.cart_items;
create trigger set_cart_items_updated_at
before update on public.cart_items
for each row execute function public.set_updated_at();

drop trigger if exists set_orders_updated_at on public.orders;
create trigger set_orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

drop trigger if exists set_payments_updated_at on public.payments;
create trigger set_payments_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.customers enable row level security;
alter table public.addresses enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Public can read categories" on public.categories;
create policy "Public can read categories"
on public.categories for select
to anon, authenticated
using (true);

drop policy if exists "Public can read collections" on public.collections;
create policy "Public can read collections"
on public.collections for select
to anon, authenticated
using (true);

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (is_active);

drop policy if exists "Public can read active variants" on public.product_variants;
create policy "Public can read active variants"
on public.product_variants for select
to anon, authenticated
using (
  is_active
  and exists (
    select 1
    from public.products
    where products.id = product_variants.product_id
      and products.is_active
  )
);

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.is_active
  )
);

drop policy if exists "Customers can read own profile" on public.customers;
create policy "Customers can read own profile"
on public.customers for select
to authenticated
using (auth_user_id = auth.uid());

drop policy if exists "Customers can insert own profile" on public.customers;
create policy "Customers can insert own profile"
on public.customers for insert
to authenticated
with check (auth_user_id = auth.uid());

drop policy if exists "Customers can update own profile" on public.customers;
create policy "Customers can update own profile"
on public.customers for update
to authenticated
using (auth_user_id = auth.uid())
with check (auth_user_id = auth.uid());

drop policy if exists "Customers can manage own addresses" on public.addresses;
create policy "Customers can manage own addresses"
on public.addresses for all
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customers
    where customers.id = addresses.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can manage own carts" on public.carts;
create policy "Customers can manage own carts"
on public.carts for all
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = carts.customer_id
      and customers.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customers
    where customers.id = carts.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can manage own cart items" on public.cart_items;
create policy "Customers can manage own cart items"
on public.cart_items for all
to authenticated
using (
  exists (
    select 1
    from public.carts
    join public.customers on customers.id = carts.customer_id
    where carts.id = cart_items.cart_id
      and customers.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.carts
    join public.customers on customers.id = carts.customer_id
    where carts.id = cart_items.cart_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own orders" on public.orders;
create policy "Customers can read own orders"
on public.orders for select
to authenticated
using (
  exists (
    select 1
    from public.customers
    where customers.id = orders.customer_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own order items" on public.order_items;
create policy "Customers can read own order items"
on public.order_items for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = order_items.order_id
      and customers.auth_user_id = auth.uid()
  )
);

drop policy if exists "Customers can read own payments" on public.payments;
create policy "Customers can read own payments"
on public.payments for select
to authenticated
using (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payments.order_id
      and customers.auth_user_id = auth.uid()
  )
);

grant usage on schema public to anon, authenticated;
grant select on public.categories, public.collections, public.products, public.product_variants, public.product_images to anon, authenticated;
grant select, insert, update on public.customers, public.addresses, public.carts, public.cart_items to authenticated;
grant select on public.orders, public.order_items, public.payments to authenticated;
