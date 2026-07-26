create index if not exists order_items_variant_id_idx
  on public.order_items (variant_id);

create index if not exists product_images_variant_id_idx
  on public.product_images (variant_id);

alter policy "Customers can read own profile"
on public.customers
using (auth_user_id = (select auth.uid()));

alter policy "Customers can insert own profile"
on public.customers
with check (auth_user_id = (select auth.uid()));

alter policy "Customers can update own profile"
on public.customers
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

alter policy "Customers can read own orders"
on public.orders
using (
  exists (
    select 1
    from public.customers
    where customers.id = orders.customer_id
      and customers.auth_user_id = (select auth.uid())
  )
);

alter policy "Customers can read own order items"
on public.order_items
using (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = order_items.order_id
      and customers.auth_user_id = (select auth.uid())
  )
);

alter policy "Customers can read own payments"
on public.payments
using (
  exists (
    select 1
    from public.orders
    join public.customers on customers.id = orders.customer_id
    where orders.id = payments.order_id
      and customers.auth_user_id = (select auth.uid())
  )
);
