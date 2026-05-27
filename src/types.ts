export type AnimalType = 'sapi' | 'kambing' | 'domba';

export interface Place {
  id: string; // generated organization id, e.g. "PL-A59B"
  name: string; // e.g. "Masjid Baiturrahman"
  address?: string;
  passcode: string; // security passcode to undo slaughtered status
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  placeId: string;
  placeName: string;
  createdAt: string;
  isGuest?: boolean;
}

export interface Qurban {
  id: string;
  placeId: string;
  animalType: AnimalType;
  animalNumber: string; // Format e.g., SP-001, KB-001, DB-001 based on chronological sequence
  sequenceNumber: number; // Increment counter inside the place
  owners: string[]; // List of shohibul qurban (1-7 owners for Sapi, 1 for Kambing/Domba)
  weight?: number; // Estimated weight in kilograms
  notes?: string; // Optional metadata or notes
  slaughtered: boolean;
  slaughteredAt?: string | null;
  createdAt: string;
  createdBy: string; // user.uid
}

export interface QurbanInput {
  animalType: AnimalType;
  owners: string[];
  weight?: number;
  notes?: string;
}
