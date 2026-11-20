'use client';

import React, { useState } from 'react';
import {
  Download,
  FileCode2,
  FileText,
  Film,
  Presentation,
  Printer,
  X,
} from 'lucide-react';

interface DocModalState {
  title: string;
  subtitle: string;
  downloadHref: string;
  downloadName: string;
  content: string;
}

const DELIVERABLES = [
  {
    id: 'prd',
    label: 'PRD · Dokumen Produk',
    title: 'Product Requirements Document (PRD)',
    desc: 'Latar belakang strategis UMKM, identitas Si KADI, persona, 20 kebutuhan fungsional (FR-01 s/d FR-20), KPI pilot vs nasional, roadmap 3 fase, dan mitigasi risiko.',
    href: '/downloads/PRD_KADIN_DIGI.md',
    fileName: 'PRD_KADIN_DIGI.md',
    icon: FileText,
    previewable: true,
    accent: 'navy',
  },
  {
    id: 'tsd',
    label: 'TSD · Spesifikasi Teknis',
    title: 'Technical Specification Document (TSD)',
    desc: 'Arsitektur Next.js 15 + Cloud Firestore Enterprise, skema 6 koleksi database, transaksi atomik writeBatch, 8 Pilar Keamanan Zero-Trust (UU PDP), dan panduan Cloud Run.',
    href: '/downloads/TSD_KADIN_DIGI.md',
    fileName: 'TSD_KADIN_DIGI.md',
    icon: FileCode2,
    previewable: true,
    accent: 'navy',
  },
  {
    id: 'ppt',
    label: 'PPTX · 10 Slide 16:9',
    title: 'Deck Presentasi KADIN Indonesia',
    desc: 'File PowerPoint siap presentasi untuk jajaran pengurus KADIN Indonesia — mencakup poster resmi Si KADI, 4 pilar solusi, arsitektur, tabel KPI, dan peta jalan implementasi.',
    href: '/downloads/Presentasi_KADIN_DIGI_KADIN_Indonesia.pptx',
    fileName: 'Presentasi_KADIN_DIGI_KADIN_Indonesia.pptx',
    icon: Presentation,
    previewable: false,
    accent: 'orange',
  },
  {
    id: 'video',
    label: 'MP4 · Full HD 1080p',
    title: 'Video Promosi KADIN DIGI',
    desc: 'Video promosi berdurasi ~38 detik (1920×1080, 30fps, audio latar korporat) menampilkan profil KADIN DIGI, Si KADI, dan keempat pilar operasional UMKM.',
    href: '/downloads/Video_Promosi_KADIN_DIGI.mp4',
    fileName: 'Video_Promosi_KADIN_DIGI.mp4',
    icon: Film,
    previewable: false,
    accent: 'orange',
  },
] as const;

export function PresentationKitModule({ compact = false }: { compact?: boolean }) {
  const [docModal, setDocModal] = useState<DocModalState | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);

  const openDocumentPreview = async (item: (typeof DELIVERABLES)[number]) => {
    setLoadingDocId(item.id);
    try {
      const res = await fetch(item.href);
      const text = await res.text();
      setDocModal({
        title: item.title,
        subtitle: item.label,
        downloadHref: item.href,
        downloadName: item.fileName,
        content: text,
      });
    } catch {
      setDocModal({
        title: item.title,
        subtitle: item.label,
        downloadHref: item.href,
        downloadName: item.fileName,
        content: 'Gagal memuat pratinjau dokumen. Silakan unduh file secara langsung.',
      });
    } finally {
      setLoadingDocId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Featured Video Player & Executive Pitch Summary */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 bg-navy-950 p-4 sm:p-6 flex items-center justify-center">
            <div className="w-full aspect-video rounded-lg overflow-hidden border border-white/15 bg-black">
              <video
                controls
                preload="metadata"
                poster="/assets/aistudio/image_0a4c7de4.png"
                className="w-full h-full object-contain bg-navy-950"
              >
                <source src="/downloads/Video_Promosi_KADIN_DIGI.mp4" type="video/mp4" />
                Browser Anda tidak mendukung pemutar video HTML5.
              </video>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div>
              <p className="text-xs font-semibold text-kadin-orange mb-2">
                Materi Resmi · Presentasi KADIN Indonesia
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight mb-3">
                Video Promosi &amp; Paket Presentasi Eksekutif
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">
                Putar langsung video promosi Full HD KADIN DIGI di samping atau unduh seluruh paket
                presentasi (Deck PowerPoint, PRD lengkap, TSD lengkap, dan Video MP4) untuk rapat
                pemaparan bersama Kamar Dagang dan Industri Indonesia.
              </p>

              <div className="text-xs text-slate-500 space-y-1.5 border-t border-slate-100 pt-4">
                <p>Resolusi Video: Full HD 1920×1080 · 30fps · Stereo AAC</p>
                <p>Format Presentasi: Microsoft PowerPoint (.pptx) · 10 Slide 16:9</p>
                <p>Dokumen Teknis &amp; Produk: PRD + TSD Lengkap (.md / Cetak PDF)</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/downloads/Presentasi_KADIN_DIGI_KADIN_Indonesia.pptx"
                download="Presentasi_KADIN_DIGI_KADIN_Indonesia.pptx"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Unduh File PPT (.pptx)
              </a>
              <a
                href="/downloads/Video_Promosi_KADIN_DIGI.mp4"
                download="Video_Promosi_KADIN_DIGI.mp4"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 text-white text-xs font-semibold rounded-lg hover:bg-navy-800 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                Unduh Video (.mp4)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Deliverables Grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 ${compact ? 'lg:grid-cols-4' : 'lg:grid-cols-2'} gap-4`}>
        {DELIVERABLES.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                  <span className="text-xs font-mono font-semibold text-kadin-orange">
                    {item.label}
                  </span>
                  <Icon className="w-4 h-4 text-navy-900 shrink-0" />
                </div>
                <h4 className="text-base font-bold text-navy-900 mb-1.5">{item.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {item.previewable && (
                  <button
                    type="button"
                    disabled={loadingDocId === item.id}
                    onClick={() => openDocumentPreview(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-navy-900 bg-navy-50 hover:bg-navy-900 hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    {loadingDocId === item.id ? 'Memuat...' : 'Baca Lengkap'}
                  </button>
                )}
                <a
                  href={item.href}
                  download={item.fileName}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    item.accent === 'orange'
                      ? 'bg-kadin-orange text-white hover:bg-kadin-orange-hover'
                      : 'text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh File
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Inline Document Reader Modal for PRD / TSD */}
      {docModal && (
        <div
          className="fixed inset-0 z-50 bg-navy-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="doc-reader-title"
        >
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono font-semibold text-kadin-orange">
                  {docModal.subtitle}
                </p>
                <h3 id="doc-reader-title" className="text-lg font-bold text-navy-900">
                  {docModal.title}
                </h3>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak / PDF
                </button>
                <a
                  href={docModal.downloadHref}
                  download={docModal.downloadName}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-kadin-orange rounded-lg hover:bg-kadin-orange-hover"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh .MD
                </a>
                <button
                  type="button"
                  onClick={() => setDocModal(null)}
                  className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
                  aria-label="Tutup dokumen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50">
              <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800 bg-white border border-slate-200 rounded-xl p-6 sm:p-8 leading-relaxed">
                {docModal.content}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
