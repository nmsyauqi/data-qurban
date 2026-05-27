import React, { useState } from 'react';
import { services } from '../firebase';
import { UserProfile } from '../types';
import { Shield, ArrowRight, Info, Eye, LogIn } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [locationId, setLocationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Authentication via Google
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const profile = await services.signInWithGoogle();
      onLoginSuccess(profile);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal masuk dengan Google.");
    } finally {
      setIsLoading(false);
    }
  };

  // Entry via Guest/Monitoring ID
  const handleGuestEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    const cleanId = locationId.trim().toUpperCase();
    if (!cleanId) {
      setErrorMessage("Silakan masukkan ID Tempat Penyelenggara.");
      setIsLoading(false);
      return;
    }

    try {
      const place = await services.getPlace(cleanId);
      if (!place) {
        throw new Error(`ID Tempat Penyelenggara "${cleanId}" tidak ditemukan. Silakan periksa kembali.`);
      }

      const guestProfile: UserProfile = {
        uid: `guest-${cleanId}-${Math.random().toString(36).substring(2, 6)}`,
        email: 'tamu@qurban.local',
        name: 'Tamu / Pemantau',
        placeId: cleanId,
        placeName: place.name,
        createdAt: new Date().toISOString(),
        isGuest: true
      };

      // Store in localStorage if we're simulating offline
      if (!services.isFirebaseReady) {
        localStorage.setItem('qurban_current_user', JSON.stringify(guestProfile));
      }

      onLoginSuccess(guestProfile);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal bergabung dengan tempat penyelenggara.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-16 w-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
            <Shield className="h-9 w-9" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
          Sistem Informasi Qurban
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w-sm mx-auto">
          Portal Pelaporan Real-Time, Pendataan Shohibul Qurban, dan Pemantauan Status Sembelih
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 sm:px-10">
          
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 font-medium">
              <span className="font-bold">Kesalahan: </span>
              {errorMessage}
            </div>
          )}

          {/* SECTION 1: ADMIN ENTRANCE */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pintu Masuk Pengurus (Admin / Panitia)
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Gunakan Akun Google Anda untuk masuk sebagai pengurus. Anda dapat menginput hewan qurban, mengatur shohibul, mengonfirmasi status penyembelihan secara real-time, dan mengunduh laporan Excel/PDF.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-3 py-3.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all shadow-sm active:scale-[0.98] disabled:bg-slate-50 disabled:scale-100 disabled:text-slate-400"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
              <span>Masuk via Google</span>
            </button>
          </div>

          {/* DECORATIVE SEPARATOR */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-bold tracking-widest text-[10px]">
                ATAU PANTAU LOKASI
              </span>
            </div>
          </div>

          {/* SECTION 2: GUEST MONITORING */}
          <form onSubmit={handleGuestEntry} className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1.5 w-1.5 bg-sky-500 rounded-full" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pintu Masuk Tamu / Shohibul Qurban
              </h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Masukkan ID Tempat Penyelenggara yang diberikan oleh panitia untuk memantau kemajuan sembelih hewan qurban Anda secara real-time. Anda tidak memerlukan login untuk memantau.
            </p>

            <div>
              <label htmlFor="location-id" className="sr-only">ID Tempat Penyelenggara</label>
              <input
                id="location-id"
                type="text"
                placeholder="CONTOH: PL-77F1"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                disabled={isLoading}
                className="w-full text-center tracking-widest uppercase font-mono px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-base font-bold outline-none transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15 active:scale-[0.98] disabled:bg-slate-300 disabled:scale-100 disabled:shadow-none"
            >
              <Eye size={16} />
              <span>Mulai Pantau Real-Time</span>
              <ArrowRight size={16} className="ml-0.5" />
            </button>
          </form>

          {/* CONNECTION METADATA */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-start gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-xs leading-relaxed text-slate-600">
              {services.isFirebaseReady ? (
                <span>
                  Sistem aktif terhubung ke <strong className="text-emerald-700">Cloud Firestore Server</strong>. Semua transaksi data real-time terjaga otomatis.
                </span>
              ) : (
                <span>
                  <strong>Developer Offline Mode:</strong> Berjalan di atas Local Emulator. Silakan masukkan ID tempat demo seperti <strong className="font-mono text-emerald-700">PL-77F1</strong> untuk melihat contoh data.
                </span>
              )}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
