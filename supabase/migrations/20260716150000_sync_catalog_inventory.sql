-- Keep the storefront catalogue and Supabase inventory variants in sync.
-- Existing stock quantities are deliberately preserved; new variants receive
-- the opening quantities shown in the catalogue.

insert into public.categories (name, slug, sort_order)
values ('Bottoms', 'bottoms', 25)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

with catalog_products (
  name,
  slug,
  description,
  category_slug,
  image_url,
  is_new
) as (
  values
    ('Nuru Zip-up', 'jackets', 'A fitted cropped zip-up jacket with a high collar, paneled front, and contrast sleeve stripes.', 'outerwear', '/images/products/Nuru Zip-up/navy.webp', true),
    ('Reya Long sleeve, round neck', 'long-sleeve-round-neck', 'A cropped long-sleeve top with a round neckline, smooth fitted body, and flared wrist cuffs.', 'tops', '/images/products/Reya Long sleeve, round neck/white.webp', true),
    ('Reya Long sleeve, swirl neck', 'long-sleeve-swirl-neck', 'A cropped long-sleeve top with a high neckline, smooth fitted body, and clean minimal finish.', 'tops', '/images/products/Reya Long sleeve, swirl neck/cream.webp', true),
    ('Aya Mini tee', 'minit-t-shirt', 'A fitted cropped mini tee with cap sleeves, a round neckline, and subtle contour seam details.', 'tops', '/images/products/Aya Mini tee/black.webp', true),
    ('Nia jogger set', 'sahara-corsage-set', 'A two-piece set with a layered-look crop top and high-waist biker shorts finished with contrast trim.', 'sets', '/images/products/Nia jogger set/navy blue.webp', true),
    ('Lela set', 'lela-set', 'A two-piece set with a high-neck crop top and matching high-waist tights with a crossover waistband.', 'sets', '/images/products/Lela set/brown.webp', true),
    ('Mvua flannel', 'mvua-flannel', 'A relaxed zip-collar pullover with a front pocket, elastic cuffs, and a cinched hem.', 'tops', '/images/products/Mvua flannel/black.webp', true),
    ('Zuri bra', 'strappy-bra', 'A minimal square-neck bra top with slim straps and a clean cropped band.', 'tops', '/images/products/Zuri bra/white.webp', true),
    ('Terra skirt - Padel/tennis bubble set', 'terra-skirt', 'A court-ready bubble skirt with a smooth waistband, gathered volume, and a matching cropped top.', 'bottoms', '/images/products/Terra skirt - Padel tennis bubble set/brown.webp', true),
    ('Jua jogger set', 'nuru-short-set', 'A two-piece set with a scoop-neck crop top and high-waist biker shorts finished with contrast trim.', 'sets', '/images/products/Jua jogger set/navy blue.webp', true),
    ('Mia cropped t''S', 'mia-cropped-tee', 'A short-sleeve cropped tee with a relaxed boxy shape and clean round neckline.', 'tops', '/images/products/Mia cropped t''S/burgandy.webp', true)
)
insert into public.products (
  name,
  slug,
  description,
  category_id,
  image_url,
  is_new,
  is_active
)
select
  catalog_products.name,
  catalog_products.slug,
  catalog_products.description,
  categories.id,
  catalog_products.image_url,
  catalog_products.is_new,
  true
from catalog_products
join public.categories as categories on categories.slug = catalog_products.category_slug
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description,
    category_id = excluded.category_id,
    image_url = excluded.image_url,
    is_new = excluded.is_new,
    is_active = true;

