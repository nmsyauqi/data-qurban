import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';
import { Place, UserProfile, Qurban, AnimalType } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Detect if Firebase config is fully set up
export const isFirebaseReady = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

export const getFirebaseProjectId = () => {
  return firebaseConfig?.projectId || "";
};

let firebaseApp;
let firebaseAuth: any = null;
let firestoreDb: any = null;

if (isFirebaseReady) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId || "(default)");
    firebaseAuth = getAuth(firebaseApp);

    // Test connection as requested by Firebase Integration skill guidelines
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }
    };
    testConnection();
  } catch (err) {
    console.error("Failed to initialize Firebase SDK:", err);
  }
} else {
  console.log("Firebase is not fully configured yet. Running in high-fidelity offline/local fallback mode.");
}

export const db = firestoreDb;
export const auth = firebaseAuth;

// ERROR HANDLING (SKILL SPECIFIC MANDATE)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: firebaseAuth?.currentUser?.uid || null,
      email: firebaseAuth?.currentUser?.email || null,
      emailVerified: firebaseAuth?.currentUser?.emailVerified || null,
      isAnonymous: firebaseAuth?.currentUser?.isAnonymous || null,
      tenantId: firebaseAuth?.currentUser?.tenantId || null,
      providerInfo: firebaseAuth?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error Details: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// LOCAL EMULATION DATA ENGINE (For seamless preview with fallback state)
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalStorageData = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// INITIAL MOCK DATA CONFIG
if (!localStorage.getItem('qurban_places')) {
  setLocalStorageData('qurban_places', [
    {
      id: "PL-77F1",
      name: "Masjid Raya Baitul Makmur",
      address: "Jl. Diponegoro No. 12, Bandung",
      passcode: "admin123",
      createdAt: new Date().toISOString()
    }
  ]);
  setLocalStorageData('qurban_users', [
    {
      uid: "mock-admin-uid",
      email: "pengurus@masjid.com",
      name: "Haji Ahmad",
      placeId: "PL-77F1",
      placeName: "Masjid Raya Baitul Makmur",
      createdAt: new Date().toISOString()
    }
  ]);
  setLocalStorageData('qurban_items', [
    {
      id: "qb-001",
      placeId: "PL-77F1",
      animalType: 'sapi',
      animalNumber: "SP-001",
      sequenceNumber: 1,
      owners: ["Budi Santoso", "Siti Aminah", "Rudi Hermawan", "Dewi Lestari", "Irfan Hakim", "Slamet", "Tri Wahyuni"],
      weight: 350,
      notes: "Sapi Bali sehat wal afiat",
      slaughtered: true,
      slaughteredAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      createdBy: "mock-admin-uid"
    },
    {
      id: "qb-002",
      placeId: "PL-77F1",
      animalType: 'kambing',
      animalNumber: "KB-001",
      sequenceNumber: 2,
      owners: ["H. Muhammad Shidiq"],
      weight: 45,
      notes: "Kambing Etawa tanduk panjang",
      slaughtered: false,
      slaughteredAt: null,
      createdAt: new Date(Date.now() - 3600000 * 23).toISOString(),
      createdBy: "mock-admin-uid"
    },
    {
      id: "qb-003",
      placeId: "PL-77F1",
      animalType: 'domba',
      animalNumber: "DB-001",
      sequenceNumber: 3,
      owners: ["Diana Putri"],
      weight: 32,
      notes: "Bulunya lebat, sehat",
      slaughtered: false,
      slaughteredAt: null,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      createdBy: "mock-admin-uid"
    }
  ]);
}

