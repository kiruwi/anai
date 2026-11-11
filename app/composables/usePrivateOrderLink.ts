export function usePrivateOrderLink() {
  const token = ref('')
  function readLink() {
    token.value = window.location.hash.slice(1)
    if (window.location.hash) {
      window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
    }
  }
  return { token, readLink }
}

export function returnFormError(error: unknown) {
  const response = error as { data?: { statusMessage?: string }; statusMessage?: string }
  return response?.data?.statusMessage || response?.statusMessage || 'This action could not be completed. Please try again.'
}
