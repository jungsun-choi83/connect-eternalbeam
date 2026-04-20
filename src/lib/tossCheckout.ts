type TossRequestPaymentParams = {
  amount: number
  orderId: string
  orderName: string
  customerEmail: string
  successUrl: string
  failUrl: string
}

type TossPaymentsInstance = {
  requestPayment(method: '카드', params: TossRequestPaymentParams): Promise<void>
}

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => TossPaymentsInstance
  }
}

function ensureTossScript(): Promise<void> {
  if (window.TossPayments) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-toss-payments="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('토스 스크립트를 불러오지 못했습니다.')), {
        once: true,
      })
      return
    }
    const script = document.createElement('script')
    script.src = 'https://js.tosspayments.com/v1/payment'
    script.async = true
    script.dataset.tossPayments = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('토스 스크립트를 불러오지 못했습니다.'))
    document.head.appendChild(script)
  })
}

function randomOrderId(): string {
  return `ec_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

export async function startTossTestCheckout(email: string): Promise<void> {
  await ensureTossScript()
  const clientKey = import.meta.env.VITE_TOSS_CLIENT_KEY?.trim() || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq'
  const tossFactory = window.TossPayments
  if (!tossFactory) {
    throw new Error('토스 결제 SDK 초기화에 실패했습니다.')
  }
  const tossPayments = tossFactory(clientKey)
  await tossPayments.requestPayment('카드', {
    amount: 1000,
    orderId: randomOrderId(),
    orderName: '이터널 커넥트 월 구독(테스트 결제)',
    customerEmail: email,
    successUrl: `${window.location.origin}/payments/toss/success`,
    failUrl: `${window.location.origin}/payments/toss/fail`,
  })
}
