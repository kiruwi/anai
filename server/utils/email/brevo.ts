const brevoEndpoint = 'https://api.brevo.com/v3/smtp/email'

export type BrevoResult = {
  messageId?: string
  messageIds?: string[]
  code?: string
  message?: string
}

type SendBrevoEmailOptions = {
  apiKey: string
  payload: Record<string, unknown>
  fetchImpl?: typeof fetch
}

export const sendBrevoEmail = async ({
  apiKey,
  payload,
  fetchImpl = fetch,
}: SendBrevoEmailOptions) => {
  const response = await fetchImpl(brevoEndpoint, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15_000),
  })
  const result = await response.json().catch(() => ({})) as BrevoResult

  return { response, result }
}
