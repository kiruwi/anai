insert into public.categories (name, slug, sort_order)
values
  ('Outerwear', 'outerwear', 10),
  ('Tops', 'tops', 20),
  ('Sets', 'sets', 30),
  ('Accessories', 'accessories', 40)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into public.collections (name, slug, description, sort_order)
values
  ('Everyday Active', 'everyday-active', 'Layers and staples for training, travel, and daily movement.', 10),
  ('Core Tops', 'core-tops', 'Fitted tops and tees for everyday training.', 20),
  ('Statement Sets', 'statement-sets', 'Coordinated pieces with stronger silhouettes.', 30),
  ('Short Sets', 'short-sets', 'Warm-weather sets for training and lounge.', 40),
  ('Finishing Pieces', 'finishing-pieces', 'Accessories for everyday styling and training.', 50)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order;

insert into public.products (
  name,
  slug,
  description,
  category_id,
  collection_id,
  activity,
  image_url,
  image_tone,
  size_guide_text,
  is_featured,
  is_new,
  is_active
)
values
  (
    'Jackets',
    'jackets',
    'Everyday active jacket for training, travel, and layering.',
    (select id from public.categories where slug = 'outerwear'),
    (select id from public.collections where slug = 'everyday-active'),
    'Training / Travel',
    '/images/products/Jackets/b-2.jpg',
    'linear-gradient(135deg, #461828, #c66747)',
    'S: bust 35cm, length 48cm, shoulder 34cm, waistline 32cm. M: bust 37cm, length 49.5cm, shoulder 35.5cm, waistline 34cm. L: bust 39cm, length 51cm, shoulder 37cm, waistline 36cm. XL: bust 41cm, length 52.5cm, shoulder 38.5cm, waistline 38cm.',
    true,
    true,
    true
  ),
  (
    'Long Sleeve, Round Neck',
    'long-sleeve-round-neck',
    'Long sleeve round-neck active top.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Training',
    '/images/products/Long sleeve, round neck/b-t.jpg',
    'linear-gradient(135deg, #4a481d, #d7c1a9)',
    'Long-sleeved. S/8: coat length 43cm, sleeve length 63cm, bust 68cm, bottom 62cm. M/10: coat length 44cm, sleeve length 64cm, bust 72cm, bottom 66cm. L/12: coat length 45cm, sleeve length 65cm, bust 76cm, bottom 70cm. XL/14: coat length 46cm, sleeve length 66cm, bust 80cm, bottom 74cm.',
    true,
    true,
    true
  ),
  (
    'Long Sleeve, Swirl Neck',
    'long-sleeve-swirl-neck',
    'Long sleeve swirl-neck active top.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Training',
    '/images/products/Long sleeve, swirl neck/bb-sw.jpg',
    'linear-gradient(135deg, #000000, #4a481d)',
    'Long-sleeved. Fabric: 78% nylon, 22% elastane. S/8: coat length 44cm, shoulder 35cm, sleeve length 60cm, bust 72cm, bottom 58cm. M/10: coat length 45cm, shoulder 36.2cm, sleeve length 61cm, bust 76cm, bottom 62cm. L/12: coat length 46cm, shoulder 37.4cm, sleeve length 62cm, bust 80cm, bottom 66cm. XL/14: coat length 47cm, shoulder 38.6cm, sleeve length 63cm, bust 84cm, bottom 70cm.',
    true,
    true,
    true
  ),
  (
    'Minit T-Shirt',
    'minit-t-shirt',
    'Mini cropped t-shirt.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday',
    '/images/products/Mini T-Shirt/mini black tshirt.jpg',
    'linear-gradient(135deg, #111111, #253b54)',
    null,
    true,
    true,
    true
  ),
  (
    'Sahara Corsage Set',
    'sahara-corsage-set',
    'Corsage-style active set.',
    (select id from public.categories where slug = 'sets'),
    (select id from public.collections where slug = 'statement-sets'),
    'Studio / Lounge',
    '/images/products/Sahara/beige.jpg',
    'linear-gradient(135deg, #d7d4c9, #111111)',
    null,
    true,
    true,
    true
  ),
  (
    'Strappy Bra',
    'strappy-bra',
    'Strappy training bra.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Training / Studio',
    '/images/products/Bra/black.jpg',
    'linear-gradient(135deg, #111111, #f6f1ea)',
    null,
    false,
    true,
    true
  ),
  (
    'Cropped Training Tee',
    'cropped-training-tee',
    'Cropped tee for training and everyday styling.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Studio',
    '/images/products/Tops/black.jpg',
    'linear-gradient(135deg, #111111, #4a5134)',
    null,
    false,
    true,
    true
  ),
  (
    'Nuru Short Set',
    'nuru-short-set',
    'Short set for training, warm weather, and lounge.',
    (select id from public.categories where slug = 'sets'),
    (select id from public.collections where slug = 'short-sets'),
    'Training / Lounge',
    '/images/products/Nuru, Short Set/bi-ss.jpg',
    'linear-gradient(135deg, #d7c1a9, #4a481d)',
    null,
    false,
    false,
    true
  ),
  (
    'Mia Cropped Tee',
    'mia-cropped-tee',
    'Cropped tee for everyday and studio wear.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Studio',
    '/images/products/Mia Cropped Tee''s/black.jpg',
    'linear-gradient(135deg, #111111, #e8ddcd)',
    null,
    false,
    false,
    true
  ),
  (
    'ANAI Crew Socks',
    'anai-crew-socks',
    'Crew socks for everyday styling and training.',
    (select id from public.categories where slug = 'accessories'),
    (select id from public.collections where slug = 'finishing-pieces'),
    'Everyday / Training',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
    'linear-gradient(135deg, #ffffff, #461828)',
    null,
    false,
    false,
    true
  )
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    collection_id = excluded.collection_id,
    activity = excluded.activity,
    image_url = excluded.image_url,
    image_tone = excluded.image_tone,
    size_guide_text = excluded.size_guide_text,
    is_featured = excluded.is_featured,
    is_new = excluded.is_new,
    is_active = excluded.is_active;

