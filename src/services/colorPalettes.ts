import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Palette } from '../utils/defaultPalettes';

export interface UserPalette extends Palette {
  userId: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

/**
 * Create a new color palette
 */
export async function createPalette(
  userId: string,
  name: string,
  colors: string[]
): Promise<string> {
  const paletteData = {
    name,
    colors,
    userId,
    isDefault: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: 0,
  };

  const docRef = await addDoc(collection(db, 'colorPalettes'), paletteData);
  return docRef.id;
}

/**
 * Get all palettes for a user
 */
export async function getUserPalettes(userId: string): Promise<UserPalette[]> {
  const q = query(
    collection(db, 'colorPalettes'),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<UserPalette, 'id'>),
  }));
}

/**
 * Get a single palette by ID
 */
export async function getPalette(paletteId: string): Promise<UserPalette | null> {
  const docRef = doc(db, 'colorPalettes', paletteId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<UserPalette, 'id'>),
  };
}

/**
 * Update a palette
 */
export async function updatePalette(
  paletteId: string,
  updates: Partial<Pick<UserPalette, 'name' | 'colors' | 'order'>>
): Promise<void> {
  const docRef = doc(db, 'colorPalettes', paletteId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: Date.now(),
  });
}

/**
 * Delete a palette
 */
export async function deletePalette(paletteId: string): Promise<void> {
  const docRef = doc(db, 'colorPalettes', paletteId);
  await deleteDoc(docRef);
}

/**
 * Add a color to a palette
 */
export async function addColorToPalette(
  paletteId: string,
  color: string
): Promise<void> {
  const palette = await getPalette(paletteId);
  if (!palette) {
    throw new Error('Palette not found');
  }

  const updatedColors = [...palette.colors, color];
  await updatePalette(paletteId, { colors: updatedColors });
}

/**
 * Remove a color from a palette
 */
export async function removeColorFromPalette(
  paletteId: string,
  colorIndex: number
): Promise<void> {
  const palette = await getPalette(paletteId);
  if (!palette) {
    throw new Error('Palette not found');
  }

  const updatedColors = palette.colors.filter((_, index) => index !== colorIndex);
  await updatePalette(paletteId, { colors: updatedColors });
}

/**
 * Subscribe to user's palettes in real-time
 */
export function subscribeToUserPalettes(
  userId: string,
  callback: (palettes: UserPalette[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'colorPalettes'),
    where('userId', '==', userId),
    orderBy('order', 'asc')
  );

  return onSnapshot(q, (snapshot) => {
    const palettes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<UserPalette, 'id'>),
    }));
    callback(palettes);
  });
}

/**
 * Reorder palettes
 */
export async function reorderPalettes(
  paletteIds: string[],
  newOrders: number[]
): Promise<void> {
  const updates = paletteIds.map((id, index) =>
    updatePalette(id, { order: newOrders[index] })
  );
  await Promise.all(updates);
}

/**
 * User color preferences
 */
export interface ColorPreferences {
  defaultFillColor: string;
  defaultStrokeColor: string;
  recentColors: string[];
  activePaletteId: string | null;
}

/**
 * Get user's color preferences
 */
export async function getColorPreferences(userId: string): Promise<ColorPreferences> {
  const docRef = doc(db, 'users', userId, 'preferences', 'colors');
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    // Return defaults
    return {
      defaultFillColor: '#3B82F6',
      defaultStrokeColor: '#000000',
      recentColors: [],
      activePaletteId: null,
    };
  }

  return docSnap.data() as ColorPreferences;
}

/**
 * Update user's color preferences
 */
export async function updateColorPreferences(
  userId: string,
  preferences: Partial<ColorPreferences>
): Promise<void> {
  const docRef = doc(db, 'users', userId, 'preferences', 'colors');
  await updateDoc(docRef, preferences);
}

