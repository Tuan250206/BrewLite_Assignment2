'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, X } from 'lucide-react';
import Image from 'next/image';
import { orderPaymentFetch } from '@/lib/order-payment-api';

interface PaymentQrModalProps {
  isMock?: boolean;
  session: {
    orderId: string;
    name: string;
    transactionId: string;
    paymentUrl: string;
    qrCodeDataUrl: string;
    mockEmail: {
      to: string;
      from: string;
      subject: string;
      orderId: string;
      transactionId: string;
      amount: number;
      method: string;
      testAccount: string;
      testCredential: string;
      confirmationUrl: string;
      expiresAt: string;
    } | null;
  } | null;
  onClose: () => void;
  cancelError?: string | null;
  cancelling?: boolean;
  onConfirmed: (orderId: string) => void;
  onFailed: (orderId: string) => void;
}

export default function PaymentQrModal({
  isMock = false,
  session,
  onClose,
  cancelError,
  cancelling = false,
  onConfirmed,
  onFailed,
}: PaymentQrModalProps) {
  const [showEmail, setShowEmail] = useState(false);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState(
    'Đang chờ xác nhận trạng thái thanh toán từ hệ thống.',
  );
  const onConfirmedRef = useRef(onConfirmed);
  const onFailedRef = useRef(onFailed);

  useEffect(() => {
    onConfirmedRef.current = onConfirmed;
    onFailedRef.current = onFailed;
  }, [onConfirmed, onFailed]);

  useEffect(() => {
    if (!session) return;

    let active = true;
    let timeoutId: ReturnType<typeof setTimeout>;
    const checkPaymentStatus = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setPaymentStatusMessage(
          'Không tìm thấy phiên đăng nhập để kiểm tra trạng thái thanh toán.',
        );
        return;
      }

      try {
        const response = await orderPaymentFetch(
          `http://localhost:3001/payments/orders/${encodeURIComponent(session.orderId)}/status`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) {
          throw new Error('Không thể kiểm tra trạng thái thanh toán.');
        }
        const status: unknown = await response.json();
        if (!active) return;

        if (
          typeof status === 'object' &&
          status !== null &&
          'paymentStatus' in status &&
          status.paymentStatus === 'PAID'
        ) {
          onConfirmedRef.current(session.orderId);
          return;
        }
        if (
          typeof status === 'object' &&
          status !== null &&
          'paymentStatus' in status &&
          status.paymentStatus === 'PAYMENT_FAILED'
        ) {
          onFailedRef.current(session.orderId);
          return;
        }

        setPaymentStatusMessage(
          'Thanh toán chưa được xác nhận. Trạng thái sẽ tiếp tục được kiểm tra.',
        );
      } catch (error) {
        if (!active) return;
        console.error('Lỗi kiểm tra trạng thái thanh toán:', error);
        setPaymentStatusMessage(
          'Chưa kiểm tra được trạng thái thanh toán. Hệ thống sẽ thử lại.',
        );
      }

      if (active) {
        timeoutId = setTimeout(checkPaymentStatus, 2000);
      }
    };

    timeoutId = setTimeout(checkPaymentStatus, 1500);
    return () => {
      active = false;
      clearTimeout(timeoutId);    
    };
  }, [session]);

  if (!session) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="payment-qr-title"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-2xl sm:p-6"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          disabled={cancelling}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="mt-1 text-sm text-stone-600">
          {isMock
            ? 'Mock Payment đang chờ giao diện nhận kết quả kiểm thử.'
            : 'Giao dịch mô phỏng đang chờ xác nhận kết quả từ hệ thống.'}
        </p>
        {isMock && (
          <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
            MOCK ONLY — không gọi cổng thanh toán và không có giao dịch tiền thật.
          </p>
        )}
        <p className="mt-1 text-xs text-stone-500">
          Trạng thái chỉ được cập nhật theo phản hồi của API.
        </p>
        <Image
          alt="Mã QR thanh toán "
          className="mx-auto my-4 h-56 w-56"
          height={224}
          src={session.qrCodeDataUrl}
          unoptimized
          width={224}
        />
        <p className="mt-3 break-all text-xs text-stone-500">
          Mã giao dịch {session.transactionId}
        </p>
        <p
          aria-live="polite"
          className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800"
          role="status"
        >
          {paymentStatusMessage}
        </p>
        {cancelError && (
          <p
            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800"
            role="alert"
          >
            {cancelError}
          </p>
        )}
        <div className="mt-5 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => setShowEmail((visible) => !visible)}
            disabled={!session.mockEmail}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {showEmail ? 'Ẩn email' : 'Xem email'}
          </button>
        </div>
        {showEmail && session.mockEmail && (
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-4 text-left">
            <div className="flex items-center gap-2 text-sm font-bold text-stone-800">
              <Mail className="h-4 w-4 text-amber-700" />
              Email xác nhận mô phỏng
            </div>
            <p className="mt-2 text-xs text-stone-600">
              <span className="font-semibold">Đến:</span> {session.mockEmail.to}
            </p>
            <p className="mt-1 text-xs text-stone-600">
              <span className="font-semibold">Từ:</span> {session.mockEmail.from}
            </p>
            <p className="mt-1 text-xs text-stone-600">
              <span className="font-semibold">Tiêu đề:</span>{' '}
              {session.mockEmail.subject}
            </p>
            <div className="mt-3 rounded-lg bg-white p-3 text-xs text-stone-700">
              <p>Số tiền: {session.mockEmail.amount.toLocaleString('vi-VN')} ₫</p>
              <p className="mt-1">
                Phương thức: {session.mockEmail.method}
              </p>
              <p>
                Tài khoản test: <strong>{session.mockEmail.testAccount}</strong>
              </p>
              <p className="mt-1">
                Mật khẩu test: <strong>{session.mockEmail.testCredential}</strong>
              </p>
              <a
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-amber-700 px-3 py-2.5 text-sm font-semibold text-white hover:bg-amber-800"
                href={session.mockEmail.confirmationUrl}
                rel="noreferrer"
                target="_blank"
              >
                Xác nhận kết quả mô phỏng
              </a>
              <p className="mt-2 text-[11px] text-stone-500">
                Liên kết hết hạn lúc{' '}
                {new Date(session.mockEmail.expiresAt).toLocaleTimeString(
                  'vi-VN',
                )}
                .
              </p>
            </div>
          </div>
        )}
        <p className="mt-3 break-words text-xs text-amber-700">
          Sử dụng thông tin và liên kết xác nhận do API mô phỏng trả về. Giao
          diện không kết nối ngân hàng, ví điện tử hoặc cổng thanh toán thật.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Đóng cửa sổ sẽ gửi yêu cầu hủy đơn đang chờ theo luồng hiện tại.
        </p>
      </section>
    </div>
  );
}
