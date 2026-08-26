-- Make PostgreSQL authoritative for every sellable catalogue field while
-- preserving the public product URLs already indexed by search engines.

alter table public.products
  add column if not exists public_slug text,
  add column if not exists hover_image_url text,
  add column if not exists display_order integer not null default 0,
  add column if not exists image_revision text,
  add column if not exists size_options jsonb not null default '[]'::jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_public_slug_format_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_public_slug_format_check
      check (public_slug is null or public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_display_order_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_display_order_check
      check (display_order >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_size_options_array_check'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_size_options_array_check
      check (jsonb_typeof(size_options) = 'array');
  end if;
end $$;

create unique index if not exists products_public_slug_idx
  on public.products (public_slug)
  where public_slug is not null;

create index if not exists products_active_display_order_idx
  on public.products (display_order, id)
  where is_active = true;

create index if not exists product_variants_active_product_size_color_idx
  on public.product_variants (product_id, size, color)
  where is_active = true;

with catalogue (
  slug,
  public_slug,
  description,
  image_url,
  hover_image_url,
  image_tone,
  size_guide_text,
  display_order
) as (
  values
    (
      'jackets',
      'nuru-zip-up',
      'A fitted cropped zip-up jacket with a high collar, paneled front, and contrast sleeve stripes.',
      '/images/products/Nuru Zip-up/navy.webp',
      '/images/products/Nuru Zip-up/brown.webp',
      'linear-gradient(135deg, #461828, #c66747)',
      'S: bust 35cm, length 48cm, shoulder 34cm, waistline 32cm. M: bust 37cm, length 49.5cm, shoulder 35.5cm, waistline 34cm. L: bust 39cm, length 51cm, shoulder 37cm, waistline 36cm. XL: bust 41cm, length 52.5cm, shoulder 38.5cm, waistline 38cm.',
      10
    ),
    (
      'long-sleeve-round-neck',
      'long-sleeve-round-neck',
      'A cropped long-sleeve top with a round neckline, smooth fitted body, and flared wrist cuffs.',
      '/images/products/Reya Long sleeve, round neck/white.webp',
      '/images/products/Reya Long sleeve, round neck/brown.webp',
      'linear-gradient(135deg, #4a481d, #d7c1a9)',
      'Long-sleeved. S/8: coat length 43cm, sleeve length 63cm, bust 68cm, bottom 62cm. M/10: coat length 44cm, sleeve length 64cm, bust 72cm, bottom 66cm. L/12: coat length 45cm, sleeve length 65cm, bust 76cm, bottom 70cm. XL/14: coat length 46cm, sleeve length 66cm, bust 80cm, bottom 74cm.',
      20
    ),
    (
      'long-sleeve-swirl-neck',
      'long-sleeve-swirl-neck',
      'A cropped long-sleeve top with a high neckline, smooth fitted body, and clean minimal finish.',
      '/images/products/Reya Long sleeve, swirl neck/cream.webp',
      '/images/products/Reya Long sleeve, swirl neck/brown.webp',
      'linear-gradient(135deg, #000000, #4a481d)',
      'Long-sleeved. Fabric: 78% nylon, 22% elastane. S/8: coat length 44cm, shoulder 35cm, sleeve length 60cm, bust 72cm, bottom 58cm. M/10: coat length 45cm, shoulder 36.2cm, sleeve length 61cm, bust 76cm, bottom 62cm. L/12: coat length 46cm, shoulder 37.4cm, sleeve length 62cm, bust 80cm, bottom 66cm. XL/14: coat length 47cm, shoulder 38.6cm, sleeve length 63cm, bust 84cm, bottom 70cm.',
      30
    ),
    (
      'minit-t-shirt',
      'aya-mini-tee',
      'A fitted cropped mini tee with cap sleeves, a round neckline, and subtle contour seam details.',
      '/images/products/Aya Mini tee/black.webp',
      null,
      'linear-gradient(135deg, #111111, #253b54)',
      null,
      40
    ),
    (
      'sahara-corsage-set',
      'nia-jogger-set',
      'A two-piece set with a layered-look crop top and high-waist biker shorts finished with contrast trim.',
      '/images/products/Nia jogger set/navy blue.webp',
      '/images/products/Nia jogger set/grey.webp',
      'linear-gradient(135deg, #d7d4c9, #111111)',
      null,
      50
    ),
    (
      'lela-set',
      'lela-set',
      'A two-piece set with a high-neck crop top and matching high-waist tights with a crossover waistband.',
      '/images/products/Lela set/brown.webp',
      '/images/products/Lela set/brown.webp',
      'linear-gradient(135deg, #d7d4c9, #111111)',
      null,
      60
    ),
    (
      'mvua-flannel',
      'mvua-flannel',
      'A relaxed zip-collar pullover with a front pocket, elastic cuffs, and a cinched hem.',
      '/images/products/Mvua flannel/black.webp',
      null,
      'linear-gradient(135deg, #111111, #6f4631)',
      null,
      70
    ),
    (
      'strappy-bra',
      'zuri-bra',
      'A minimal square-neck bra top with slim straps and a clean cropped band.',
      '/images/products/Zuri bra/white.webp',
      '/images/products/Zuri bra/brown.webp',
      'linear-gradient(135deg, #111111, #f6f1ea)',
      null,
      80
    ),
    (
      'terra-skirt',
      'terra-skirt',
      'A court-ready bubble skirt with a smooth waistband, gathered volume, and a matching cropped top.',
      '/images/products/Terra skirt - Padel tennis bubble set/brown.webp',
      null,
      'linear-gradient(135deg, #111111, #4a5134)',
      null,
      90
    ),
    (
      'nuru-short-set',
      'jua-jogger-set',
      'A two-piece set with a scoop-neck crop top and high-waist biker shorts finished with contrast trim.',
      '/images/products/Jua jogger set/navy blue.webp',
      '/images/products/Jua jogger set/grey.webp',
      'linear-gradient(135deg, #d7c1a9, #4a481d)',
      null,
      100
    ),
    (
      'mia-cropped-tee',
      'mia-cropped-tee',
      'A short-sleeve cropped tee with a relaxed boxy shape and clean round neckline.',
      '/images/products/Mia cropped t''S/burgandy.webp',
      '/images/products/Mia cropped t''S/white.webp',
      'linear-gradient(135deg, #111111, #e8ddcd)',
      null,
      110
    )
),
shared_size_options as (
  select jsonb_build_array(
    jsonb_build_object('label', 'XS/6'),
    jsonb_build_object(
      'label', 'S/8', 'coatLengthCm', 44, 'shoulderCm', 35,
      'sleeveLengthCm', 60, 'bustCm', 72, 'bottomCm', 58
    ),
    jsonb_build_object(
      'label', 'M/10', 'coatLengthCm', 45, 'shoulderCm', 36.2,
      'sleeveLengthCm', 61, 'bustCm', 76, 'bottomCm', 62
    ),
    jsonb_build_object(
      'label', 'L/12', 'coatLengthCm', 46, 'shoulderCm', 37.4,
      'sleeveLengthCm', 62, 'bustCm', 80, 'bottomCm', 66
    ),
    jsonb_build_object(
      'label', 'XL/14', 'coatLengthCm', 47, 'shoulderCm', 38.6,
      'sleeveLengthCm', 63, 'bustCm', 84, 'bottomCm', 70
    )
  ) as value
)
update public.products as products
set public_slug = catalogue.public_slug,
    description = catalogue.description,
    image_url = catalogue.image_url,
    hover_image_url = catalogue.hover_image_url,
    image_tone = catalogue.image_tone,
    size_guide_text = catalogue.size_guide_text,
    display_order = catalogue.display_order,
    image_revision = 'kenyan-models-diverse-20260722',
    size_options = shared_size_options.value,
    is_new = true,
    is_active = true
from catalogue
cross join shared_size_options
where products.slug = catalogue.slug;

-- The recorded stocktake is for M/10. Future sizes are represented by their
-- own colour-and-size variants instead of an application-level allow-list.
update public.product_variants as variants
set size = 'M/10'
from public.products as products
where products.id = variants.product_id
  and products.slug in (
    'jackets', 'long-sleeve-round-neck', 'long-sleeve-swirl-neck',
    'minit-t-shirt', 'sahara-corsage-set', 'lela-set', 'mvua-flannel',
    'strappy-bra', 'terra-skirt', 'nuru-short-set', 'mia-cropped-tee'
  )
  and variants.is_active = true;

update public.products
set is_active = false
where slug = 'cropped-training-tee';

with catalogue_images (product_slug, color, image_url, sort_order) as (
  values
    ('jackets', 'Navy', '/images/products/Nuru Zip-up/navy.webp', 0),
    ('jackets', 'Black', '/images/products/Nuru Zip-up/black.webp', 1),
    ('jackets', 'Brown', '/images/products/Nuru Zip-up/brown.webp', 2),
    ('long-sleeve-round-neck', 'White', '/images/products/Reya Long sleeve, round neck/white.webp', 0),
    ('long-sleeve-round-neck', 'Black', '/images/products/Reya Long sleeve, round neck/black.webp', 1),
    ('long-sleeve-round-neck', 'Brown', '/images/products/Reya Long sleeve, round neck/brown.webp', 2),
    ('long-sleeve-swirl-neck', 'Cream', '/images/products/Reya Long sleeve, swirl neck/cream.webp', 0),
    ('long-sleeve-swirl-neck', 'Black', '/images/products/Reya Long sleeve, swirl neck/black.webp', 1),
    ('long-sleeve-swirl-neck', 'Brown', '/images/products/Reya Long sleeve, swirl neck/brown.webp', 2),
    ('minit-t-shirt', 'Black', '/images/products/Aya Mini tee/black.webp', 0),
    ('sahara-corsage-set', 'Navy blue', '/images/products/Nia jogger set/navy blue.webp', 0),
    ('sahara-corsage-set', 'Black', '/images/products/Nia jogger set/black.webp', 1),
    ('sahara-corsage-set', 'Grey', '/images/products/Nia jogger set/grey.webp', 2),
    ('lela-set', 'White', '/images/products/Lela set/white.webp', 0),
    ('lela-set', 'Brown', '/images/products/Lela set/brown.webp', 1),
    ('lela-set', 'Black', '/images/products/Lela set/black.webp', 2),
    ('mvua-flannel', 'Black', '/images/products/Mvua flannel/black.webp', 0),
    ('strappy-bra', 'White', '/images/products/Zuri bra/white.webp', 0),
    ('strappy-bra', 'Black', '/images/products/Zuri bra/black.webp', 1),
    ('strappy-bra', 'Brown', '/images/products/Zuri bra/brown.webp', 2),
    ('terra-skirt', null, '/images/products/Terra skirt - Padel tennis bubble set/brown.webp', 0),
    ('nuru-short-set', 'Navy blue', '/images/products/Jua jogger set/navy blue.webp', 0),
    ('nuru-short-set', 'Black', '/images/products/Jua jogger set/black.webp', 1),
    ('nuru-short-set', 'Grey', '/images/products/Jua jogger set/grey.webp', 2),
    ('mia-cropped-tee', 'Burgundy', '/images/products/Mia cropped t''S/burgandy.webp', 0),
    ('mia-cropped-tee', 'Black', '/images/products/Mia cropped t''S/black.webp', 1),
    ('mia-cropped-tee', 'White', '/images/products/Mia cropped t''S/white.webp', 2)
)
insert into public.product_images (product_id, variant_id, image_url, alt_text, sort_order)
select
  products.id,
  variants.id,
  catalogue_images.image_url,
  products.name,
  catalogue_images.sort_order
from catalogue_images
join public.products as products
  on products.slug = catalogue_images.product_slug
left join public.product_variants as variants
  on variants.product_id = products.id
 and lower(variants.color) = lower(catalogue_images.color)
 and variants.is_active = true
on conflict (product_id, image_url) do update
set variant_id = excluded.variant_id,
    alt_text = excluded.alt_text,
    sort_order = excluded.sort_order;

-- An active inventory record is not necessarily published on the storefront.
-- A null public_slug deliberately keeps legacy or staff-only products out of
-- public catalogue queries without deleting or deactivating their records.
