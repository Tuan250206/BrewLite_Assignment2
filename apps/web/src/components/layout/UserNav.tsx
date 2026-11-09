'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { User, ChevronDown, Package, LogOut } from 'lucide-react';

interface UserNavProps {
  currentUser: any;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export default function UserNav({ currentUser, onOpenAuthModal, onLogout }: UserNavProps) {
  const [isOpenDropdown, setIsOpenDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) {
    return (
      <button
        type="button"
        onClick={onOpenAuthModal}
        className="flex items-center gap-2 rounded-full bg-[#1b120d] px-4 py-2.5 text-sm font-medium text-white shadow-sm cursor-pointer transition-transform duration-200 hover:bg-[#2a1b12] hover:scale-105"
      >
        <User className="w-3.5 h-3.5" />
        <span>Đăng nhập</span>
      </button>
    );
  }

    const displayName = currentUser?.email ? currentUser.email.split('@')[0] : 'User';
    const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpenDropdown((prev) => !prev)}
        className="flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-1.5 shadow-sm transition hover:bg-stone-50"
      >
        <div className="w-7 h-7 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-xs shadow-inner">
          {firstLetter}
        </div>
        <span className="text-xs font-semibold text-stone-800 max-w-25 truncate">
          {displayName}
        </span>
        <ChevronDown className={`w-3 h-3 text-stone-400 transition-transform duration-200 ${isOpenDropdown ? 'rotate-180' : ''}`} />
      </button>

      {isOpenDropdown && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-1.5 shadow-xl border border-stone-200 z-50">
          <div className="px-3 py-1.5 border-b border-stone-100">
            <p className="text-[10px] text-stone-400 uppercase font-bold">Tài khoản</p>
            <p className="text-xs font-medium text-stone-800 truncate">{currentUser.email}</p>
          </div>

          <Link
            href="/orders"
            onClick={() => setIsOpenDropdown(false)}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs font-medium text-stone-700 hover:bg-amber-50 hover:text-amber-800 rounded-lg transition"
          >
            <Package className="w-4 h-4 text-stone-500" />
            <span>Đơn hàng của tôi</span>
          </Link>

          <button
            onClick={() => {
              setIsOpenDropdown(false);
              onLogout();
            }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition text-left"
          >
            <LogOut className="w-4 h-4 text-red-500" />
            <span>Đăng xuất</span>
          </button>
        </div>
      )}
    </div>
  );
}