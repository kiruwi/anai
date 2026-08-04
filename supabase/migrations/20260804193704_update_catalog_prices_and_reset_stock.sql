-- Apply the August 2026 catalogue prices and restore the recorded physical
-- stocktake after the live M-Pesa checkout test.
with catalog_update (sku, price_kes, stock_quantity) as (
  values
    ('ANAI-JACKETS-BLACK-OS', 2200, 2),
    ('ANAI-JACKETS-BROWN-OS', 2200, 2),
    ('ANAI-JACKETS-NAVY-OS', 2200, 3),
    ('ANAI-LSRN-BLACK-OS', 1990, 1),
    ('ANAI-LSRN-BROWN-OS', 1990, 1),
    ('ANAI-LSRN-WHITE-OS', 1990, 1),
    ('ANAI-LSSN-BLACK-OS', 1990, 2),
    ('ANAI-LSSN-BROWN-OS', 1990, 0),
    ('ANAI-LSSN-CREAM-OS', 1990, 1),
    ('ANAI-MINIT-BLACK-OS', 1500, 1),
    ('ANAI-SAHARA-BLACK-OS', 4490, 1),
    ('ANAI-SAHARA-GREY-OS', 4490, 1),
    ('ANAI-SAHARA-NAVY-OS', 4490, 1),
    ('ANAI-LELA-BLACK-OS', 4990, 0),
    ('ANAI-LELA-BROWN-OS', 4990, 3),
    ('ANAI-LELA-WHITE-OS', 4990, 0),
    ('ANAI-MVUA-BLACK-OS', 3290, 3),
    ('ANAI-MVUA-BROWN-OS', 3290, 0),
    ('ANAI-MVUA-CREAM-OS', 3290, 0),
    ('ANAI-BRA-BLACK-OS', 1499, 1),
    ('ANAI-BRA-BROWN-OS', 1499, 1),
    ('ANAI-BRA-WHITE-OS', 1499, 1),
    ('ANAI-TERRA-BLACK-OS', 2490, 1),
    ('ANAI-TERRA-BURGUNDY-OS', 2490, 1),
    ('ANAI-TERRA-GREEN-OS', 2490, 0),
    ('ANAI-NURU-BLACK-OS', 4490, 1),
    ('ANAI-NURU-GREY-OS', 4490, 1),
    ('ANAI-NURU-NAVY-OS', 4490, 1),
    ('ANAI-MIA-BLACK-OS', 1600, 2),
    ('ANAI-MIA-BURGUNDY-OS', 1600, 2),
    ('ANAI-MIA-WHITE-OS', 1600, 2)
)
update public.product_variants as variants
set price_kes = catalog_update.price_kes,
    stock_quantity = catalog_update.stock_quantity,
    is_active = true
from catalog_update
where variants.sku = catalog_update.sku;
