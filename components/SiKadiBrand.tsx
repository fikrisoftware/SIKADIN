'use client';

import React, { useState } from 'react';
import { Bot } from 'lucide-react';

interface SiKadiIconProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'dark' | 'light';
  className?: string;
}

export function SiKadiIcon({
  size = 'md',
  variant = 'dark',
  className = '',
}: SiKadiIconProps) {
  const [imgError, setImgError] = useState(false);

  const dims =
    size === 'sm'
      ? 'w-9 h-9 rounded-lg'
      : size === 'lg'
        ? 'w-16 h-16 rounded-2xl'
        : 'w-11 h-11 rounded-xl';

  const borderClass =
    variant === 'dark'
      ? 'border-white/20 bg-navy-900'
      : 'border-slate-200 bg-navy-950';

  if (imgError) {
    return (
      <div
        className={`${dims} bg-navy-900 text-kadin-orange-light flex items-center justify-center shrink-0 border ${borderClass} ${className}`}
        aria-label="Ikon Si KADI"
      >
        <Bot className={size === 'lg' ? 'w-8 h-8' : 'w-5 h-5'} />
      </div>
    );
  }

  return (
    <div
      className={`${dims} overflow-hidden border shrink-0 flex items-center justify-center ${borderClass} ${className}`}
    >
      <img
        src="/images/si-kadi-logo.jpg"
        alt="Si KADI — Sistem Kasir dan Inventori KADIN DIGI"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}

export function KadinDigiWordmark({
  dark = false,
  className = 'text-lg',
}: {
  dark?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight whitespace-nowrap shrink-0 ${className}`}
    >
      <span className={dark ? 'text-white' : 'text-navy-900'}>KADIN </span>
      <span className={dark ? 'text-kadin-orange-light' : 'text-kadin-orange'}>DIGI</span>
    </span>
  );
}
