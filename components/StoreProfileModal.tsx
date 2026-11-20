'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { saveStoreProfile } from '@/lib/firestore-service';
import {
  LIMITS,
  STORE_CATEGORIES,
  type StoreCategory,
  type StoreProfile,
} from '@/lib/types';

interface StoreProfileModalProps {
  ownerId: string;
  profile: StoreProfile | null;
  defaultName: string;
  onClose: () => void;
}

export function StoreProfileModal({
  ownerId,
  profile,
  defaultName,
  onClose,
}: StoreProfileModalProps) {
  const [storeName, setStoreName] = useState(profile?.storeName || defaultName || 'Toko UMKM Saya');
  const [category, setCategory] = useState<StoreCategory>(profile?.category || 'Kuliner & F&B');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [tagline, setTagline] = useState(
    profile?.tagline || 'UMKM Naik Kelas, Bisnis Makin Cuan'
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError('Nama usaha wajib diisi.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveStoreProfile(
        ownerId,
        { storeName, category, phone, address, tagline },
        profile
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan profil usaha.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="store-profile-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="store-profile-title" className="text-lg font-bold text-slate-900">
              Profil Usaha UMKM
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Informasi ini tampil pada struk digital dan katalog promo Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Nama Usaha / Toko
            </label>
            <input
              type="text"
              value={storeName}
              maxLength={LIMITS.STORE_NAME_MAX}
              onChange={(e) => setStoreName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
              placeholder="Contoh: Kopi Nusantara Bandung"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Bidang Usaha
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StoreCategory)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
              >
                {STORE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Nomor WhatsApp Usaha
              </label>
              <input
                type="text"
                value={phone}
                maxLength={LIMITS.PHONE_MAX}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900 font-mono"
                placeholder="0812xxxxxxxx"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Alamat Gerai / Outlet
            </label>
            <textarea
              rows={2}
              value={address}
              maxLength={LIMITS.ADDRESS_MAX}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
              placeholder="Jl. Merdeka No. 48, Bandung"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Tagline pada Struk Digital
            </label>
            <input
              type="text"
              value={tagline}
              maxLength={LIMITS.TAGLINE_MAX}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-900/20 focus:border-navy-900"
              placeholder="UMKM Naik Kelas, Bisnis Makin Cuan"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-kadin-orange rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 transition-colors cursor-pointer"
            >
              {saving ? 'Menyimpan...' : 'Simpan Profil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
