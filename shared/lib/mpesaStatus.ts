export const isMpesaCancellation = (resultCode: unknown, resultDescription: unknown) => {
  if (Number(resultCode) === 1032) return true

  const description = typeof resultDescription === 'string' ? resultDescription.trim() : ''
  return /\bcancel(?:led|ed|lation|ing)?\b/i.test(description)
}
