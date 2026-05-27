import React, { useState } from 'react';
import { services } from '../firebase';
import { UserProfile } from '../types';
import { Layout, ArrowRight, Lock, Info, Users, LayoutDashboard } from 'lucide-react';

interface OnboardingPageProps {
  user: UserProfile;
  onOnboardingComplete: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function OnboardingPage({ user, onOnboardingComplete, onLogout }: OnboardingPageProps) {
  const [name, setName] = useState(user.name || '');
  const [isNewPlace, setIsNewPlace] = useState(true);
  const [placeName, setPlaceName] = useState('');
  const [placeAddress, setPlaceAddress] = useState('');
  const [placePasscode, setPlacePasscode] = useState('');
  const [existingPlaceId, setExistingPlaceId] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showIdExplanation, setShowIdExplanation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!name.trim()) {
        throw new Error("Nama Pengurus harus diisi.");
      }

      if (isNewPlace) {
        if (!placeName.trim()) {
          throw new Error("Nama Tempat Penyelenggara harus diisi.");
        }
        if (!placePasscode.trim()) {
          throw new Error("Sandi konfirmasi hapus/batal sembelih harus ditentukan.");
        }
      } else {
        if (!existingPlaceId.trim()) {
          throw new Error("ID Tempat Penyelenggara yang ingin diikuti harus diisi.");
        }
      }

      const completedProfile = await services.completeOnboarding(user.uid, user.email, name.trim(), {
        isNew: isNewPlace,
        placeId: isNewPlace ? undefined : existingPlaceId.trim(),
        placeName: isNewPlace ? placeName.trim() : undefined,
        address: isNewPlace ? placeAddress.trim() : undefined,
        passcode: isNewPlace ? placePasscode.trim() : undefined
      });

      onOnboardingComplete(completedProfile);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal menyimpan konfigurasi profil.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-600/20 animate-pulse">
            <LayoutDashboard className="h-9 w-9" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          Siapkan Akun Pengurus
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Selesaikan info penyelenggara qurban Anda ({user.email})
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 sm:px-10">
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700">
              <span className="font-semibold">Kesalahan: </span>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Name confirmation */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Nama Pengurus / Admin
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Haji Ahmad"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-sm transition-all outline-none"
              />
            </div>

            {/* Organizer Space Options */}
            <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-2xl">
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Status Tempat Penyelenggara
              </span>
              <div className="flex space-x-3 mb-4">
                <button
                  type="button"
                  onClick={() => setIsNewPlace(true)}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    isNewPlace 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Buat Penyelenggara Baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewPlace(false)}
                  className={`flex-1 py-2 px-3 text-xs font-medium rounded-lg border transition-all ${
                    !isNewPlace 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-sm' 
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  Ikuti Tempat Existing
                </button>
              </div>

              {isNewPlace ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      Nama Masjid / Yayasan
                    </label>
                    <input
                      type="text"
                      required={isNewPlace}
                      placeholder="Contoh: Masjid Al-Ikhlas"
                      value={placeName}
                      onChange={(e) => setPlaceName(e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600">
                      Alamat / Lokasi (Opsional)
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Kecamatan Cicendo, Bandung"
                      value={placeAddress}
                      onChange={(e) => setPlaceAddress(e.target.value)}
                      className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-medium text-slate-600">
                        Sandi Konfirmasi Batal Sembelih
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowIdExplanation(!showIdExplanation)}
                        className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1"
                      >
                        <Info size={10} /> Apa ini?
                      </button>
                    </div>
                    <input
                      type="password"
                      required={isNewPlace}
                      placeholder="Sandi keamanan untuk membatalkan sembelih"
                      value={placePasscode}
                      onChange={(e) => setPlacePasscode(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                    {showIdExplanation && (
                      <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100">
                        Sandi ini digunakan jika Anda ingin mengubah kembali status hewan yang <strong>sudah disembelih</strong> menjadi <strong>belum disembelih</strong>. Fitur ini melindungi status sakral sembelih dari ketidaksengajaan klik.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Masukan ID Tempat Penyelenggara (e.g., PL-A59B)
                  </label>
                  <input
                    type="text"
                    required={!isNewPlace}
                    placeholder="ID Lokasi (Mintalah ID ini ke pengurus utama)"
                    value={existingPlaceId}
                    onChange={(e) => setExistingPlaceId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none uppercase font-mono"
                  />
                  <p className="mt-2 text-[11px] text-slate-500">
                    Sistem kami membagi data per lokasi. Dengan memasukkan ID lokasi, Anda akan bergabung dengan tim admin di masjid tersebut, berbagi basis data hewan qurban terpadu.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15 active:scale-[0.98] disabled:bg-slate-300 disabled:scale-100 disabled:shadow-none"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Menyimpan Profil...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan & Masuk Dasbor</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onLogout}
                disabled={isLoading}
                className="w-full text-center text-xs text-slate-500 hover:text-red-600 font-semibold py-2 transition-all"
              >
                Keluar / Ganti Akun Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
