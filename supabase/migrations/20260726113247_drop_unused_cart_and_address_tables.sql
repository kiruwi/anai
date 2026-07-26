-- Carts are persisted in browser storage and checkout delivery details are
-- recorded directly on orders, so these server-side tables are unused.
drop table if exists public.cart_items;
drop table if exists public.carts;
drop table if exists public.addresses;
