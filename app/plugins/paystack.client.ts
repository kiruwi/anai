import PaystackPop, { type PaystackTransactionOptions } from '@paystack/inline-js'

type CreatePaystackTransaction = (options: PaystackTransactionOptions) => Promise<unknown>

const paystack = new PaystackPop()

export default defineNuxtPlugin(() => {
  const createPaystackTransaction: CreatePaystackTransaction = async (options) => {
    return paystack.newTransaction(options)
  }

  return {
    provide: {
      createPaystackTransaction,
    },
  }
})

declare module '#app' {
  interface NuxtApp {
    $createPaystackTransaction: CreatePaystackTransaction
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $createPaystackTransaction: CreatePaystackTransaction
  }
}
