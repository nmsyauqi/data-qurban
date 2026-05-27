import React, { useState, useEffect } from 'react';
import { services } from '../firebase';
import { UserProfile, Qurban, AnimalType } from '../types';
import { 
  LogOut, Plus, Search, Filter, Check, ShieldAlert, Trash2, Edit3, 
  MapPin, User, Calendar, Copy, CheckCircle, Clock, Percent, Clipboard, Info
} from 'lucide-react';
import AnimalFormModal from './AnimalFormModal';
import ConfirmationModal from './ConfirmationModal';

interface DashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [qurbans, setQurbans] = useState<Qurban[]>([]);
  const [organizationPasscode, setOrganizationPasscode] = useState('123456');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Filter/Search states
  const [searchText, setSearchText] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Qurban | null>(null);
  
  // Security Modal Check
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [targetConfirmId, setTargetConfirmId] = useState<string | null>(null);
  const [targetConfirmNumber, setTargetConfirmNumber] = useState<string>('');

  const fetchQurbanList = async () => {
    try {
      setLoading(true);
      const data = await services.getQurbans(user.placeId);
      setQurbans(data);

      const placeMeta = await services.getPlace(user.placeId);
      if (placeMeta) {
        setOrganizationPasscode(placeMeta.passcode);
      }
    } catch (err) {
      console.error("Gagal memuat rekap qurban:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQurbanList();
  }, [user.placeId]);

  // Copy Organization ID
  const handleCopyOrgId = () => {
    navigator.clipboard.writeText(user.placeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Create or Edit Save
  const handleSaveAnimal = async (
    animalType: AnimalType, 
    owners: string[], 
    weight: number | undefined, 
    notes: string | undefined
  ) => {
    if (editingAnimal) {
      // Edit
      await services.updateQurbanData(editingAnimal.id, {
        animalType,
        owners,
        weight: weight || null as any,
        notes: notes || ''
      });
    } else {
      // Create New
      await services.createQurban(animalType, owners, weight, notes, user);
    }
    fetchQurbanList();
  };

  // Toggle Slaughter status
  const handleToggleSlaughter = async (item: Qurban) => {
    if (!item.slaughtered) {
      // Convert false to true
      await services.updateQurbanData(item.id, {
        slaughtered: true,
        slaughteredAt: new Date().toISOString()
      });
      fetchQurbanList();
    } else {
      // Secure attempt: convert true to false (needs passcode verify modal)
      setTargetConfirmId(item.id);
      setTargetConfirmNumber(item.animalNumber);
      setIsConfirmOpen(true);
    }
  };

  // Undo verified
  const handleConfirmUndoSlaughter = async () => {
    if (targetConfirmId) {
      await services.updateQurbanData(targetConfirmId, {
        slaughtered: false,
        slaughteredAt: null
      });
      fetchQurbanList();
    }
  };

  // Delete sacrificial animal
  const handleDeleteAnimal = async (id: string) => {
    const doubleCheck = window.confirm("Apakah Anda yakin ingin menghapus hewan ini dari pencatatan?");
    if (doubleCheck) {
      await services.deleteQurban(id);
      fetchQurbanList();
    }
  };

  // Statistics
  const totalCount = qurbans.length;
  const slaughteredCount = qurbans.filter(q => q.slaughtered).length;
  const pendingCount = totalCount - slaughteredCount;

  const countSapi = qurbans.filter(q => q.animalType === 'sapi').length;
  const countSapiSlaughtered = qurbans.filter(q => q.animalType === 'sapi' && q.slaughtered).length;

  const countKambing = qurbans.filter(q => q.animalType === 'kambing').length;
  const countKambingSlaughtered = qurbans.filter(q => q.animalType === 'kambing' && q.slaughtered).length;

  const countDomba = qurbans.filter(q => q.animalType === 'domba').length;
  const countDombaSlaughtered = qurbans.filter(q => q.animalType === 'domba' && q.slaughtered).length;

  // Filtered Animals
  const filteredQurbans = qurbans.filter(item => {
    const matchSearch = item.owners.some(owner => owner.toLowerCase().includes(searchText.toLowerCase())) ||
                        item.animalNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchType = filterType === 'all' || item.animalType === filterType;
    const matchStatus = filterStatus === 'all' || 
                        (filterStatus === 'slaughtered' && item.slaughtered) || 
                        (filterStatus === 'pending' && !item.slaughtered);

    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      {/* Upper Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🌱</span>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  Qurban Manager <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">PRO</span>
                </h1>
                <p className="text-[10px] text-slate-500 font-medium">Sistem Informasi Qurban Terpadu</p>
              </div>
            </div>

            {/* Profile & Controls */}
            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <span className="block text-xs font-bold text-slate-800 flex items-center gap-1 justify-end">
                  <User size={12} className="text-slate-500" />
                  {user.name}
                </span>
                {user.isGuest ? (
                  <span className="text-[10px] text-sky-600 font-bold uppercase tracking-wider">Mode Pemantau</span>
                ) : (
                  <span className="text-[10px] text-slate-500">Admin - {user.email}</span>
                )}
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-slate-200/60 rounded-xl transition-all outline-none"
              >
                <LogOut size={13} />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {user.isGuest && (
          <div className="bg-sky-50 border border-sky-100 text-sky-950 p-4 rounded-2xl flex items-start gap-3 shadow-sm">
            <span className="text-lg leading-none mt-0.5">ℹ️</span>
            <div className="text-xs space-y-1">
              <span className="font-bold text-sky-900 block">Mode Pemantauan Real-Time Aktif</span>
              <p className="text-slate-600 leading-relaxed">
                Anda masuk sebagai pemantau kegiatan qurban di <strong>{user.placeName}</strong>. Seluruh data disajikan secara real-time dan langsung diperbarui saat panitia mengubah status sembelih. Akses penulisan dan penyuntingan data dinonaktifkan.
              </p>
            </div>
          </div>
        )}

        {/* Organisation Space banner */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <span className="text-9xl font-mono grayscale select-none">Q</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-emerald-400" />
                <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">Tempat Penyelenggara</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black mt-1">{user.placeName}</h2>
              <p className="text-xs text-emerald-200 mt-1">
                Data Qurban tersinkronisasi di satu cabang penyelenggara ini.
              </p>
            </div>

            {/* Organizations details */}
            <div className="flex flex-wrap gap-2">
              <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-3">
                <div>
                  <span className="block text-[9px] font-semibold text-emerald-300 uppercase">ID LOKASI</span>
                  <span className="font-mono text-sm font-bold tracking-wider">{user.placeId}</span>
                </div>
                <button
                  onClick={handleCopyOrgId}
                  className="p-1 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-all outline-none"
                  title="Salin ID Ruangan"
                >
                  {copied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                </button>
              </div>

              {!user.isGuest && (
                <div className="bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10">
                  <span className="block text-[9px] font-semibold text-emerald-300 uppercase">SANDI KONFIRMASI LOKAL</span>
                  <span className="text-xs font-bold font-mono tracking-wider">•••••</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* STATS SECTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Hewan Terdaftar</span>
              <span className="text-3xl font-extrabold text-slate-900 mt-1 block">{totalCount}</span>
              <span className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Clipboard size={10} /> Tercatat di database
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center text-xl font-bold">
              📋
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Sudah Disembelih</span>
              <span className="text-3xl font-extrabold text-emerald-700 mt-1 block">
                {slaughteredCount} <span className="text-xs font-medium text-slate-400">hewan</span>
              </span>
              <span className="text-[10px] text-emerald-600/80 mt-1.5 flex items-center gap-1">
                <CheckCircle size={10} /> 
                {totalCount > 0 ? `${Math.round((slaughteredCount / totalCount) * 100)}% progress selesai` : 'Menunggu input hewan'}
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl font-bold">
              ✅
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Antrean Sembelih (Belum)</span>
              <span className="text-3xl font-extrabold text-amber-600 mt-1 block">
                {pendingCount} <span className="text-xs font-medium text-slate-400">hewan</span>
              </span>
              <span className="text-[10px] text-amber-600 mt-1.5 flex items-center gap-1">
                <Clock size={10} /> Menunggu giliran disembelih
              </span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl font-bold">
              🕒
            </div>
          </div>

        </div>

        {/* Species breakdown chart info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-100">
          <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🐂</span>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">SAPI</span>
                <span className="text-xs font-semibold text-slate-800">Total: {countSapi} Sapi</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700">{countSapiSlaughtered} Sembelih</span>
              <span className="block text-[9px] text-slate-400">{countSapi - countSapiSlaughtered} Belum</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🐐</span>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">KAMBING</span>
                <span className="text-xs font-semibold text-slate-800">Total: {countKambing} Kambing</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700">{countKambingSlaughtered} Sembelih</span>
              <span className="block text-[9px] text-slate-400">{countKambing - countKambingSlaughtered} Belum</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🐏</span>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">DOMBA</span>
                <span className="text-xs font-semibold text-slate-800">Total: {countDomba} Domba</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-emerald-700">{countDombaSlaughtered} Sembelih</span>
              <span className="block text-[9px] text-slate-400">{countDomba - countDombaSlaughtered} Belum</span>
            </div>
          </div>
        </div>

        {/* Filters and Registration Control */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          
          <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
            
            {/* Search inputs */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                <Search size={16} />
              </span>
              <input
                type="text"
                placeholder="Cari shohibul qurban atau nomor hewan (e.g., SP-002)..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
              />
            </div>

            {/* Quick Filter Selection */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Filter Species */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <Filter size={12} className="text-slate-500" />
                <span className="text-[11px] font-bold text-slate-500 uppercase select-none">Hewan:</span>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">Semua</option>
                  <option value="sapi">Sapi 🐂</option>
                  <option value="kambing">Kambing 🐐</option>
                  <option value="domba">Domba 🐏</option>
                </select>
              </div>

              {/* Filter Slaughtered */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase select-none">Status Sembelih:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent border-none text-xs text-slate-800 font-semibold focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">Semua</option>
                  <option value="pending">Belum Disembelih 🕒</option>
                  <option value="slaughtered">Sudah Disembelih ✅</option>
                </select>
              </div>

              {/* Register Action button */}
              {!user.isGuest && (
                <button
                  onClick={() => { setEditingAnimal(null); setIsFormOpen(true); }}
                  className="ml-auto inline-flex items-center gap-2 py-2 px-4 rounded-xl text-white font-bold text-xs bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-md shadow-emerald-600/10 outline-none"
                >
                  <Plus size={14} />
                  <span>Registrasi Qurban</span>
                </button>
              )}

            </div>

          </div>

          {/* List display */}
          <div className="border border-slate-100 rounded-2xl overflow-hidden mt-2">
            
            {loading ? (
              <div className="p-12 text-center text-slate-500 bg-slate-50/50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-600 border-t-transparent mx-auto mb-3" />
                <span className="text-xs font-semibold">Memuat rekap hewan qurban...</span>
              </div>
            ) : filteredQurbans.length === 0 ? (
              <div className="p-16 text-center text-slate-500 bg-slate-50/50 space-y-1.5">
                <span className="text-2xl block">🔍</span>
                <span className="text-sm font-semibold block text-slate-800">Tidak ada data hewan qurban</span>
                <span className="text-xs text-slate-500">
                  {searchText || filterType !== 'all' || filterStatus !== 'all' 
                    ? 'Cobalah ubah kata kunci pencarian atau bersihkan filter.' 
                    : 'Mulailah dengan menambahkan hewan qurban di masjid Anda.'}
                </span>
                {!(searchText || filterType !== 'all' || filterStatus !== 'all') && !user.isGuest && (
                  <button
                    onClick={() => { setEditingAnimal(null); setIsFormOpen(true); }}
                    className="mt-3 inline-flex items-center gap-1.5 py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all shadow-md shadow-emerald-600/10"
                  >
                    <Plus size={12} /> Tambah Hewan Pertama
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap md:whitespace-normal">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-extrabold uppercase tracking-wider border-b border-slate-100">
                      <th className="px-5 py-3.5">ID / No. Hewan</th>
                      <th className="px-5 py-3.5">Spesies / Jenis</th>
                      <th className="px-5 py-3.5">Shohibul Qurban (Pemilik)</th>
                      <th className="px-5 py-3.5">Berat (Kg)</th>
                      <th className="px-5 py-3.5">Keterangan</th>
                      <th className="px-5 py-3.5">Penyembelihan</th>
                      {!user.isGuest && <th className="px-5 py-3.5 text-center border-l border-slate-100">Tindakan</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredQurbans.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        
                        {/* Animal Number */}
                        <td className="px-5 py-4 font-mono text-xs font-bold text-slate-900">
                          <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                            {item.animalNumber}
                          </span>
                        </td>

                        {/* Species Tag */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 capitalize">
                            <span>{item.animalType === 'sapi' ? '🐂' : item.animalType === 'kambing' ? '🐐' : '🐏'}</span>
                            <span>{item.animalType}</span>
                          </span>
                        </td>

                        {/* Shohibul Qurban List */}
                        <td className="px-5 py-4 max-w-xs">
                          {item.owners && item.owners.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {item.owners.map((owner, oIdx) => (
                                <span key={oIdx} className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  {owner}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">Belum didaftarkan</span>
                          )}
                        </td>

                        {/* Weight */}
                        <td className="px-5 py-4 text-xs font-bold text-slate-700">
                          {item.weight ? `${item.weight} Kg` : <span className="text-slate-400 font-normal">-</span>}
                        </td>

                        {/* Notes */}
                        <td className="px-5 py-4 text-xs text-slate-600 max-w-xs break-words font-medium">
                          {item.notes || <span className="text-slate-400 italic">Tanpa catatan</span>}
                        </td>

                        {/* Slaughtered Status Control and Toggle */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {user.isGuest ? (
                              <div
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold ${
                                  item.slaughtered
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                                }`}
                              >
                                {item.slaughtered ? (
                                  <>
                                    <CheckCircle size={13} />
                                    <span>Sudah Disembelih</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={13} className="text-amber-500" />
                                    <span>Antrean</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleToggleSlaughter(item)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                  item.slaughtered
                                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/10'
                                    : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border-2 border-slate-200 hover:border-emerald-200'
                                }`}
                              >
                                {item.slaughtered ? (
                                  <>
                                    <CheckCircle size={13} />
                                    <span>Sudah Disembelih</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock size={13} className="text-amber-500" />
                                    <span>Belum Selesai</span>
                                  </>
                                )}
                              </button>
                            )}
                            {item.slaughtered && item.slaughteredAt && (
                              <span className="text-[10px] text-slate-400 italic block">
                                {new Date(item.slaughteredAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action buttons */}
                        {!user.isGuest && (
                          <td className="px-5 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* Edit: only allowed if NOT slaughtered */}
                              <button
                                onClick={() => {
                                  if (item.slaughtered) {
                                    alert("⚠️ Maaf, detail data hewan yang SUDAH disembelih tidak dapat disunting kembali demi menjaga asas otentisitas pelaporan.");
                                    return;
                                  }
                                  setEditingAnimal(item);
                                  setIsFormOpen(true);
                                }}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  item.slaughtered
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                                }`}
                                title={item.slaughtered ? "Data sudah disembelih" : "Sunting detail"}
                              >
                                <Edit3 size={15} />
                              </button>

                              {/* Delete: only allowed if NOT slaughtered */}
                              <button
                                onClick={() => {
                                  if (item.slaughtered) {
                                    alert("⚠️ Maaf, hewan yang SUDAH disembelih tidak diperbolehkan dihapus dari sistem!");
                                    return;
                                  }
                                  handleDeleteAnimal(item.id);
                                }}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  item.slaughtered
                                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                                    : 'bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border-slate-200'
                                }`}
                                title={item.slaughtered ? "Tidak bisa menghapus hewan setelah slaughtered" : "Hapus catatan"}
                              >
                                <Trash2 size={15} />
                              </button>

                            </div>
                          </td>
                        )}

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          </div>

          {/* Quick Informative banner */}
          <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-2.5">
            <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-800 leading-relaxed">
              <span className="font-bold">Informasi Penomoran Hewan Otomatis:</span> Setiap hewan didaftarkan akan beroleh nomor seri unik instan (e.g. S-001, K-001) yang disusun mandiri menurut urutan waktu masuk per jenis hewan di dalam lingkup masjid Anda. Tombol status penyembelihan terproteksi oleh sandi keamanan untuk menjamin validitas laporan ibadah secara murni.
            </div>
          </div>

        </div>

      </main>

      {/* ANIMAL INPUT MODAL */}
      <AnimalFormModal
        isOpen={isFormOpen}
        onClose={() => { setIsFormOpen(false); setEditingAnimal(null); }}
        onSave={handleSaveAnimal}
        editingAnimal={editingAnimal}
      />

      {/* REVERT SLAUGHTER AUTH CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => { setIsConfirmOpen(false); setTargetConfirmId(null); }}
        onConfirm={handleConfirmUndoSlaughter}
        expectedPasscode={organizationPasscode}
        animalNumber={targetConfirmNumber}
      />

    </div>
  );
}
