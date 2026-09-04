import { collection, doc, setDoc } from 'firebase/firestore';
import { db, isConfigured } from './firebase';

const STORAGE_KEYS = {
  PEOPLE: 'dias_eafit_people',
  ASSIGNMENTS: 'dias_eafit_assignments',
  AVAILABILITIES: 'dias_eafit_availabilities',
  ATTENDANCES: 'dias_eafit_attendances',
  FUNCTIONS: 'dias_eafit_functions',
  REQUIREMENTS: 'dias_eafit_shift_requirements',
  EVENTS: 'dias_eafit_events',
  SHIFTS: 'dias_eafit_shifts',
  BASES: 'dias_eafit_bases',
};

const keyToCollection: Record<string, string> = {
  [STORAGE_KEYS.PEOPLE]: 'people',
  [STORAGE_KEYS.ASSIGNMENTS]: 'assignments',
  [STORAGE_KEYS.AVAILABILITIES]: 'availabilities',
  [STORAGE_KEYS.ATTENDANCES]: 'attendances',
  [STORAGE_KEYS.FUNCTIONS]: 'functions',
  [STORAGE_KEYS.REQUIREMENTS]: 'requirements',
  [STORAGE_KEYS.EVENTS]: 'events',
  [STORAGE_KEYS.SHIFTS]: 'shifts',
  [STORAGE_KEYS.BASES]: 'bases',
};

export async function migrateLocalStorageToFirestore(): Promise<{ success: boolean; message: string }> {
  if (!isConfigured || !db) {
    return { success: false, message: 'Firebase no está configurado. Revisa tus variables de entorno.' };
  }

  try {
    let totalMigrated = 0;
    
    for (const [storageKey, collectionName] of Object.entries(keyToCollection)) {
      const rawData = localStorage.getItem(storageKey);
      if (rawData) {
        const dataArray: any[] = JSON.parse(rawData);
        if (Array.isArray(dataArray) && dataArray.length > 0) {
          for (const item of dataArray) {
            const docId = item.id ? String(item.id) : `migrated_${Date.now()}_${Math.random().toString(36).substring(2,5)}`;
            await setDoc(doc(db, collectionName, docId), { ...item, id: docId });
            totalMigrated++;
          }
        }
      }
    }

    return { success: true, message: `Se migraron exitosamente ${totalMigrated} registros a Firestore.` };
  } catch (error: any) {
    console.error('Migration error:', error);
    return { success: false, message: `Error durante la migración: ${error.message}` };
  }
}