with catalog_variants (
  product_slug,
  sku,
  color,
  color_value,
  price_kes,
  opening_stock
) as (
  values
    ('jackets', 'ANAI-JACKETS-BLACK-OS', 'Black', '#111111', 3870, 2),
    ('jackets', 'ANAI-JACKETS-BROWN-OS', 'Brown', '#6f4631', 3870, 2),
    ('jackets', 'ANAI-JACKETS-NAVY-OS', 'Navy', '#253b54', 3870, 3),
    ('long-sleeve-round-neck', 'ANAI-LSRN-BLACK-OS', 'Black', '#111111', 2680, 1),
    ('long-sleeve-round-neck', 'ANAI-LSRN-BROWN-OS', 'Brown', '#6f4631', 2680, 1),
    ('long-sleeve-round-neck', 'ANAI-LSRN-WHITE-OS', 'White', '#f6f1ea', 2680, 1),
    ('long-sleeve-swirl-neck', 'ANAI-LSSN-BLACK-OS', 'Black', '#111111', 2980, 2),
    ('long-sleeve-swirl-neck', 'ANAI-LSSN-BROWN-OS', 'Brown', '#6f4631', 2980, 0),
    ('long-sleeve-swirl-neck', 'ANAI-LSSN-CREAM-OS', 'Cream', '#efe7dc', 2980, 1),
    ('minit-t-shirt', 'ANAI-MINIT-BLACK-OS', 'Black', '#111111', 2980, 1),
    ('sahara-corsage-set', 'ANAI-SAHARA-BLACK-OS', 'Black', '#111111', 5510, 1),
    ('sahara-corsage-set', 'ANAI-SAHARA-GREY-OS', 'Grey', '#d7d4c9', 5510, 1),
    ('sahara-corsage-set', 'ANAI-SAHARA-NAVY-OS', 'Navy blue', '#253b54', 5510, 1),
    ('lela-set', 'ANAI-LELA-BLACK-OS', 'Black', '#111111', 5060, 0),
    ('lela-set', 'ANAI-LELA-BROWN-OS', 'Brown', '#6f4631', 5060, 3),
    ('lela-set', 'ANAI-LELA-WHITE-OS', 'White', '#f6f1ea', 5060, 0),
    ('mvua-flannel', 'ANAI-MVUA-BLACK-OS', 'Black', '#111111', 4770, 3),
    ('mvua-flannel', 'ANAI-MVUA-BROWN-OS', 'Brown', '#6f4631', 4770, 0),
    ('mvua-flannel', 'ANAI-MVUA-CREAM-OS', 'Cream', '#efe7dc', 4770, 0),
    ('strappy-bra', 'ANAI-BRA-BLACK-OS', 'Black', '#111111', 2680, 1),
    ('strappy-bra', 'ANAI-BRA-BROWN-OS', 'Brown', '#6f4631', 2680, 1),
    ('strappy-bra', 'ANAI-BRA-WHITE-OS', 'White', '#f6f1ea', 2680, 1),
    ('terra-skirt', 'ANAI-TERRA-BLACK-OS', 'Black', '#111111', 2680, 1),
    ('terra-skirt', 'ANAI-TERRA-BURGUNDY-OS', 'Burgundy', '#4a2428', 2680, 1),
    ('terra-skirt', 'ANAI-TERRA-GREEN-OS', 'Green', '#4a5134', 2680, 0),
    ('nuru-short-set', 'ANAI-NURU-BLACK-OS', 'Black', '#111111', 4920, 1),
    ('nuru-short-set', 'ANAI-NURU-GREY-OS', 'Grey', '#c9cbc6', 4920, 1),
    ('nuru-short-set', 'ANAI-NURU-NAVY-OS', 'Navy blue', '#253b54', 4920, 1),
    ('mia-cropped-tee', 'ANAI-MIA-BLACK-OS', 'Black', '#111111', 2980, 2),
    ('mia-cropped-tee', 'ANAI-MIA-BURGUNDY-OS', 'Burgundy', '#4a2428', 2980, 2),
    ('mia-cropped-tee', 'ANAI-MIA-WHITE-OS', 'White', '#f6f1ea', 2980, 2)
)
insert into public.product_variants as variants (
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
  catalog_variants.sku,
  catalog_variants.color,
  catalog_variants.color_value,
  'One size',
  catalog_variants.price_kes,
  catalog_variants.opening_stock,
  true
from catalog_variants
join public.products as products on products.slug = catalog_variants.product_slug
on conflict (sku) do update
set product_id = excluded.product_id,
    color = excluded.color,
    color_value = excluded.color_value,
    size = excluded.size,
    price_kes = excluded.price_kes,
    is_active = true;

update public.product_variants as variants
set is_active = false
from public.products as products
where products.id = variants.product_id
  and products.slug in (
    'jackets',
    'long-sleeve-round-neck',
    'long-sleeve-swirl-neck',
    'minit-t-shirt',
    'sahara-corsage-set',
    'lela-set',
    'mvua-flannel',
    'strappy-bra',
    'terra-skirt',
    'nuru-short-set',
    'mia-cropped-tee'
  )
  and variants.sku not in (
    'ANAI-JACKETS-BLACK-OS', 'ANAI-JACKETS-BROWN-OS', 'ANAI-JACKETS-NAVY-OS',
    'ANAI-LSRN-BLACK-OS', 'ANAI-LSRN-BROWN-OS', 'ANAI-LSRN-WHITE-OS',
    'ANAI-LSSN-BLACK-OS', 'ANAI-LSSN-BROWN-OS', 'ANAI-LSSN-CREAM-OS',
    'ANAI-MINIT-BLACK-OS',
    'ANAI-SAHARA-BLACK-OS', 'ANAI-SAHARA-GREY-OS', 'ANAI-SAHARA-NAVY-OS',
    'ANAI-LELA-BLACK-OS', 'ANAI-LELA-BROWN-OS', 'ANAI-LELA-WHITE-OS',
    'ANAI-MVUA-BLACK-OS', 'ANAI-MVUA-BROWN-OS', 'ANAI-MVUA-CREAM-OS',
    'ANAI-BRA-BLACK-OS', 'ANAI-BRA-BROWN-OS', 'ANAI-BRA-WHITE-OS',
    'ANAI-TERRA-BLACK-OS', 'ANAI-TERRA-BURGUNDY-OS', 'ANAI-TERRA-GREEN-OS',
    'ANAI-NURU-BLACK-OS', 'ANAI-NURU-GREY-OS', 'ANAI-NURU-NAVY-OS',
    'ANAI-MIA-BLACK-OS', 'ANAI-MIA-BURGUNDY-OS', 'ANAI-MIA-WHITE-OS'
  );
