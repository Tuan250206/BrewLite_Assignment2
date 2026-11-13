import {
  handleMockOrderPaymentRequest,
  setMockCheckoutSnapshot,
  type MockCheckoutItem,
} from './order-payment-mock';

export function isOrderPaymentMockEnabled(): boolean {
  return process.env.NEXT_PUBLIC_BREWLITE_ORDER_MOCK === 'true';
}

export function setCheckoutMockSnapshot(
  items: readonly MockCheckoutItem[],
): void {
  if (isOrderPaymentMockEnabled()) {
    setMockCheckoutSnapshot(items);
  }
}

export function orderPaymentFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  if (!isOrderPaymentMockEnabled()) {
    return fetch(input, init);
  }

  const url = new URL(
    input instanceof Request ? input.url : String(input),
    window.location.origin,
  );
  if (
    url.pathname === '/orders' ||
    url.pathname.startsWith('/orders/') ||
    url.pathname === '/payments' ||
    url.pathname.startsWith('/payments/')
  ) {
    return handleMockOrderPaymentRequest(input, init);
  }

  return fetch(input, init);
}
