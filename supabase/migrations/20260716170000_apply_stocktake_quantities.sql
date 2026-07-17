-- Apply the physical stocktake supplied on 2026-07-16.
-- Product totals: Lela 3, Mia 6, Terra 2, Nuru 7, both Reya tops 3,
-- Aya 1, Mvua 3, Jua 3, Nia 3, and Zuri 3.

with stocktake (sku, stock_quantity) as (
  values
    ('ANAI-JACKETS-BLACK-OS', 2),
    ('ANAI-JACKETS-BROWN-OS', 2),
    ('ANAI-JACKETS-NAVY-OS', 3),
    ('ANAI-LSRN-BLACK-OS', 1),
    ('ANAI-LSRN-BROWN-OS', 1),
    ('ANAI-LSRN-WHITE-OS', 1),
    ('ANAI-LSSN-BLACK-OS', 2),
    ('ANAI-LSSN-BROWN-OS', 0),
    ('ANAI-LSSN-CREAM-OS', 1),
    ('ANAI-MINIT-BLACK-OS', 1),
    ('ANAI-SAHARA-BLACK-OS', 1),
    ('ANAI-SAHARA-GREY-OS', 1),
    ('ANAI-SAHARA-NAVY-OS', 1),
    ('ANAI-LELA-BLACK-OS', 0),
    ('ANAI-LELA-BROWN-OS', 3),
    ('ANAI-LELA-WHITE-OS', 0),
    ('ANAI-MVUA-BLACK-OS', 3),
    ('ANAI-MVUA-BROWN-OS', 0),
    ('ANAI-MVUA-CREAM-OS', 0),
    ('ANAI-BRA-BLACK-OS', 1),
    ('ANAI-BRA-BROWN-OS', 1),
    ('ANAI-BRA-WHITE-OS', 1),
    ('ANAI-TERRA-BLACK-OS', 1),
    ('ANAI-TERRA-BURGUNDY-OS', 1),
    ('ANAI-TERRA-GREEN-OS', 0),
    ('ANAI-NURU-BLACK-OS', 1),
    ('ANAI-NURU-GREY-OS', 1),
    ('ANAI-NURU-NAVY-OS', 1),
    ('ANAI-MIA-BLACK-OS', 2),
    ('ANAI-MIA-BURGUNDY-OS', 2),
    ('ANAI-MIA-WHITE-OS', 2)
)
update public.product_variants as variants
set stock_quantity = stocktake.stock_quantity,
    is_active = true
from stocktake
where variants.sku = stocktake.sku;
