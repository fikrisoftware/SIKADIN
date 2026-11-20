'use client';

import React from 'react';
import { AuthProvider, useAppData } from '@/components/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { DashboardShell } from '@/components/DashboardShell';
import { KadinDigiWordmark, SiKadiIcon } from '@/components/SiKadiBrand';

function KadinDigiApp() {
  const { user, authReady } = useAppData();

  if (!authReady) {
    return (
      <div className="min-h-screen kadin-hero-bg flex flex-col items-center justify-center gap-4 p-6">
        <SiKadiIcon size="lg" variant="dark" />
        <div className="text-center">
          <KadinDigiWordmark dark className="text-xl block" />
          <p className="text-xs text-blue-200/80 mt-1">Memuat ruang kerja Si KADI...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomeScreen />;
  }

  return <DashboardShell />;
}

export default function HomePage() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <KadinDigiApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
