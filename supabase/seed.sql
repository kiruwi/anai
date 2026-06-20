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
    'Nuru Zip-up',
    'jackets',
    'Everyday active jacket for training, travel, and layering.',
    (select id from public.categories where slug = 'outerwear'),
    (select id from public.collections where slug = 'everyday-active'),
    'Training / Travel',
    '/images/products/Nuru Zip-up/navy.webp',
    'linear-gradient(135deg, #461828, #c66747)',
    'S: bust 35cm, length 48cm, shoulder 34cm, waistline 32cm. M: bust 37cm, length 49.5cm, shoulder 35.5cm, waistline 34cm. L: bust 39cm, length 51cm, shoulder 37cm, waistline 36cm. XL: bust 41cm, length 52.5cm, shoulder 38.5cm, waistline 38cm.',
    true,
    true,
    true
  ),
  (
    'Reya Long sleeve, round neck',
    'long-sleeve-round-neck',
    'Long sleeve round-neck active top.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Training',
    '/images/products/Reya Long sleeve, round neck/white.webp',
    'linear-gradient(135deg, #4a481d, #d7c1a9)',
    'Long-sleeved. S/8: coat length 43cm, sleeve length 63cm, bust 68cm, bottom 62cm. M/10: coat length 44cm, sleeve length 64cm, bust 72cm, bottom 66cm. L/12: coat length 45cm, sleeve length 65cm, bust 76cm, bottom 70cm. XL/14: coat length 46cm, sleeve length 66cm, bust 80cm, bottom 74cm.',
    true,
    true,
    true
  ),
  (
    'Reya Long sleeve, swirl neck',
    'long-sleeve-swirl-neck',
    'Long sleeve swirl-neck active top.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Training',
    '/images/products/Reya Long sleeve, swirl neck/cream.webp',
    'linear-gradient(135deg, #000000, #4a481d)',
    'Long-sleeved. Fabric: 78% nylon, 22% elastane. S/8: coat length 44cm, shoulder 35cm, sleeve length 60cm, bust 72cm, bottom 58cm. M/10: coat length 45cm, shoulder 36.2cm, sleeve length 61cm, bust 76cm, bottom 62cm. L/12: coat length 46cm, shoulder 37.4cm, sleeve length 62cm, bust 80cm, bottom 66cm. XL/14: coat length 47cm, shoulder 38.6cm, sleeve length 63cm, bust 84cm, bottom 70cm.',
    true,
    true,
    true
  ),
  (
    'Aya Mini tee',
    'minit-t-shirt',
    'Mini cropped t-shirt.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday',
    '/images/products/Aya Mini tee/black.webp',
    'linear-gradient(135deg, #111111, #253b54)',
    null,
    true,
    true,
    true
  ),
  (
    'Nia jogger set',
    'sahara-corsage-set',
    'Corsage-style active set.',
    (select id from public.categories where slug = 'sets'),
    (select id from public.collections where slug = 'statement-sets'),
    'Studio / Lounge',
    '/images/products/Nia jogger set/navy blue.webp',
    'linear-gradient(135deg, #d7d4c9, #111111)',
    null,
    true,
    true,
    true
  ),
  (
    'Zuri bra',
    'strappy-bra',
    'Strappy training bra.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Training / Studio',
    '/images/products/Zuri bra/white.webp',
    'linear-gradient(135deg, #111111, #f6f1ea)',
    null,
    false,
    true,
    true
  ),
  (
    'Mia cropped t''S',
    'cropped-training-tee',
    'Cropped tee for training and everyday styling.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Studio',
    '/images/products/Mia cropped t''S/burgandy.webp',
    'linear-gradient(135deg, #111111, #4a5134)',
    null,
    false,
    true,
    true
  ),
  (
    'Jua jogger set',
    'nuru-short-set',
    'Short set for training, warm weather, and lounge.',
    (select id from public.categories where slug = 'sets'),
    (select id from public.collections where slug = 'short-sets'),
    'Training / Lounge',
    '/images/products/Jua jogger set/navy blue.webp',
    'linear-gradient(135deg, #d7c1a9, #4a481d)',
    null,
    false,
    false,
    true
  ),
  (
    'Mia cropped t''S',
    'mia-cropped-tee',
    'Cropped tee for everyday and studio wear.',
    (select id from public.categories where slug = 'tops'),
    (select id from public.collections where slug = 'core-tops'),
    'Everyday / Studio',
    '/images/products/Mia cropped t''S/burgandy.webp',
    'linear-gradient(135deg, #111111, #e8ddcd)',
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

update public.products
set is_active = false
where slug = 'anai-crew-socks';

with seed_variants (
  product_slug,
  sku,
  color,
  color_value,
  price_kes,
  stock_quantity
) as (
  values
  ('jackets', 'ANAI-JACKETS-BLACK-OS', 'Black', '#111111', 3780, 10),
  ('jackets', 'ANAI-JACKETS-BEIGE-OS', 'Beige', '#c8b69c', 3780, 10),
  ('jackets', 'ANAI-JACKETS-BROWN-OS', 'Brown', '#6f4631', 3780, 10),
  ('jackets', 'ANAI-JACKETS-GREEN-OS', 'Green', '#55624b', 3780, 10),
  ('jackets', 'ANAI-JACKETS-GREY-OS', 'Grey', '#74756d', 3780, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-BLACK-OS', 'Black', '#111111', 2680, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-BLUE-OS', 'Blue', '#253b54', 2680, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-BROWN-OS', 'Brown', '#6f4631', 2680, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-GREEN-OS', 'Green', '#586447', 2680, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-NATURAL-OS', 'Natural', '#b89d83', 2680, 10),
  ('long-sleeve-round-neck', 'ANAI-LSRN-WHITE-OS', 'White', '#f6f1ea', 2680, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-BLACK-OS', 'Black', '#111111', 2980, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-BLUE-OS', 'Blue', '#253b54', 2980, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-BROWN-OS', 'Brown', '#6f4631', 2980, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-GREEN-OS', 'Green', '#586447', 2980, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-OFF-WHITE-OS', 'Off white', '#efe7dc', 2980, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-PINK-OS', 'Pink', '#d8a0a7', 2980, 10),
  ('long-sleeve-swirl-neck', 'ANAI-LSSN-RED-OS', 'Red', '#9f2526', 2980, 10),
  ('minit-t-shirt', 'ANAI-MINIT-BLACK-OS', 'Black', '#111111', 2980, 20),
  ('minit-t-shirt', 'ANAI-MINIT-BLUE-OS', 'Blue', '#253b54', 2980, 20),
  ('minit-t-shirt', 'ANAI-MINIT-BROWN-OS', 'Brown', '#6f4631', 2980, 20),
  ('minit-t-shirt', 'ANAI-MINIT-RED-STRIPE-OS', 'Red Stripe', 'repeating-linear-gradient(90deg, #111111 0 8px, #9f2526 8px 14px)', 2980, 20),
  ('sahara-corsage-set', 'ANAI-SAHARA-BEIGE-OS', 'Beige', '#d7d4c9', 5060, 10),
  ('sahara-corsage-set', 'ANAI-SAHARA-BLACK-OS', 'Black', '#111111', 5060, 10),
  ('sahara-corsage-set', 'ANAI-SAHARA-BROWN-OS', 'Brown', '#6f4631', 5060, 10),
  ('strappy-bra', 'ANAI-BRA-BLACK-OS', 'Black', '#111111', 2680, 15),
  ('strappy-bra', 'ANAI-BRA-BROWN-OS', 'Brown', '#6f4631', 2680, 15),
  ('strappy-bra', 'ANAI-BRA-WHITE-OS', 'White', '#f6f1ea', 2680, 15),
  ('cropped-training-tee', 'ANAI-CTT-BLACK-OS', 'Black', '#111111', 2980, 20),
  ('cropped-training-tee', 'ANAI-CTT-BURGUNDY-OS', 'Burgundy', '#4a2428', 2980, 20),
  ('cropped-training-tee', 'ANAI-CTT-GREEN-OS', 'Green', '#4a5134', 2980, 20),
  ('nuru-short-set', 'ANAI-NURU-BEIGE-OS', 'Beige', '#c9cbc6', 4920, 10),
  ('nuru-short-set', 'ANAI-NURU-BLACK-OS', 'Black', '#111111', 4920, 10),
  ('nuru-short-set', 'ANAI-NURU-BROWN-OS', 'Brown', '#6f4631', 4920, 10),
  ('mia-cropped-tee', 'ANAI-MIA-BLACK-OS', 'Black', '#111111', 2800, 20),
  ('mia-cropped-tee', 'ANAI-MIA-BROWN-OS', 'Brown', '#6f4631', 2800, 20),
  ('mia-cropped-tee', 'ANAI-MIA-CREAM-OS', 'Cream', '#e8ddcd', 2800, 20)
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

update public.product_variants
set is_active = false
where sku in (
  'ANAI-NURU-BIRCH-OS',
  'ANAI-NURU-LILAC-OS',
  'ANAI-NURU-PINK-OS',
  'ANAI-SOCKS-WHITE-OS',
  'ANAI-SOCKS-BLACK-OS'
);

with seed_images (
  product_slug,
  image_url,
  sort_order
) as (
  values
  ('jackets', '/images/products/Nuru Zip-up/navy.webp', 0),
  ('jackets', '/images/products/Nuru Zip-up/brown.webp', 1),
  ('jackets', '/images/products/Nuru Zip-up/black.webp', 2),
  ('long-sleeve-round-neck', '/images/products/Reya Long sleeve, round neck/white.webp', 0),
  ('long-sleeve-round-neck', '/images/products/Reya Long sleeve, round neck/brown.webp', 1),
  ('long-sleeve-round-neck', '/images/products/Reya Long sleeve, round neck/black.webp', 2),
  ('long-sleeve-swirl-neck', '/images/products/Reya Long sleeve, swirl neck/cream.webp', 0),
  ('long-sleeve-swirl-neck', '/images/products/Reya Long sleeve, swirl neck/brown.webp', 1),
  ('long-sleeve-swirl-neck', '/images/products/Reya Long sleeve, swirl neck/black.webp', 2),
  ('minit-t-shirt', '/images/products/Aya Mini tee/black.webp', 0),
  ('sahara-corsage-set', '/images/products/Nia jogger set/navy blue.webp', 0),
  ('sahara-corsage-set', '/images/products/Nia jogger set/grey.webp', 1),
  ('sahara-corsage-set', '/images/products/Nia jogger set/black.webp', 2),
  ('strappy-bra', '/images/products/Zuri bra/white.webp', 0),
  ('strappy-bra', '/images/products/Zuri bra/brown.webp', 1),
  ('strappy-bra', '/images/products/Zuri bra/black.webp', 2),
  ('cropped-training-tee', '/images/products/Mia cropped t''S/burgandy.webp', 0),
  ('cropped-training-tee', '/images/products/Mia cropped t''S/white.webp', 1),
  ('cropped-training-tee', '/images/products/Mia cropped t''S/black.webp', 2),
  ('nuru-short-set', '/images/products/Jua jogger set/navy blue.webp', 0),
  ('nuru-short-set', '/images/products/Jua jogger set/grey.webp', 1),
  ('nuru-short-set', '/images/products/Jua jogger set/black.webp', 2),
  ('mia-cropped-tee', '/images/products/Mia cropped t''S/burgandy.webp', 0),
  ('mia-cropped-tee', '/images/products/Mia cropped t''S/white.webp', 1),
  ('mia-cropped-tee', '/images/products/Mia cropped t''S/black.webp', 2)
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

delete from public.product_images
where product_id in (select id from public.products)
  and image_url not in (
    '/images/products/Nuru Zip-up/navy.webp',
    '/images/products/Nuru Zip-up/brown.webp',
    '/images/products/Nuru Zip-up/black.webp',
    '/images/products/Reya Long sleeve, round neck/white.webp',
    '/images/products/Reya Long sleeve, round neck/brown.webp',
    '/images/products/Reya Long sleeve, round neck/black.webp',
    '/images/products/Reya Long sleeve, swirl neck/cream.webp',
    '/images/products/Reya Long sleeve, swirl neck/brown.webp',
    '/images/products/Reya Long sleeve, swirl neck/black.webp',
    '/images/products/Aya Mini tee/black.webp',
    '/images/products/Nia jogger set/navy blue.webp',
    '/images/products/Nia jogger set/grey.webp',
    '/images/products/Nia jogger set/black.webp',
    '/images/products/Zuri bra/white.webp',
    '/images/products/Zuri bra/brown.webp',
    '/images/products/Zuri bra/black.webp',
    '/images/products/Mia cropped t''S/burgandy.webp',
    '/images/products/Mia cropped t''S/white.webp',
    '/images/products/Mia cropped t''S/black.webp',
    '/images/products/Jua jogger set/navy blue.webp',
    '/images/products/Jua jogger set/grey.webp',
    '/images/products/Jua jogger set/black.webp'
  );
