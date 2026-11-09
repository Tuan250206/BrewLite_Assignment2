'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Mail, X } from 'lucide-react';
import Image from 'next/image';

interface PaymentQrModalProps {
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
  onConfirmed: (orderId: string) => void;
  onFailed: (orderId: string) => void;
}

export default function PaymentQrModal({
  session,
  onClose,
  onConfirmed,
  onFailed,
}: PaymentQrModalProps) {
  const [showEmail, setShowEmail] = useState(false);
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
      if (!token) return;

      try {
        const response = await fetch(
          `http://localhost:3001/payments/orders/${encodeURIComponent(session.orderId)}/status`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (!response.ok) {
          throw new Error('Không thể kiểm tra trạng thái thanh toán.');
        }
        const status = await response.json();
        if (!active) return;

        if (status.paymentStatus === 'PAID') {
          onConfirmedRef.current(session.orderId);
          return;
        }
        if (status.paymentStatus === 'PAYMENT_FAILED') {
          onFailedRef.current(session.orderId);
          return;
        }
      } catch (error) {
        console.error('Lỗi kiểm tra trạng thái thanh toán:', error);
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
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 text-center shadow-2xl"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700"
        >
          <X className="h-5 w-5" />
        </button>
        <p className="mt-1 text-sm text-stone-600">
          Quét mã QR hoặc mở cổng thanh toán để tiếp tục.
        </p>
        <p className="mt-1 text-xs text-stone-500">
          Ứng dụng sẽ tự cập nhật khi nhận được phản hồi từ cổng thanh toán.
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
              Email xác nhận ảo (không gửi Gmail thật)
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
                Xác nhận thanh toán <ExternalLink className="h-4 w-4" />
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
        <p className="mt-3 text-xs text-amber-700">
          Bấm nút xác nhận trong email để mở cổng B, sau đó xác nhận giao dịch
          tại đó.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Đóng cửa sổ này sẽ hủy đơn hàng đang chờ.
        </p>
      </section>
    </div>
  );
}