// UNIFIED SERVICES PROVIDER
export const services = {
  isFirebaseReady,
  // Authentication & Session Observer
  onAuthChange: (callback: (userProfile: UserProfile | null) => void) => {
    if (isFirebaseReady && firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          callback(null);
          return;
        }
        
        // Fetch User Profile document from Firestore
        const userPath = `users/${fbUser.uid}`;
        try {
          const userDoc = await getDoc(doc(firestoreDb, 'users', fbUser.uid));
          if (userDoc.exists()) {
            callback(userDoc.data() as UserProfile);
          } else {
            // Profile not found in document db but firebase account is authenticated
            // Use special indicator to trigger onboarding flow for Google/external users
            callback({
              uid: fbUser.uid,
              email: fbUser.email || '',
              name: fbUser.displayName || 'Pengurus Masjid',
              placeId: 'PENDING_ONBOARDING',
              placeName: '',
              createdAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error("Failed to read user registry:", error);
          callback(null);
        }
      });
    } else {
      // Local session simulation
      const currentMockUser = localStorage.getItem('qurban_current_user');
      if (currentMockUser) {
        callback(JSON.parse(currentMockUser));
      } else {
        callback(null);
      }
      // Return unsubscriber function
      return () => {};
    }
  },

  // REGISTER BRAND NEW LOCATION (CREATE PLACE)
  createPlace: async (name: string, address: string, passcode: string): Promise<Place> => {
    // Generate simple organization code: e.g. PL-ABCD
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const placeIdForNew = `PL-${suffix}`;
    
    const placeObj: Place = {
      id: placeIdForNew,
      name,
      address,
      passcode,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseReady && firestoreDb) {
      const dbPath = `places/${placeIdForNew}`;
      try {
        await setDoc(doc(firestoreDb, 'places', placeIdForNew), placeObj);
        return placeObj;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, dbPath);
      }
    } else {
      const placesList = getLocalStorageData<Place[]>('qurban_places', []);
      placesList.push(placeObj);
      setLocalStorageData('qurban_places', placesList);
      return placeObj;
    }
  },

  // RETRIEVE PLACE DETAILS
  getPlace: async (placeId: string): Promise<Place | null> => {
    if (isFirebaseReady && firestoreDb) {
      const dbPath = `places/${placeId}`;
      try {
        const placeDoc = await getDoc(doc(firestoreDb, 'places', placeId));
        return placeDoc.exists() ? (placeDoc.data() as Place) : null;
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, dbPath);
      }
    } else {
      const placesList = getLocalStorageData<Place[]>('qurban_places', []);
      const found = placesList.find(p => p.id === placeId);
      return found || null;
    }
  },

  // SIGN UP NEW ACCOUNT BOUND TO A PLACE
  signUp: async (
    email: string, 
    password: string, 
    name: string, 
    place: { isNew: boolean; placeId?: string; placeName?: string; address?: string; passcode?: string }
  ): Promise<UserProfile> => {
    if (isFirebaseReady && firebaseAuth && firestoreDb) {
      try {
        // Step 1: Create user in firebase Auth FIRST
        // This registers and signs them in, populating the request.auth in Firestore security rules!
        const authResult = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const uid = authResult.user.uid;

        let targetPlaceId = place.placeId || '';
        let targetPlaceName = place.placeName || '';

        try {
          // Step 2: Handle place/organization setup under the newly authenticated user session
          if (place.isNew) {
            const newlyCreated = await services.createPlace(
              place.placeName || 'Masjid Baru', 
              place.address || '', 
              place.passcode || '123456'
            );
            targetPlaceId = newlyCreated.id;
            targetPlaceName = newlyCreated.name;
          } else {
            // Joining an existing Organizer space
            const verifiedExist = await services.getPlace(targetPlaceId);
            if (!verifiedExist) {
              throw new Error("ID Tempat Penyelenggara tidak ditemukan. Silakan periksa kembali.");
            }
            targetPlaceName = verifiedExist.name;
          }

          const profile: UserProfile = {
            uid,
            email,
            name,
            placeId: targetPlaceId,
            placeName: targetPlaceName,
            createdAt: new Date().toISOString()
          };

          // Step 3: Save user profile in Firestore
          await setDoc(doc(firestoreDb, 'users', uid), profile);
          return profile;
        } catch (innerErr: any) {
          // Rollback the created Auth user if Firestore writing failed, preventing orphaned Auth profiles
          try {
            await authResult.user.delete();
          } catch (deleteErr) {
            console.error("Failed to delete orphaned authenticated user during rollback:", deleteErr);
          }
          throw innerErr;
        }
      } catch (err: any) {
        throw new Error(err?.message || "Gagal melakukan pendaftaran akun.");
      }
    } else {
      // Local Auth registration logic
      let targetPlaceId = place.placeId || '';
      let targetPlaceName = place.placeName || '';

      // Step 1: Handle organization setup
      if (place.isNew) {
        const newlyCreated = await services.createPlace(
          place.placeName || 'Masjid Baru', 
          place.address || '', 
          place.passcode || '123456'
        );
        targetPlaceId = newlyCreated.id;
        targetPlaceName = newlyCreated.name;
      } else {
        // Joining exist
        const verifiedExist = await services.getPlace(targetPlaceId);
        if (!verifiedExist) {
          throw new Error("ID Tempat Penyelenggara tidak ditemukan. Silakan periksa kembali.");
        }
        targetPlaceName = verifiedExist.name;
      }

      const usersList = getLocalStorageData<UserProfile[]>('qurban_users', []);
      if (usersList.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("Email ini sudah terdaftar.");
      }

      const generatedUid = `usr-${Math.random().toString(36).substring(2, 9)}`;
      const profile: UserProfile = {
        uid: generatedUid,
        email,
        name,
        placeId: targetPlaceId,
        placeName: targetPlaceName,
        createdAt: new Date().toISOString()
      };

      usersList.push(profile);
      setLocalStorageData('qurban_users', usersList);
      
      // Persist logged session locally
      localStorage.setItem('qurban_current_user', JSON.stringify(profile));
      return profile;
    }
  },

  // SIGN IN ACCOUNT
  signIn: async (email: string, password: string): Promise<UserProfile> => {
    if (isFirebaseReady && firebaseAuth && firestoreDb) {
      try {
        const credentials = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const uid = credentials.user.uid;

        const userDoc = await getDoc(doc(firestoreDb, 'users', uid));
        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          throw new Error("Profil pengguna tidak ditemukan di database.");
        }
      } catch (err: any) {
        throw new Error(err?.message || "Email atau password yang Anda masukkan salah.");
      }
    } else {
      // Local login simulation
      const usersList = getLocalStorageData<UserProfile[]>('qurban_users', []);
      // Direct pass during development or verify
      const matchedUser = usersList.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        localStorage.setItem('qurban_current_user', JSON.stringify(matchedUser));
        return matchedUser;
      } else {
        throw new Error("Email atau password salah.");
      }
    }
  },

  // SIGN OUT CURRENT SESSION
  signOut: async (): Promise<void> => {
    if (isFirebaseReady && firebaseAuth) {
      await signOut(firebaseAuth);
    } else {
      localStorage.removeItem('qurban_current_user');
    }
  },

  // SIGN IN WITH GOOGLE
  signInWithGoogle: async (): Promise<UserProfile> => {
    if (isFirebaseReady && firebaseAuth && firestoreDb) {
      try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(firebaseAuth, provider);
        const fbUser = result.user;

        // Check if profile exists
        const userDoc = await getDoc(doc(firestoreDb, 'users', fbUser.uid));
        if (userDoc.exists()) {
          return userDoc.data() as UserProfile;
        } else {
          // Return pending onboarding profile
          return {
            uid: fbUser.uid,
            email: fbUser.email || '',
            name: fbUser.displayName || 'Pengurus Masjid',
            placeId: 'PENDING_ONBOARDING',
            placeName: '',
            createdAt: new Date().toISOString()
          };
        }
      } catch (err: any) {
        throw new Error(err?.message || "Gagal masuk menggunakan Google.");
      }
    } else {
      // Local emulation for Google login
      const generatedUid = `usr-google-${Math.random().toString(36).substring(2, 9)}`;
      const profile: UserProfile = {
        uid: generatedUid,
        email: "syauqimuhammad430@gmail.com",
        name: "Syauqi Muhammad",
        placeId: 'PENDING_ONBOARDING',
        placeName: '',
        createdAt: new Date().toISOString()
      };
      
      // Save in mock data so we can update it in completeOnboarding
      const usersList = getLocalStorageData<UserProfile[]>('qurban_users', []);
      usersList.push(profile);
      setLocalStorageData('qurban_users', usersList);
      
      localStorage.setItem('qurban_current_user', JSON.stringify(profile));
      return profile;
    }
  },

  // COMPLETE REGISTER/ONBOARDING FOR EXTERNAL LOGINS
  completeOnboarding: async (
    uid: string,
    email: string,
    name: string,
    place: { isNew: boolean; placeId?: string; placeName?: string; address?: string; passcode?: string }
  ): Promise<UserProfile> => {
    let targetPlaceId = place.placeId || '';
    let targetPlaceName = place.placeName || '';

    // Step 1: Handle organization setup
    if (place.isNew) {
      const newlyCreated = await services.createPlace(
        place.placeName || 'Masjid Baru', 
        place.address || '', 
        place.passcode || '123456'
      );
      targetPlaceId = newlyCreated.id;
      targetPlaceName = newlyCreated.name;
    } else {
      // Joining exist
      const verifiedExist = await services.getPlace(targetPlaceId);
      if (!verifiedExist) {
        throw new Error("ID Tempat Penyelenggara tidak ditemukan. Silakan periksa kembali.");
      }
      targetPlaceName = verifiedExist.name;
    }

    const profile: UserProfile = {
      uid,
      email,
      name,
      placeId: targetPlaceId,
      placeName: targetPlaceName,
      createdAt: new Date().toISOString()
    };

    if (isFirebaseReady && firestoreDb) {
      try {
        await setDoc(doc(firestoreDb, 'users', uid), profile);
        return profile;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
      }
    } else {
      // Local Emulator
      const usersList = getLocalStorageData<UserProfile[]>('qurban_users', []);
      const filtered = usersList.filter(u => u.uid !== uid);
      filtered.push(profile);
      setLocalStorageData('qurban_users', filtered);
      
      localStorage.setItem('qurban_current_user', JSON.stringify(profile));
      return profile;
    }
  },

  // RETRIEVE QURBANS LIST BY PLACE
  getQurbans: async (placeId: string): Promise<Qurban[]> => {
    if (isFirebaseReady && firestoreDb) {
      const colPath = 'qurbans';
      try {
        // Safe Firestore queries
        const qRef = query(
          collection(firestoreDb, colPath), 
          where('placeId', '==', placeId)
        );
        const snaps = await getDocs(qRef);
        const results: Qurban[] = [];
        snaps.forEach(doc => {
          results.push(doc.data() as Qurban);
        });
        
        // Sort chronologically by sequenceNumber
        return results.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, colPath);
      }
    } else {
      const items = getLocalStorageData<Qurban[]>('qurban_items', []);
      return items.filter(itm => itm.placeId === placeId).sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    }
  },

  // REGISTER ANIMAL ENTRY
  createQurban: async (animalType: AnimalType, owners: string[], weight: number | undefined, notes: string | undefined, user: UserProfile): Promise<Qurban> => {
    const list = await services.getQurbans(user.placeId);
    
    // Sort and get next sequence indices
    const nextSeq = list.length > 0 ? Math.max(...list.map(q => q.sequenceNumber)) + 1 : 1;
    
    // Generate code adjusting sequence inside the organization
    // Types of prefixes: S=Sapi, K=Kambing, D=Domba
    let prefix = 'S';
    if (animalType === 'kambing') prefix = 'K';
    if (animalType === 'domba') prefix = 'D';

    // Count existing of same animal type to generate specific label e.g., SP-002, KB-101
    const countType = list.filter(item => item.animalType === animalType).length;
    const formattedNumber = `${prefix}-${String(countType + 1).padStart(3, '0')}`;

    const newId = `qb-${nextSeq}-${Math.random().toString(36).substring(2, 6)}`;
    const qitem: Qurban = {
      id: newId,
      placeId: user.placeId,
      animalType,
      animalNumber: formattedNumber,
      sequenceNumber: nextSeq,
      owners: owners.filter(o => o.trim() !== ''),
      weight: weight || undefined,
      notes: notes || '',
      slaughtered: false,
      slaughteredAt: null,
      createdAt: new Date().toISOString(),
      createdBy: user.uid
    };

    if (isFirebaseReady && firestoreDb) {
      const writePath = `qurbans/${newId}`;
      try {
        await setDoc(doc(firestoreDb, 'qurbans', newId), qitem);
        return qitem;
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, writePath);
      }
    } else {
      const itemsList = getLocalStorageData<Qurban[]>('qurban_items', []);
      itemsList.push(qitem);
      setLocalStorageData('qurban_items', itemsList);
      return qitem;
    }
  },

  // UPDATE ANIMAL STATUS OR VALUES
  updateQurbanData: async (id: string, updatedFields: Partial<Qurban>): Promise<void> => {
    if (isFirebaseReady && firestoreDb) {
      const writePath = `qurbans/${id}`;
      try {
        const docRef = doc(firestoreDb, 'qurbans', id);
        await updateDoc(docRef, updatedFields);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, writePath);
      }
    } else {
      const list = getLocalStorageData<Qurban[]>('qurban_items', []);
      const index = list.findIndex(itm => itm.id === id);
      if (index !== -1) {
        list[index] = { ...list[index], ...updatedFields };
        setLocalStorageData('qurban_items', list);
      }
    }
  },

  // REMOVE SACRIFICIAL ANIMAL
  deleteQurban: async (id: string): Promise<void> => {
    if (isFirebaseReady && firestoreDb) {
      const deletePath = `qurbans/${id}`;
      try {
        await deleteDoc(doc(firestoreDb, 'qurbans', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, deletePath);
      }
    } else {
      const list = getLocalStorageData<Qurban[]>('qurban_items', []);
      const filtered = list.filter(itm => itm.id !== id);
      setLocalStorageData('qurban_items', filtered);
    }
  }
};
