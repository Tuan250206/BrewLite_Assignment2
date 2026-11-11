import {
  handleMockOrderPaymentRequest,
  setMockCheckoutSnapshot,
  type MockCheckoutItem,
} from './order-payment-mock';

export function isOrderPaymentMockEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BREWLITE_ORDER_MOCK === 'true';
}

export function setCheckoutMockSnapshot(items: readonly MockCheckoutItem[]): void {
  if (isOrderPaymentMockEnabled()) {
    setMockCheckoutSnapshot(items);
  }
}

export function orderPaymentFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (isOrderPaymentMockEnabled()) {
    const url = input instanceof Request ? input.url : String(input);
    const pathname = new URL(url, window.location.origin).pathname;
    if (pathname === '/orders' || pathname.startsWith('/orders/')) {
      return handleMockOrderPaymentRequest(input, init);
    }
    if (pathname === '/payments' || pathname.startsWith('/payments/')) {
      return handleMockOrderPaymentRequest(input, init);
    }
  }

  return fetch(input, init);
}
