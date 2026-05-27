import React, { useState } from 'react';
import { ShieldAlert, X, ShieldCheck } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  expectedPasscode: string;
  animalNumber: string;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  expectedPasscode,
  animalNumber
}: ConfirmationModalProps) {
  const [inputPasscode, setInputPasscode] = useState('');
  const [errorStatus, setErrorStatus] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorStatus(false);
    
    // We trim and compare securely
    if (inputPasscode.trim() === expectedPasscode.trim()) {
      setInputPasscode('');
      onConfirm();
      onClose();
    } else {
      setErrorStatus(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 divide-y divide-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Konfirmasi Keamanan</h3>
              <p className="text-xs text-slate-500">Membatalkan Status Sembelih</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Anda sedang membatalkan status penyembelihan untuk hewan bernomor <strong className="text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded font-mono">{animalNumber}</strong>. Hubungan ibadah qurban ini membutuhkan kepastian eksekusi tinggi. Hubungi penanggung jawab masjid untuk mendapatkan sandi otorisasi.
          </p>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
            <ShieldCheck className="text-slate-500 shrink-0 mt-0.5" size={14} />
            <span className="text-[11px] text-slate-500">
              Sandi Default tempat ini adalah sandi penyelenggara yang dibuat saat proses pendaftaran tempat pertama kali.
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 tracking-wider">
              Masukkan Sandi Otorisasi
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Masukan sandi..."
              value={inputPasscode}
              onChange={(e) => {
                setErrorStatus(false);
                setInputPasscode(e.target.value);
              }}
              className={`mt-1.5 w-full px-4 py-3 bg-slate-50 border ${
                errorStatus ? 'border-red-400 focus:ring-red-500/10' : 'border-slate-200 focus:ring-emerald-500/10'
              } rounded-xl focus:ring-4 text-slate-900 font-medium text-sm outline-none transition-all`}
            />
            {errorStatus && (
              <p className="mt-1 text-xs text-red-600 font-medium animate-shake">
                ❌ Sandi salah! Status saksama sembelih tidak dapat diubah.
              </p>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all outline-none"
            >
              Batalkan
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md shadow-red-600/10 outline-none"
            >
              Ubah Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
