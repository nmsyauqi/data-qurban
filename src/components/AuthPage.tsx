import React, { useState } from 'react';
import { services, getFirebaseProjectId } from '../firebase';
import { UserProfile } from '../types';
import { Shield, ArrowRight, Info, Eye, LogIn, Lock, Mail, UserPlus, Users, Key } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  // Tabs: 'login' (Masuk) or 'register' (Daftar)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // States
  const [locationId, setLocationId] = useState('');
  
  // Register States
  const [regName, setRegName] = useState('');
  const [regIsNewPlace, setRegIsNewPlace] = useState(true);
  const [regPlaceName, setRegPlaceName] = useState('');
  const [regPlaceAddress, setRegPlaceAddress] = useState('');
  const [regPlacePasscode, setRegPlacePasscode] = useState('');
  const [regExistingPlaceId, setRegExistingPlaceId] = useState('');

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showIdExplanation, setShowIdExplanation] = useState(false);

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

  // Register Account with Google
  const handleRegisterWithGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (!regName.trim()) {
        throw new Error("Nama Pengurus harus diisi.");
      }

      if (regIsNewPlace) {
        if (!regPlaceName.trim()) {
          throw new Error("Nama Tempat Penyelenggara harus diisi.");
        }
        if (!regPlacePasscode.trim()) {
          throw new Error("Sandi konfirmasi hapus/batal sembelih harus ditentukan.");
        }
      } else {
        if (!regExistingPlaceId.trim()) {
          throw new Error("ID Tempat Penyelenggara yang ingin diikuti harus diisi.");
        }
      }

      // Step 1: Auth with Google
      const googleProfile = await services.signInWithGoogle();

      // Step 2: Write profile and place configuration via onboarding
      const profile = await services.completeOnboarding(
        googleProfile.uid,
        googleProfile.email,
        regName.trim(),
        {
          isNew: regIsNewPlace,
          placeId: regIsNewPlace ? undefined : regExistingPlaceId.trim(),
          placeName: regIsNewPlace ? regPlaceName.trim() : undefined,
          address: regIsNewPlace ? regPlaceAddress.trim() : undefined,
          passcode: regIsNewPlace ? regPlacePasscode.trim() : undefined
        }
      );

      onLoginSuccess(profile);
    } catch (err: any) {
      setErrorMessage(err?.message || "Gagal melakukan registrasi akun.");
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-3xl border border-slate-100 sm:px-10">
          
          {/* Main Navigation Tabs */}
          <div className="flex border-b border-slate-100 mb-6 pb-1">
            <button
              onClick={() => { setActiveTab('login'); setErrorMessage(null); }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                activeTab === 'login'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <LogIn size={16} />
                Masuk Sistem
              </span>
            </button>
            <button
              onClick={() => { setActiveTab('register'); setErrorMessage(null); }}
              className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-all ${
                activeTab === 'register'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus size={16} />
                Daftar Akun Baru
              </span>
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl text-sm text-red-700 font-medium">
                <span className="font-bold">Kesalahan: </span>
                {errorMessage}
              </div>

              {errorMessage.includes('auth/operation-not-allowed') && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5 bg-amber-500 text-white rounded-full p-1 flex-shrink-0">
                      <Lock className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-amber-950">
                        Penyedia Email belum diaktifkan di Firebase Auth
                      </h4>
                      <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                        Anda perlu mengaktifkan penyedia masuk/pendaftaran <strong>Email/Password</strong> di Konsol Firebase Anda agar pendaftaran atau masuk dengan email dapat dilakukan. Silakan ikuti langkah di bawah ini:
                      </p>
                    </div>
                  </div>
                  
                  <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 pl-1 leading-relaxed">
                    <li>Buka <strong>Konsol Firebase</strong>.</li>
                    <li>Pilih menu <strong>Authentication</strong> di sisi kiri.</li>
                    <li>Sila klik tab <strong>Sign-in method</strong> di bagian atas.</li>
                    <li>Pilih tombol <strong>Add new provider</strong>, lalu pilih <strong>Email/Password</strong>.</li>
                    <li>Aktifkan opsi pertama (Email/Password), lalu klik <strong>Save</strong>.</li>
                  </ol>

                  {getFirebaseProjectId() && (
                    <div className="pt-2">
                      <a
                        href={`https://console.firebase.google.com/project/${getFirebaseProjectId()}/authentication/providers`}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-md transition-all w-full text-center"
                      >
                        Buka Konsol Firebase &rarr;
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'login' ? (
            /* TAB 1: LOGIN (WITH BOTH SOCIAL GOOGLE, & GUEST OPTIONS) */
            <div className="space-y-6">
              
              {/* ADMIN ENTRANCE (GOOGLE ONLY) */}
              <div className="space-y-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pintu Masuk Pengurus (Admin / Panitia)
                  </h3>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Gunakan Akun Google Anda untuk masuk sebagai pengurus. Anda dapat menginput hewan qurban, mengatur shohibul, mengonfirmasi status penyembelihan secara real-time, dan mengunduh laporan.
                </p>

                {/* Google Button */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm transition-all shadow-sm active:scale-[0.98] disabled:bg-slate-50 disabled:scale-100"
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

              {/* GUEST MONITORING ENTRANCE (ID LOKASI) */}
              <form onSubmit={handleGuestEntry} className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-1.5 w-1.5 bg-sky-500 rounded-full" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pintu Masuk Tamu / Shohibul Qurban
                  </h3>
                </div>
                
                <p className="text-xs text-slate-500 leading-relaxed">
                  Masukkan ID Tempat Penyelenggara untuk memantau kemajuan sembelih secara real-time tanpa memerlukan proses pendaftaran akun.
                </p>

                <div>
                  <input
                    type="text"
                    placeholder="CONTOH: PL-77F1"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    disabled={isLoading}
                    className="w-full text-center tracking-widest uppercase font-mono px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 text-base font-bold outline-none transition-all placeholder:text-slate-300 placeholder:font-sans placeholder:tracking-normal placeholder:text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all shadow-md bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/15 active:scale-[0.98] disabled:bg-slate-300 disabled:scale-100"
                >
                  <Eye size={16} />
                  <span>Mulai Pantau Real-Time</span>
                  <ArrowRight size={16} className="ml-0.5" />
                </button>
              </form>

            </div>
          ) : (
            /* TAB 2: REGISTER PROFILE (CREATES GOOGLE ACCOUNT BOUND TO NEW/EXISTING PLACE) */
            <form onSubmit={handleRegisterWithGoogle} className="space-y-4">
              
              {/* Admin profile detail */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Nama Pengurus / Admin
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Haji Ahmad"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  disabled={isLoading}
                  className="mt-1.5 w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 text-slate-850 text-xs transition-all outline-none"
                />
              </div>

              {/* Place Settings */}
              <div className="border border-slate-100 bg-slate-50/50 p-4 rounded-xl space-y-3">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Tempat Penyelenggaraan / Lokasi
                </span>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setRegIsNewPlace(true)}
                    disabled={isLoading}
                    className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg border transition-all ${
                      regIsNewPlace 
                        ? 'bg-emerald-55 text-emerald-800 border-emerald-250 bg-emerald-50 shadow-sm' 
                        : 'bg-white text-slate-550 border-slate-200'
                    }`}
                  >
                    Buat Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegIsNewPlace(false)}
                    disabled={isLoading}
                    className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg border transition-all ${
                      !regIsNewPlace 
                        ? 'bg-emerald-55 text-emerald-800 border-emerald-250 bg-emerald-50 shadow-sm' 
                        : 'bg-white text-slate-550 border-slate-200'
                    }`}
                  >
                    Ikuti Existing ID
                  </button>
                </div>

                {regIsNewPlace ? (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Nama Masjid / Yayasan
                      </label>
                      <input
                        type="text"
                        required={regIsNewPlace}
                        placeholder="Contoh: Masjid Raya Baiturrahman"
                        value={regPlaceName}
                        onChange={(e) => setRegPlaceName(e.target.value)}
                        disabled={isLoading}
                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500">
                        Alamat Lokasi (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Kecamatan Cicendo, Bandung"
                        value={regPlaceAddress}
                        onChange={(e) => setRegPlaceAddress(e.target.value)}
                        disabled={isLoading}
                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                        <label className="block text-[10px] font-semibold text-slate-500">
                          Sandi Konfirmasi Batal Sembelih
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowIdExplanation(!showIdExplanation)}
                          className="text-[9px] text-emerald-600 hover:underline flex items-center gap-0.5"
                        >
                          <Info size={10} /> Apa ini?
                        </button>
                      </div>
                      <input
                        type="password"
                        required={regIsNewPlace}
                        placeholder="Kata sandi lokal membatalkan sembelih"
                        value={regPlacePasscode}
                        onChange={(e) => setRegPlacePasscode(e.target.value)}
                        disabled={isLoading}
                        className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 outline-none focus:border-emerald-500"
                      />
                      {showIdExplanation && (
                        <p className="mt-1 text-[10px] leading-relaxed text-slate-400 bg-emerald-50/40 p-2.5 rounded border border-emerald-100">
                          Sandi ini digunakan saat pengurus ingin menganulir/membatalkan status sembelih hewan yang terlanjur tercentang kembali menjadi belum disembelih. Menjamin akurasi visualisasi.
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    <label className="block text-[10px] font-semibold text-slate-500">
                      ID Tempat Penyelenggara (Contoh: PL-77F1)
                    </label>
                    <input
                      type="text"
                      required={!regIsNewPlace}
                      placeholder="ID Lokasi (Minta ke panitia utama)"
                      value={regExistingPlaceId}
                      onChange={(e) => setRegExistingPlaceId(e.target.value)}
                      disabled={isLoading}
                      className="mt-1 w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-emerald-500 outline-none uppercase font-mono tracking-wider"
                    />
                    <p className="mt-1.5 text-[10px] text-slate-400 leading-normal">
                      ID ini tertera di bagian atas dasbor pengurus utama. Memungkinkan berbagi data hewan qurban sesama tim.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl text-white font-bold text-sm bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/15 transition-all active:scale-[0.98] disabled:bg-slate-300"
                >
                  <svg className="h-5 w-5 shrink-0 bg-white p-0.5 rounded-full" viewBox="0 0 24 24">
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
                  <span>Daftar via Google</span>
                  <ArrowRight size={15} />
                </button>
              </div>

            </form>
          )}

          {/* SHARED REASURING NOTICE */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-start gap-3 bg-amber-50/50 p-4 rounded-xl border border-amber-100">
            <Info className="text-amber-600 shrink-0 mt-0.5" size={16} />
            <p className="text-[11px] leading-relaxed text-slate-600">
              {services.isFirebaseReady ? (
                <span>
                  Sistem terhubung ke <strong className="text-emerald-700">Cloud Firestore</strong>. Semua penulisan data dan proses validasi akun diawasi oleh aturan keamanan server (rules) demi menjamin orisinalitas laporan.
                </span>
              ) : (
                <span>
                  <strong>Demo Offline Mode:</strong> Pengguna berjalan di atas Local Emulator. Semua registrasi baru disimpan di local storage peramban Anda sementara.
                </span>
              )}
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
