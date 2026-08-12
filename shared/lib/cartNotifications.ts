export type CartQuantityResult = {
  quantity: number
  wasAdjusted: boolean
}

export const clampCartQuantity = (
  requestedQuantity: number,
  availableQuantity: number,
): CartQuantityResult => {
  const normalizedAvailable = Number.isFinite(availableQuantity)
    ? Math.max(0, Math.floor(availableQuantity))
    : 0
  const normalizedRequested = Number.isFinite(requestedQuantity)
    ? Math.max(1, Math.floor(requestedQuantity))
    : 1
  const quantity = Math.min(normalizedRequested, normalizedAvailable)

  return {
    quantity,
    wasAdjusted: normalizedRequested > normalizedAvailable,
  }
}

export const createQuantityAdjustedNotification = (
  productName: string,
  availableQuantity: number,
) => ({
  type: 'warning' as const,
  title: 'Quantity adjusted',
  message: availableQuantity === 1
    ? `Only 1 item is available for ${productName}. Your bag quantity is now 1.`
    : `Only ${availableQuantity} items are available for ${productName}. Your bag quantity is now ${availableQuantity}.`,
})

export const createHydratedCartWarning = () => ({
  type: 'warning' as const,
  title: 'Your bag was updated',
  message: 'Invalid or unavailable items were removed. Review your bag before checkout.',
})
