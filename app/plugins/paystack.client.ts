const PAYSTACK_SCRIPT_SRC = 'https://js.paystack.co/v1/inline.js'

type PaystackTransactionOptions = Record<string, unknown>

type PaystackSetup = {
  setup: (options: PaystackTransactionOptions) => {
    openIframe: () => void
  }
}

type PaystackWindow = Window & {
  PaystackPop?: PaystackSetup
}

type CreatePaystackTransaction = (options: PaystackTransactionOptions) => Promise<unknown>

let paystackScriptPromise: Promise<PaystackSetup> | undefined

const getPaystack = () => (window as PaystackWindow).PaystackPop

const loadPaystack = () => {
  const currentPaystack = getPaystack()

  if (currentPaystack) {
    return Promise.resolve(currentPaystack)
  }

  if (!paystackScriptPromise) {
    paystackScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${PAYSTACK_SCRIPT_SRC}"]`,
      )

      const resolvePaystack = () => {
        const loadedPaystack = getPaystack()

        if (loadedPaystack) {
          resolve(loadedPaystack)
        } else {
          reject(new Error('Paystack script loaded without PaystackPop.'))
        }
      }

      if (existingScript) {
        existingScript.addEventListener('load', resolvePaystack, { once: true })
        existingScript.addEventListener('error', () => reject(new Error('Paystack script failed.')), {
          once: true,
        })
        return
      }

      const script = document.createElement('script')
      script.async = true
      script.src = PAYSTACK_SCRIPT_SRC
      script.addEventListener('load', resolvePaystack, { once: true })
      script.addEventListener('error', () => reject(new Error('Paystack script failed.')), {
        once: true,
      })
      document.head.appendChild(script)
    })
  }

  return paystackScriptPromise
}

export default defineNuxtPlugin(() => {
  const createPaystackTransaction: CreatePaystackTransaction = async (options) => {
    const paystack = await loadPaystack()
    const handler = paystack.setup(options)

    handler.openIframe()
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
