'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { firebaseConfigMeta } from '@/lib/firebase';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
  isQuotaError: boolean;
  isSpecificReadQuota: boolean;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      message: '',
      isQuotaError: false,
      isSpecificReadQuota: false,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const raw = error?.message || 'Terjadi kesalahan tidak terduga pada sistem.';
    let displayMessage = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: string; operationType?: string; path?: string };
      if (parsed.error) {
        displayMessage = `${parsed.error}${parsed.path ? ` (${parsed.operationType}: ${parsed.path})` : ''}`;
      }
    } catch {
      // Plain text error
    }
    const lower = displayMessage.toLowerCase();
    const isSpecificReadQuota = displayMessage.includes(
      "Quota exceeded for quota metric 'Free daily read units per project (free tier database)'"
    );
    const isQuotaError = isSpecificReadQuota || lower.includes('quota exceeded');

    return {
      hasError: true,
      message: displayMessage,
      isQuotaError,
      isSpecificReadQuota,
    };
  }

  componentDidCatch(error: Error) {
    console.error('SI DIKA ErrorBoundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      const upgradeUrl = `https://console.firebase.google.com/project/${firebaseConfigMeta.projectId}/firestore/databases/${firebaseConfigMeta.firestoreDatabaseId}/data?openUpgradeDialog=true`;

      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl p-8">
            <div className="flex items-center gap-3 text-red-700 mb-4">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h2 className="text-xl font-bold text-slate-900">
                {this.state.isQuotaError ? 'Batas Kuota Database Tercapai' : 'Kendala Koneksi Data'}
              </h2>
            </div>

            {this.state.isQuotaError ? (
              <div className="space-y-3 text-sm text-slate-600 leading-relaxed mb-6">
                <p>
                  Kuota harian Firestore untuk proyek ini telah tercapai. Kuota gratis akan diatur
                  ulang pada hari berikutnya.
                </p>
                {this.state.isSpecificReadQuota && (
                  <p>
                    Anda dapat meningkatkan paket database melalui{' '}
                    <a
                      href={upgradeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-navy-900 underline font-medium"
                    >
                      Firebase Console
                    </a>
                    .
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Sistem mengalami kendala saat memproses data di server. Anda dapat memuat ulang
                halaman untuk melanjutkan operasional kasir.
              </p>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 break-words mb-6">
              {this.state.message}
            </div>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-sm font-medium rounded-lg hover:bg-navy-800 transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-4 h-4" />
              Muat Ulang SI DIKA
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