with seed_variants (
  product_slug,
  sku,
  color,
  color_value,
  price_kes,
  stock_quantity
) as (
  values
  ('jackets', 'ANAI-JACKETS-BLACK-OS', 'Black', '#111111', 7800, 10),
  ('jackets', 'ANAI-JACKETS-BEIGE-OS', 'Beige', '#c8b69c', 7800, 10),
  ('jackets', 'ANAI-JACKETS-BROWN-OS', 'Brown', '#6f4631', 7800, 10),
  ('jackets', 'ANAI-JACKETS-GREEN-OS', 'Green', '#55624b', 7800, 10),
  ('jackets', 'ANAI-JACKETS-GREY-OS', 'Grey', '#74756d', 7800, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-BLACK-OS', 'Black', '#111111', 8200, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-BLUE-OS', 'Blue', '#253b54', 8200, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-BROWN-OS', 'Brown', '#6f4631', 8200, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-GREEN-OS', 'Green', '#586447', 8200, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-NATURAL-OS', 'Natural', '#b89d83', 8200, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-WHITE-OS', 'White', '#f6f1ea', 8200, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-BLACK-OS', 'Black', '#111111', 7600, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-BLUE-OS', 'Blue', '#253b54', 7600, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-BROWN-OS', 'Brown', '#6f4631', 7600, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-GREEN-OS', 'Green', '#586447', 7600, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-OFF-WHITE-OS', 'Off white', '#efe7dc', 7600, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-PINK-OS', 'Pink', '#d8a0a7', 7600, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-RED-OS', 'Red', '#9f2526', 7600, 10),
  ('minit-t-shirt', 'ANAI-MINIT-BLACK-OS', 'Black', '#111111', 2800, 20),
  ('minit-t-shirt', 'ANAI-MINIT-BLUE-OS', 'Blue', '#253b54', 2800, 20),
  ('minit-t-shirt', 'ANAI-MINIT-BROWN-OS', 'Brown', '#6f4631', 2800, 20),
  ('minit-t-shirt', 'ANAI-MINIT-RED-STRIPE-OS', 'Red Stripe', 'repeating-linear-gradient(90deg, #111111 0 8px, #9f2526 8px 14px)', 2800, 20),
  ('sahara-corsage-set', 'ANAI-SAHARA-BEIGE-OS', 'Beige', '#d7d4c9', 6200, 10),
  ('sahara-corsage-set', 'ANAI-SAHARA-BLACK-OS', 'Black', '#111111', 6200, 10),
  ('sahara-corsage-set', 'ANAI-SAHARA-BROWN-OS', 'Brown', '#6f4631', 6200, 10),
  ('strappy-bra', 'ANAI-BRA-BLACK-OS', 'Black', '#111111', 2800, 15),
  ('strappy-bra', 'ANAI-BRA-BROWN-OS', 'Brown', '#6f4631', 2800, 15),
  ('strappy-bra', 'ANAI-BRA-WHITE-OS', 'White', '#f6f1ea', 2800, 15),
  ('cropped-training-tee', 'ANAI-CTT-BLACK-OS', 'Black', '#111111', 2800, 20),
  ('cropped-training-tee', 'ANAI-CTT-BURGUNDY-OS', 'Burgundy', '#4a2428', 2800, 20),
  ('cropped-training-tee', 'ANAI-CTT-GREEN-OS', 'Green', '#4a5134', 2800, 20),
  ('nuru-short-set', 'ANAI-NURU-BIRCH-OS', 'Birch', '#c9cbc6', 6200, 10),
  ('nuru-short-set', 'ANAI-NURU-BLACK-OS', 'Black', '#111111', 6200, 10),
  ('nuru-short-set', 'ANAI-NURU-BROWN-OS', 'Brown', '#6f4631', 6200, 10),
  ('nuru-short-set', 'ANAI-NURU-LILAC-OS', 'Lilac', '#b9a9c8', 6200, 10),
  ('nuru-short-set', 'ANAI-NURU-PINK-OS', 'Pink', '#d8a0a7', 6200, 10),
  ('mia-cropped-tee', 'ANAI-MIA-BLACK-OS', 'Black', '#111111', 2800, 20),
  ('mia-cropped-tee', 'ANAI-MIA-BROWN-OS', 'Brown', '#6f4631', 2800, 20),
  ('mia-cropped-tee', 'ANAI-MIA-CREAM-OS', 'Cream', '#e8ddcd', 2800, 20),
  ('anai-crew-socks', 'ANAI-SOCKS-WHITE-OS', 'White', '#ffffff', 950, 50),
  ('anai-crew-socks', 'ANAI-SOCKS-BLACK-OS', 'Black', '#000000', 950, 50)
)

insert into public.product_variants (
  product_id,
  sku,
  color,
  color_value,
  size,
  price_kes,
  stock_quantity,
  is_active
)
select
  products.id,
  seed_variants.sku,
  seed_variants.color,
  seed_variants.color_value,
  'One size',
  seed_variants.price_kes,
  seed_variants.stock_quantity,
  true
from seed_variants
join public.products on products.slug = seed_variants.product_slug
on conflict (sku) do update
set color = excluded.color,
    color_value = excluded.color_value,
    size = excluded.size,
    price_kes = excluded.price_kes,
    stock_quantity = excluded.stock_quantity,
    is_active = excluded.is_active;

with seed_images (
  product_slug,
  image_url,
  sort_order
) as (
  values
  ('jackets', '/images/products/Jackets/b-2.jpg', 0),
  ('jackets', '/images/products/Jackets/be-f.jpg', 1),
  ('jackets', '/images/products/Jackets/br-4.jpg', 2),
  ('jackets', '/images/products/Jackets/g-3.jpg', 3),
  ('jackets', '/images/products/Jackets/g-b.jpg', 4),
  ('jackets', '/images/products/Jackets/gr-fb.jpg', 5),
  ('jackets', '/images/products/Jackets/detail.jpg', 6),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/b-t.jpg', 0),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/bl-t.jpg', 1),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/br-t.jpg', 2),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/g-t.jpg', 3),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/g-tt.jpg', 4),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/n-t.jpg', 5),
  ('long-sleeve-round-neck', '/images/products/Long sleeve, round neck/w-t.jpg', 6),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/bb-sw.jpg', 0),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/bl-sw.jpg', 1),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/br-sw.jpg', 2),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/gr-sw.jpg', 3),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/gu-sw.jpg', 4),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/ow-sw.jpg', 5),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/pi-sw.jpg', 6),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/rd-sw.jpg', 7),
  ('long-sleeve-swirl-neck', '/images/products/Long sleeve, swirl neck/details.png', 8),
  ('minit-t-shirt', '/images/products/Mini T-Shirt/mini black tshirt.jpg', 0),
  ('minit-t-shirt', '/images/products/Mini T-Shirt/mini black tshirt BLUE.jpg', 1),
  ('minit-t-shirt', '/images/products/Mini T-Shirt/mini black tshirt BLUE BACK.jpg', 2),
  ('minit-t-shirt', '/images/products/Mini T-Shirt/mini black tshirt BROWN.jpg', 3),
  ('minit-t-shirt', '/images/products/Mini T-Shirt/mini black tshirt RED STRIPE.jpg', 4),
  ('sahara-corsage-set', '/images/products/Sahara/beige.jpg', 0),
  ('sahara-corsage-set', '/images/products/Sahara/black.jpg', 1),
  ('sahara-corsage-set', '/images/products/Sahara/brown.jpg', 2),
  ('strappy-bra', '/images/products/Bra/black.jpg', 0),
  ('strappy-bra', '/images/products/Bra/brown.jpg', 1),
  ('strappy-bra', '/images/products/Bra/white.jpg', 2),
  ('cropped-training-tee', '/images/products/Tops/black.jpg', 0),
  ('cropped-training-tee', '/images/products/Tops/burgandy.jpg', 1),
  ('cropped-training-tee', '/images/products/Tops/green.jpg', 2),
  ('nuru-short-set', '/images/products/Nuru, Short Set/bi-ss.jpg', 0),
  ('nuru-short-set', '/images/products/Nuru, Short Set/bl-ss.jpg', 1),
  ('nuru-short-set', '/images/products/Nuru, Short Set/br-ss.jpg', 2),
  ('nuru-short-set', '/images/products/Nuru, Short Set/ll-ss.jpg', 3),
  ('nuru-short-set', '/images/products/Nuru, Short Set/pk-ss.jpg', 4),
  ('mia-cropped-tee', '/images/products/Mia Cropped Tee''s/black.jpg', 0),
  ('mia-cropped-tee', '/images/products/Mia Cropped Tee''s/brown.jpg', 1),
  ('mia-cropped-tee', '/images/products/Mia Cropped Tee''s/cream.jpg', 2),
  ('anai-crew-socks', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80', 0)
)

insert into public.product_images (product_id, image_url, alt_text, sort_order)
select
  products.id,
  seed_images.image_url,
  products.name,
  seed_images.sort_order
from seed_images
join public.products on products.slug = seed_images.product_slug
on conflict (product_id, image_url) do update
set alt_text = excluded.alt_text,
    sort_order = excluded.sort_order;
