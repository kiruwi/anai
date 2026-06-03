declare module '@paystack/inline-js' {
  export type PaystackSuccessResponse = {
    id: number
    reference: string
    message: string
  }

  export type PaystackErrorResponse = {
    message: string
  }

  export type PaystackTransactionOptions = {
    key: string
    email: string
    amount: number
    currency?: string
    firstName?: string
    lastName?: string
    phone?: string
    reference?: string
    metadata?: Record<string, unknown>
    onLoad?: (transaction: { id: number; customer: Record<string, unknown>; accessCode: string }) => void
    onSuccess?: (transaction: PaystackSuccessResponse) => void
    onCancel?: () => void
    onError?: (error: PaystackErrorResponse) => void
  }

  export default class PaystackPop {
    newTransaction(options: PaystackTransactionOptions): unknown
  }
}
