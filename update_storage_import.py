import re

with open('src/services/storageService.ts', 'r') as f:
    code = f.read()

import_logic = """
import { writeBatch } from 'firebase/firestore';
import { ExcelImportRow } from './excelService';

export interface ImportBatchResult {
  added: number;
  updated: number;
  skipped: number;
  error?: string;
}

export async function importMasterExcelBatch(
  rows: ExcelImportRow[],
  options: { updateExisting: boolean }
): Promise<ImportBatchResult> {
  if (!isConfigured || !db) throw new Error('Firebase no configurado');
  
  const batch = writeBatch(db);
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.isValid) continue;

    if (row.isExistingDuplicate && !options.updateExisting) {
      skipped++;
      continue;
    }

    // 1. Person Data
    // We try to find existing person by cedula to reuse their ID, otherwise create new ID
    let personId = `person_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const existingP = peopleCache.find(p => p.documentId === row.cedula || p.username === row.usuario);
    if (existingP) {
      personId = existingP.id;
      updated++;
    } else {
      added++;
    }

    const personData = {
      id: personId,
      name: row.nombre,
      documentId: row.cedula,
      username: row.usuario || row.cedula,
      email: row.correo,
      phone: row.celular,
      epikId: row.epikId,
      primaryType: row.tipo,
      gtTeams: row.gt,
      shirtSize: row.talla as any,
      createdAt: existingP ? existingP.createdAt : new Date().toISOString(),
    };

    // Use setDoc with merge:true equivalent in batch
    batch.set(doc(db, 'people', personId), personData, { merge: true });

    // 2. Availability Data
    for (const avail of row.availabilities) {
      const availId = `${personId}_${avail.dayId}`;
      const existingAvail = availabilityCache.find(a => a.personId === personId && a.dayId === avail.dayId);
      
      const availData = {
        id: existingAvail ? existingAvail.id : availId,
        personId,
        dayId: avail.dayId,
        shiftIds: avail.shiftIds, // this merges/updates the selected shifts
        updatedAt: new Date().toISOString(),
      };
      
      batch.set(doc(db, 'availabilities', availData.id), availData, { merge: true });
    }
  }

  await batch.commit();
  return { added, updated, skipped };
}
"""

if 'importMasterExcelBatch' not in code:
    with open('src/services/storageService.ts', 'a') as f:
        f.write('\\n' + import_logic)

