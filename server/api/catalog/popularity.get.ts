import { setResponseHeader } from 'h3'
import { getProductPopularity } from '../../utils/productPopularity'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event)
  const popularity = await getProductPopularity({
    propertyId: config.ga4PropertyId,
    clientEmail: config.ga4ClientEmail,
    privateKey: config.ga4PrivateKey,
    siteUrl: config.public.siteUrl,
  })
  setResponseHeader(event, 'cache-control', 'public, max-age=60, s-maxage=60')
  return popularity
})
