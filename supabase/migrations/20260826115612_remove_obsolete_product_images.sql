-- Keep the database gallery aligned with the versioned product images shipped
-- in public/images/products. Earlier catalogue imports used different folder
-- names and left those obsolete rows alongside the current images.
with canonical_images (product_slug, image_url) as (
  values
    ('jackets', '/images/products/Nuru Zip-up/navy.webp'),
    ('jackets', '/images/products/Nuru Zip-up/black.webp'),
    ('jackets', '/images/products/Nuru Zip-up/brown.webp'),
    ('long-sleeve-round-neck', '/images/products/Reya Long sleeve, round neck/white.webp'),
    ('long-sleeve-round-neck', '/images/products/Reya Long sleeve, round neck/black.webp'),
    ('long-sleeve-round-neck', '/images/products/Reya Long sleeve, round neck/brown.webp'),
    ('long-sleeve-swirl-neck', '/images/products/Reya Long sleeve, swirl neck/cream.webp'),
    ('long-sleeve-swirl-neck', '/images/products/Reya Long sleeve, swirl neck/black.webp'),
    ('long-sleeve-swirl-neck', '/images/products/Reya Long sleeve, swirl neck/brown.webp'),
    ('minit-t-shirt', '/images/products/Aya Mini tee/black.webp'),
    ('sahara-corsage-set', '/images/products/Nia jogger set/navy blue.webp'),
    ('sahara-corsage-set', '/images/products/Nia jogger set/black.webp'),
    ('sahara-corsage-set', '/images/products/Nia jogger set/grey.webp'),
    ('lela-set', '/images/products/Lela set/white.webp'),
    ('lela-set', '/images/products/Lela set/brown.webp'),
    ('lela-set', '/images/products/Lela set/black.webp'),
    ('mvua-flannel', '/images/products/Mvua flannel/black.webp'),
    ('strappy-bra', '/images/products/Zuri bra/white.webp'),
    ('strappy-bra', '/images/products/Zuri bra/black.webp'),
    ('strappy-bra', '/images/products/Zuri bra/brown.webp'),
    ('terra-skirt', '/images/products/Terra skirt - Padel tennis bubble set/brown.webp'),
    ('nuru-short-set', '/images/products/Jua jogger set/navy blue.webp'),
    ('nuru-short-set', '/images/products/Jua jogger set/black.webp'),
    ('nuru-short-set', '/images/products/Jua jogger set/grey.webp'),
    ('mia-cropped-tee', '/images/products/Mia cropped t''S/burgandy.webp'),
    ('mia-cropped-tee', '/images/products/Mia cropped t''S/black.webp'),
    ('mia-cropped-tee', '/images/products/Mia cropped t''S/white.webp')
),
catalogue_products as (
  select products.id, products.slug
  from public.products as products
  where products.slug in (select distinct product_slug from canonical_images)
)
delete from public.product_images as images
using catalogue_products as products
where images.product_id = products.id
  and not exists (
    select 1
    from canonical_images
    where canonical_images.product_slug = products.slug
      and canonical_images.image_url = images.image_url
  );
