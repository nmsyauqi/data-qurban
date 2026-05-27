import { useState, useEffect } from 'react';
import { services } from './firebase';
import { UserProfile } from './types';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';
import OnboardingPage from './components/OnboardingPage';
import { Info, Shield } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Listen to authentication state change (Realtime Firebase auth or Local simulator)
    const unsubscribe = services.onAuthChange((userProfile) => {
      setCurrentUser(userProfile);
      setIsInitializing(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await services.signOut();
      setCurrentUser(null);
    } catch (err) {
      console.error("Gagal mengeluarkan akun:", err);
    }
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 text-slate-700">
        <div className="h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Menyiapkan Sistem Informasi Qurban</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      
      {/* Dev Warning header only if not Firebase initialized but still elegant */}
      {!services || !services.onAuthChange ? (
        <div className="bg-amber-500 text-white font-bold p-3 text-center text-xs">
          ⚠️ Gagal inisialisasi basis data sistem. Sila hubungi tim support.
        </div>
      ) : null}

      {currentUser ? (
        currentUser.placeId === 'PENDING_ONBOARDING' ? (
          <OnboardingPage 
            user={currentUser} 
            onOnboardingComplete={(profile) => setCurrentUser(profile)} 
            onLogout={handleLogout} 
          />
        ) : (
          <Dashboard user={currentUser} onLogout={handleLogout} />
        )
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}

    </div>
  );
}
