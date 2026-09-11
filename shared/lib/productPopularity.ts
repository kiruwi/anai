import type { CatalogProduct } from '../types/catalog'

export type ProductPopularity = {
  viewsBySlug: Record<string, number>
  source: 'google-analytics' | 'fallback'
  updatedAt: string | null
}

// Include legacy URLs as well as the public product URL in each product's total.
export const sortProductsByViews = <T extends Pick<CatalogProduct, 'slug' | 'urlSlug'>>(
  products: readonly T[],
  viewsBySlug: Record<string, number>,
): T[] => {
  const views = (product: T) => [...new Set([product.slug, product.urlSlug])]
    .reduce((total, slug) => {
      const count = slug && Object.hasOwn(viewsBySlug, slug) ? viewsBySlug[slug] : 0
      return total + (typeof count === 'number' && Number.isFinite(count) && count > 0 ? count : 0)
    }, 0)

  // Stable sorting preserves catalogue order for ties and products without views.
  return [...products].sort((left, right) => views(right) - views(left))
}
