'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: AuthUser) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(data: unknown, fallback: string): string {
  if (!isRecord(data) || !('message' in data)) return fallback;

  if (typeof data.message === 'string') return data.message;
  if (
    Array.isArray(data.message) &&
    data.message.every((message) => typeof message === 'string')
  ) {
    return data.message.join(' ');
  }
  return fallback;
}

function parseAuthResponse(value: unknown): {
  token: string;
  user: AuthUser;
} | null {
  if (!isRecord(value) || !isRecord(value.user)) return null;

  const token =
    typeof value.accessToken === 'string'
      ? value.accessToken
      : typeof value.token === 'string'
        ? value.token
        : '';
  const { id, email } = value.user;

  if (
    !token.trim() ||
    typeof id !== 'string' ||
    !id.trim() ||
    typeof email !== 'string' ||
    !email.trim()
  ) {
    return null;
  }

  return { token, user: { id, email } };
}

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const switchMode = (login: boolean) => {
    if (loading) return;
    setIsLogin(login);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const normalizedEmail = email.trim();
    if (!isLogin && password.length < 8) {
      setError('Mật khẩu phải có ít nhất 8 ký tự.');
      return;
    }
    if (!isLogin && password !== confirmPassword) {
      setError('Mật khẩu nhập lại không khớp.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      let data: unknown = null;
      try {
        data = (await response.json()) as unknown;
      } catch {
        if (response.ok && isLogin) {
          throw new Error('Phản hồi đăng nhập không hợp lệ.');
        }
      }

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            isLogin ? 'Đăng nhập thất bại.' : 'Đăng ký thất bại.',
          ),
        );
      }

      if (!isLogin) {
        setIsLogin(true);
        setPassword('');
        setConfirmPassword('');
        setSuccess('Đăng ký thành công. Vui lòng đăng nhập.');
        return;
      }

      const auth = parseAuthResponse(data);
      if (!auth) {
        throw new Error('Phản hồi đăng nhập thiếu thông tin tài khoản hoặc JWT.');
      }

      try {
        window.localStorage.setItem('accessToken', auth.token);
        window.localStorage.setItem('currentUser', JSON.stringify(auth.user));
      } catch {
        window.localStorage.removeItem('accessToken');
        window.localStorage.removeItem('currentUser');
        throw new Error('Không thể lưu phiên đăng nhập trên trình duyệt.');
      }

      onSuccess(auth.token, auth.user);
      onClose();
    } catch (submitError: unknown) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Không thể hoàn tất yêu cầu xác thực. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <section
        aria-labelledby="auth-modal-title"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Đóng"
          onClick={onClose}
          disabled={loading}
          className="absolute right-4 top-4 text-lg font-bold text-stone-400 hover:text-stone-700 disabled:opacity-50"
        >
          ×
        </button>

        <div className="mb-5 text-center">
          <span aria-hidden="true" className="text-3xl">
            ☕
          </span>
          <h2
            id="auth-modal-title"
            className="mt-1 text-xl font-bold text-stone-900"
          >
            {isLogin ? 'Đăng nhập BrewLite' : 'Đăng ký tài khoản'}
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            {isLogin
              ? 'Đăng nhập để đặt và theo dõi đơn hàng'
              : 'Tạo tài khoản BrewLite'}
          </p>
        </div>

        <div className="mb-4 flex rounded-xl bg-stone-100 p-1">
          <button
            type="button"
            onClick={() => switchMode(true)}
            disabled={loading}
            aria-pressed={isLogin}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              isLogin
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            onClick={() => switchMode(false)}
            disabled={loading}
            aria-pressed={!isLogin}
            className={`flex-1 rounded-lg py-1.5 text-xs font-semibold transition ${
              !isLogin
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Đăng ký
          </button>
        </div>

        {error && (
          <div
            className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs font-medium text-red-700"
            role="alert"
          >
            {error}
          </div>
        )}
        {success && (
          <div
            className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-800"
            role="status"
          >
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="auth-email"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@gmail.com"
              disabled={loading}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-amber-600 focus:outline-none disabled:bg-stone-100"
            />
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                required
                minLength={isLogin ? undefined : 8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-10 text-sm focus:border-amber-600 focus:outline-none disabled:bg-stone-100"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-pressed={showPassword}
                onClick={() => setShowPassword((visible) => !visible)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 disabled:opacity-50"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {!isLogin && (
              <p className="mt-1 text-[11px] text-stone-500">
                Tối thiểu 8 ký tự.
              </p>
            )}
          </div>

          {!isLogin && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="mb-1 block text-xs font-semibold text-stone-700"
              >
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  id="auth-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-10 text-sm focus:border-amber-600 focus:outline-none disabled:bg-stone-100"
                />
                <button
                  type="button"
                  aria-label={
                    showConfirmPassword
                      ? 'Ẩn mật khẩu xác nhận'
                      : 'Hiện mật khẩu xác nhận'
                  }
                  aria-pressed={showConfirmPassword}
                  onClick={() =>
                    setShowConfirmPassword((visible) => !visible)
                  }
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 disabled:opacity-50"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-amber-600 py-2.5 text-sm font-bold text-white shadow transition hover:bg-amber-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? 'Đang xử lý...'
              : isLogin
                ? 'Đăng nhập'
                : 'Tạo tài khoản'}
          </button>
        </form>
      </section>
    </div>
  );
}
