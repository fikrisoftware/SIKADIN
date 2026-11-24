'use client';

import React, { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  History,
  Lock,
  MailPlus,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { useAppData } from './AuthContext';
import {
  createOrUpdateRoleInvite,
  revokeRoleInvite,
  updateUserRoleAssignment,
} from '@/lib/firestore-service';
import {
  BOOTSTRAP_SUPER_ADMIN_EMAIL,
  emailToInviteId,
  formatTimestampID,
  LIMITS,
  ROLE_META,
  USER_ROLES,
  type RoleInvite,
  type UserRole,
  type UserRoleProfile,
} from '@/lib/types';

const PERMISSION_MATRIX: Array<{
  feature: string;
  kasir: string;
  pemilik: string;
  admin_pusat: string;
  super_admin_pusat: string;
}> = [
  {
    feature: 'Kasir (POS) & Cetak Struk',
    kasir: 'Penuh (1 Toko)',
    pemilik: 'Penuh (1 Toko)',
    admin_pusat: 'Lintas Toko',
    super_admin_pusat: 'Lintas Toko',
  },
  {
    feature: 'Batalkan / Void Transaksi',
    kasir: 'Diblokir',
    pemilik: 'Diizinkan',
    admin_pusat: 'Diizinkan',
    super_admin_pusat: 'Diizinkan',
  },
  {
    feature: 'Inventori, HPP & Mutasi Stok',
    kasir: 'Diblokir',
    pemilik: 'Penuh (1 Toko)',
    admin_pusat: 'Lintas Toko',
    super_admin_pusat: 'Lintas Toko',
  },
  {
    feature: 'Database Pelanggan (CRM)',
    kasir: 'Lihat & Tambah',
    pemilik: 'CRUD Penuh',
    admin_pusat: 'CRUD Lintas Toko',
    super_admin_pusat: 'CRUD Lintas Toko',
  },
  {
    feature: 'Pemasaran Digital & Voucher',
    kasir: 'Klaim di Kasir',
    pemilik: 'Penuh (1 Toko)',
    admin_pusat: 'Lintas Toko',
    super_admin_pusat: 'Lintas Toko',
  },
  {
    feature: 'Analisis Penjualan & Laba Kotor',
    kasir: 'Diblokir',
    pemilik: 'Toko Sendiri',
    admin_pusat: 'Lintas Toko',
    super_admin_pusat: 'Lintas Toko',
  },
  {
    feature: 'Dashboard Kantor Pusat KADIN',
    kasir: 'Diblokir',
    pemilik: 'Diblokir',
    admin_pusat: 'Akses Penuh',
    super_admin_pusat: 'Akses Penuh',
  },
  {
    feature: 'Undang & Kelola Staf Kasir',
    kasir: 'Diblokir',
    pemilik: 'Toko Sendiri',
    admin_pusat: 'Semua Toko',
    super_admin_pusat: 'Semua Toko',
  },
  {
    feature: 'Tetapkan / Ubah Pemilik Usaha',
    kasir: 'Diblokir',
    pemilik: 'Diblokir',
    admin_pusat: 'Diizinkan',
    super_admin_pusat: 'Diizinkan',
  },
  {
    feature: 'Angkat / Cabut Admin & Super Admin Pusat',
    kasir: 'Diblokir',
    pemilik: 'Diblokir',
    admin_pusat: 'Diblokir',
    super_admin_pusat: 'Eksklusif Super Admin',
  },
];

export function RoleAccessModule() {
  const {
    user,
    actualRole,
    effectiveRole,
    permissions,
    activeWorkspaceId,
    storeProfile,
    allStores,
    roleProfiles,
    roleInvites,
    roleAuditLogs,
  } = useAppData();

  const [subTab, setSubTab] = useState<'akun' | 'undangan' | 'matriks' | 'audit'>('akun');
  const [roleFilter, setRoleFilter] = useState<'Semua' | UserRole>('Semua');

  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedInviteRole, setSelectedInviteRole] = useState<UserRole | null>(null);
  const [selectedTargetStore, setSelectedTargetStore] = useState<string>('');
  const [inviteNote, setInviteNote] = useState('');
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [busyUid, setBusyUid] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const isEffectiveHq = effectiveRole === 'admin_pusat' || effectiveRole === 'super_admin_pusat';

  const inviteRole: UserRole =
    selectedInviteRole && permissions.assignableRoles.includes(selectedInviteRole)
      ? selectedInviteRole
      : permissions.assignableRoles[0] || 'kasir';

  const targetWorkspaceId = isEffectiveHq
    ? selectedTargetStore || activeWorkspaceId || user?.uid || ''
    : activeWorkspaceId || user?.uid || '';

  const targetStoreName = useMemo(() => {
    if (inviteRole === 'admin_pusat' || inviteRole === 'super_admin_pusat') {
      return 'Kantor Pusat KADIN Indonesia';
    }
    const foundStore = allStores.find((s) => s.ownerId === targetWorkspaceId);
    if (foundStore) return foundStore.storeName;
    if (targetWorkspaceId === activeWorkspaceId && storeProfile?.storeName) {
      return storeProfile.storeName;
    }
    return 'Usaha UMKM SI DIKA';
  }, [activeWorkspaceId, allStores, inviteRole, storeProfile?.storeName, targetWorkspaceId]);

  const scopedProfiles = useMemo(() => {
    const base = isEffectiveHq
      ? roleProfiles
      : roleProfiles.filter((rp) => rp.workspaceOwnerId === activeWorkspaceId);
    if (roleFilter === 'Semua') return base;
    return base.filter((rp) => rp.role === roleFilter);
  }, [activeWorkspaceId, isEffectiveHq, roleFilter, roleProfiles]);

  const scopedInvites = useMemo(() => {
    return isEffectiveHq
      ? roleInvites
      : roleInvites.filter((inv) => inv.workspaceOwnerId === activeWorkspaceId);
  }, [activeWorkspaceId, isEffectiveHq, roleInvites]);

  const scopedAudits = useMemo(() => {
    return isEffectiveHq
      ? roleAuditLogs
      : roleAuditLogs.filter((log) => log.workspaceOwnerId === activeWorkspaceId);
  }, [activeWorkspaceId, isEffectiveHq, roleAuditLogs]);

  const pendingInvitesCount = scopedInvites.filter((i) => i.status === 'Menunggu').length;

  const canModifyProfile = (target: UserRoleProfile): boolean => {
    if (!user) return false;
    if (target.uid === user.uid) return false;
    if (target.email.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL) return false;
    if (effectiveRole === 'super_admin_pusat') return true;
    if (effectiveRole === 'admin_pusat') {
      return target.role === 'kasir' || target.role === 'pemilik';
    }
    if (effectiveRole === 'pemilik') {
      return target.role === 'kasir' && target.workspaceOwnerId === activeWorkspaceId;
    }
    return false;
  };

  const canChangeRoleOf = (target: UserRoleProfile): boolean => {
    if (!canModifyProfile(target)) return false;
    return effectiveRole === 'admin_pusat' || effectiveRole === 'super_admin_pusat';
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFeedback(null);

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setFeedback({ type: 'error', text: 'Masukkan alamat email Google yang valid.' });
      return;
    }
    if (!permissions.assignableRoles.includes(inviteRole)) {
      setFeedback({ type: 'error', text: 'Peran Anda tidak memiliki izin menetapkan peran ini.' });
      return;
    }

    const inviteId = emailToInviteId(normalizedEmail);
    const existingInvite = roleInvites.find((i) => i.id === inviteId) || null;

    setInviting(true);
    try {
      await createOrUpdateRoleInvite(
        {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Admin',
          role: actualRole,
        },
        {
          email: normalizedEmail,
          role: inviteRole,
          workspaceOwnerId: targetWorkspaceId,
          storeName: targetStoreName,
          note: inviteNote.trim(),
        },
        existingInvite
      );
      setInviteEmail('');
      setInviteNote('');
      setFeedback({
        type: 'success',
        text: `Undangan ${ROLE_META[inviteRole].label} untuk ${normalizedEmail} berhasil disimpan. Peran akan aktif otomatis saat akun Google tersebut masuk ke SI DIKA.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mengirim undangan peran.',
      });
    } finally {
      setInviting(false);
    }
  };

  const handleToggleStatus = async (target: UserRoleProfile) => {
    if (!user || !canModifyProfile(target)) return;
    const nextStatus = target.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
    setBusyUid(target.uid);
    setFeedback(null);
    try {
      await updateUserRoleAssignment(
        {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Admin',
          role: actualRole,
        },
        target,
        {
          status: nextStatus,
          note:
            nextStatus === 'Nonaktif'
              ? `Akses ${ROLE_META[target.role].label} dinonaktifkan`
              : `Akses ${ROLE_META[target.role].label} diaktifkan kembali`,
        }
      );
      setFeedback({
        type: 'success',
        text: `Status akun ${target.email} diperbarui menjadi ${nextStatus}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mengubah status akun.',
      });
    } finally {
      setBusyUid(null);
    }
  };

  const handleRoleChange = async (target: UserRoleProfile, nextRole: UserRole) => {
    if (!user || !canChangeRoleOf(target) || target.role === nextRole) return;
    if (!permissions.assignableRoles.includes(nextRole)) return;

    setBusyUid(target.uid);
    setFeedback(null);
    try {
      const nextStore =
        nextRole === 'admin_pusat' || nextRole === 'super_admin_pusat'
          ? 'Kantor Pusat KADIN Indonesia'
          : target.storeName;

      await updateUserRoleAssignment(
        {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Admin',
          role: actualRole,
        },
        target,
        {
          role: nextRole,
          storeName: nextStore,
          note: `Perubahan peran dari ${ROLE_META[target.role].label} ke ${ROLE_META[nextRole].label}`,
        }
      );
      setFeedback({
        type: 'success',
        text: `Peran ${target.email} berhasil diubah menjadi ${ROLE_META[nextRole].label}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal memperbarui peran pengguna.',
      });
    } finally {
      setBusyUid(null);
    }
  };

  const handleRevokeInvite = async (invite: RoleInvite) => {
    if (!user) return;
    setBusyInviteId(invite.id);
    setFeedback(null);
    try {
      await revokeRoleInvite(
        {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Admin',
          role: actualRole,
        },
        invite
      );
      setFeedback({
        type: 'success',
        text: `Undangan untuk ${invite.email} telah dicabut.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gagal mencabut undangan.',
      });
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top 4-Tier Role Authority Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {USER_ROLES.map((rk) => {
          const meta = ROLE_META[rk];
          const isCurrent = effectiveRole === rk;
          const canAssign = permissions.assignableRoles.includes(rk);
          return (
            <div
              key={rk}
              className={`bg-white border rounded-xl p-4 flex flex-col justify-between gap-2.5 ${
                isCurrent ? 'border-kadin-orange ring-1 ring-kadin-orange/40' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold border rounded ${meta.badgeBg} ${meta.badgeText}`}
                  >
                    {meta.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] font-bold uppercase tracking-wide text-kadin-orange">
                      Peran Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-navy-900 mt-2">{meta.scope}</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{meta.description}</p>
              </div>
              <div className="pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between">
                <span className="text-slate-500">Kewenangan Anda:</span>
                {canAssign ? (
                  <span className="font-semibold text-emerald-700">Dapat Mengangkat</span>
                ) : (
                  <span className="font-medium text-slate-400">Hanya Lihat</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Invite / Pre-Assign Role Form */}
      {permissions.assignableRoles.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <MailPlus className="w-4 h-4 text-kadin-orange" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Undang &amp; Tetapkan Peran Pengguna via Email Google
                </h3>
                <p className="text-xs text-slate-500">
                  Saat pengguna masuk dengan akun Google terdaftar, sistem otomatis menerapkan peran &amp;
                  batasan aksesnya.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleInviteSubmit} className="p-5 space-y-4">
            {feedback && (
              <div
                role="alert"
                className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                <span>{feedback.text}</span>
                <button
                  type="button"
                  onClick={() => setFeedback(null)}
                  className="p-0.5 hover:opacity-75 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              <div className="md:col-span-4">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alamat Email Google
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  maxLength={LIMITS.EMAIL_MAX}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  placeholder="nama.staf@gmail.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Peran yang Diberikan
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setSelectedInviteRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                >
                  {permissions.assignableRoles.map((rk) => (
                    <option key={rk} value={rk}>
                      {ROLE_META[rk].label}
                    </option>
                  ))}
                </select>
              </div>

              {isEffectiveHq && (inviteRole === 'kasir' || inviteRole === 'pemilik') ? (
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Penempatan Toko UMKM
                  </label>
                  <select
                    value={targetWorkspaceId}
                    onChange={(e) => setSelectedTargetStore(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-navy-900"
                  >
                    {allStores.length === 0 && (
                      <option value={activeWorkspaceId}>Ruang Kerja Aktif</option>
                    )}
                    {allStores.map((st) => (
                      <option key={st.ownerId} value={st.ownerId}>
                        {st.storeName}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Catatan Penugasan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={inviteNote}
                    maxLength={LIMITS.NOTE_MAX}
                    onChange={(e) => setInviteNote(e.target.value)}
                    placeholder="Contoh: Shift Pagi / Admin Wilayah"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-navy-900"
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <button
                  type="submit"
                  disabled={inviting}
                  className="w-full py-2.5 px-4 bg-kadin-orange text-white text-xs font-semibold rounded-lg hover:bg-kadin-orange-hover disabled:opacity-60 transition-colors whitespace-nowrap cursor-pointer"
                >
                  {inviting ? 'Menyimpan...' : 'Simpan Undangan'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
          <button
            type="button"
            onClick={() => setSubTab('akun')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'akun'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Akun Terdaftar ({scopedProfiles.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('undangan')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'undangan'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Undangan ({pendingInvitesCount} Menunggu)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('matriks')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'matriks'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Matriks Hak Akses
          </button>
          <button
            type="button"
            onClick={() => setSubTab('audit')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'audit'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit Log ({scopedAudits.length})
          </button>
        </div>

        {subTab === 'akun' && isEffectiveHq && (
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'Semua' | UserRole)}
            className="px-3 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white text-slate-700"
          >
            <option value="Semua">Semua Peran</option>
            {USER_ROLES.map((rk) => (
              <option key={rk} value={rk}>
                {ROLE_META[rk].label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Tab 1: Registered Accounts */}
      {subTab === 'akun' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Daftar Pengguna &amp; Pengaturan Peran Aktif
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {effectiveRole === 'pemilik'
                ? 'Pemilik Usaha dapat mengaktifkan atau menonaktifkan staf Kasir pada tokonya.'
                : effectiveRole === 'admin_pusat'
                  ? 'Admin Kantor Pusat dapat mengelola peran Kasir dan Pemilik Usaha di seluruh ekosistem.'
                  : 'Super Admin Kantor Pusat memiliki otoritas penuh atas seluruh 4 tingkat peran termasuk Admin Kantor Pusat.'}
            </p>
          </div>

          {scopedProfiles.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada akun pengguna terdaftar pada cakupan ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Pengguna</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Unit / Toko</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Ditetapkan Oleh</th>
                    <th className="py-3 px-4 text-right">Kontrol Akses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedProfiles.map((rp) => {
                    const meta = ROLE_META[rp.role];
                    const editable = canModifyProfile(rp);
                    const roleEditable = canChangeRoleOf(rp);
                    const isSelf = rp.uid === user?.uid;
                    const isRoot = rp.email.toLowerCase() === BOOTSTRAP_SUPER_ADMIN_EMAIL;

                    return (
                      <tr key={rp.uid} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-slate-900">{rp.displayName}</p>
                            {isSelf && (
                              <span className="text-[10px] font-semibold text-navy-900 bg-slate-100 px-1.5 py-0.5 rounded">
                                Anda
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-slate-500">{rp.email}</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {roleEditable ? (
                            <select
                              disabled={busyUid === rp.uid}
                              value={rp.role}
                              onChange={(e) => handleRoleChange(rp, e.target.value as UserRole)}
                              className="px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:border-navy-900 cursor-pointer"
                            >
                              {permissions.assignableRoles.map((rk) => (
                                <option key={rk} value={rk}>
                                  {ROLE_META[rk].label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-md ${meta.badgeBg} ${meta.badgeText}`}
                            >
                              {meta.label}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">
                          {rp.storeName || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <span
                            className={
                              rp.status === 'Aktif'
                                ? 'font-semibold text-emerald-700'
                                : 'font-semibold text-red-600'
                            }
                          >
                            {rp.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-500">
                          {rp.assignedBy || 'Sistem'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {editable ? (
                            <button
                              type="button"
                              disabled={busyUid === rp.uid}
                              onClick={() => handleToggleStatus(rp)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer disabled:opacity-50 ${
                                rp.status === 'Aktif'
                                  ? 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100'
                                  : 'text-emerald-800 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {rp.status === 'Aktif' ? (
                                <>
                                  <UserX className="w-3.5 h-3.5" />
                                  Nonaktifkan
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-3.5 h-3.5" />
                                  Aktifkan
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                              <Lock className="w-3 h-3" />
                              {isRoot ? 'Root Terkunci' : isSelf ? 'Akun Sendiri' : 'Dilindungi'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending / History Role Invites */}
      {subTab === 'undangan' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Daftar Undangan Peran</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Undangan berstatus Menunggu akan otomatis berubah menjadi Diterima ketika akun Google
              tersebut login pertama kali.
            </p>
          </div>

          {scopedInvites.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada undangan peran yang dibuat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4">Email Google</th>
                    <th className="py-3 px-4">Peran</th>
                    <th className="py-3 px-4">Unit / Toko</th>
                    <th className="py-3 px-4">Diundang Oleh</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedInvites.map((inv) => {
                    const meta = ROLE_META[inv.role];
                    const canRevoke =
                      inv.status === 'Menunggu' && permissions.assignableRoles.includes(inv.role);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <p className="font-mono text-xs font-semibold text-slate-900">
                            {inv.email}
                          </p>
                          {inv.note && <p className="text-[11px] text-slate-500">{inv.note}</p>}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold border rounded ${meta.badgeBg} ${meta.badgeText}`}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-700">{inv.storeName}</td>
                        <td className="py-3.5 px-4 text-xs text-slate-600">
                          <p>{inv.invitedByName}</p>
                          <p className="text-[11px] text-slate-400">
                            {formatTimestampID(inv.updatedAt || inv.createdAt)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                          <span
                            className={
                              inv.status === 'Menunggu'
                                ? 'font-semibold text-amber-700'
                                : inv.status === 'Diterima'
                                  ? 'font-semibold text-emerald-700'
                                  : 'font-semibold text-slate-400'
                            }
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          {canRevoke ? (
                            <button
                              type="button"
                              disabled={busyInviteId === inv.id}
                              onClick={() => handleRevokeInvite(inv)}
                              className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50 cursor-pointer"
                            >
                              {busyInviteId === inv.id ? 'Mencabut...' : 'Cabut Undangan'}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: 4-Role Permission Comparison Matrix */}
      {subTab === 'matriks' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-navy-900" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Matriks Pemisahan Hak Akses 4 Peran SI DIKA
              </h3>
              <p className="text-xs text-slate-500">
                Seluruh batasan diterapkan secara berlapis di antarmuka sekaligus ditegakkan ketat di
                server basis data.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left font-bold text-slate-700">
                  <th className="py-3 px-4">Modul / Kewenangan</th>
                  <th className="py-3 px-4">Kasir</th>
                  <th className="py-3 px-4">Pemilik Usaha</th>
                  <th className="py-3 px-4">Admin Kantor Pusat</th>
                  <th className="py-3 px-4">Super Admin Kantor Pusat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {PERMISSION_MATRIX.map((row) => {
                  const renderCell = (val: string) => {
                    const denied = val === 'Diblokir';
                    return (
                      <span
                        className={`inline-flex items-center gap-1 font-semibold ${
                          denied ? 'text-slate-400' : 'text-emerald-700'
                        }`}
                      >
                        {denied ? <Lock className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                        {val}
                      </span>
                    );
                  };
                  return (
                    <tr key={row.feature} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-semibold text-slate-900">{row.feature}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{renderCell(row.kasir)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{renderCell(row.pemilik)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">{renderCell(row.admin_pusat)}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {renderCell(row.super_admin_pusat)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Immutable Role Audit Logs */}
      {subTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">
              Audit Log Perubahan Akses (Permanen &amp; Tidak Dapat Diubah)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Setiap undangan, perubahan peran, dan penonaktifan akun tercatat permanen demi
              akuntabilitas tata kelola SI DIKA.
            </p>
          </div>

          {scopedAudits.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Belum ada aktivitas perubahan hak akses yang tercatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left font-semibold text-slate-600">
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Pelaku</th>
                    <th className="py-3 px-4">Tindakan</th>
                    <th className="py-3 px-4">Target Akun</th>
                    <th className="py-3 px-4">Peran Target</th>
                    <th className="py-3 px-4">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scopedAudits.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap tabular-nums">
                        {formatTimestampID(log.createdAt)}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900">{log.actorName}</p>
                        <p className="text-[11px] text-slate-500">
                          {ROLE_META[log.actorRole]?.shortLabel || log.actorRole}
                        </p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-navy-900 whitespace-nowrap">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{log.targetEmail}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 font-semibold border rounded ${
                            ROLE_META[log.targetRole]?.badgeBg || 'bg-slate-50 border-slate-200'
                          } ${ROLE_META[log.targetRole]?.badgeText || 'text-slate-700'}`}
                        >
                          {ROLE_META[log.targetRole]?.shortLabel || log.targetRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{log.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
