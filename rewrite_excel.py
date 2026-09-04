code = """import * as XLSX from 'xlsx';
import { Person, PersonType, ConfigurableShift } from '../types';

export interface ParsedAvailability {
  dayId: string;
  shiftIds: string[];
}

export interface ExcelImportRow {
  rowNumber: number;
  nombre: string;
  correo: string;
  celular: string;
  cedula: string;
  usuario: string;
  epikId: string;
  tipo: PersonType;
  gt: string[];
  talla: string;
  availabilities: ParsedAvailability[];
  isValid: boolean;
  isExistingDuplicate: boolean;
  errors: string[];
}

export interface ExcelImportPreview {
  totalRows: number;
  validRows: number;
  errorRows: number;
  existingDuplicatesCount: number;
  rows: ExcelImportRow[];
}

const cleanVal = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val).trim();
};

const DAY_MAPPINGS: Record<string, string> = {
  'the show lunes 28 de septiembre': 'lunes',
  'the zone martes 29 de septiembre': 'martes',
  'carnival miercoles 30 de septiembre': 'miercoles',
  'the games jueves 1 de octubre': 'jueves',
  'the games viernes 2 de octubre': 'viernes'
};

function determineType(gtArray: string[]): PersonType {
  const gtNames = ['generales', 'logistica', 'rrpp', 'gh', 'mercadeo', 'seguridad', 'carnival', 'the games', 'logística'];
  for (const g of gtArray) {
    if (gtNames.includes(g.toLowerCase())) {
      return 'GT';
    }
    if (g.toLowerCase().includes('apoyo') || g.toLowerCase().includes('gap')) {
      return 'GAP';
    }
    if (g.toLowerCase().includes('mesa')) {
      return 'MESA';
    }
  }
  return 'GT'; // Default if none matched
}

function parseShifts(cellValue: string, dayId: string, existingShifts: ConfigurableShift[], personType: PersonType): string[] {
  if (!cellValue) return [];
  const parts = cellValue.split(/[,\\/\\+]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  const matchedIds = new Set<string>();
  
  const dayShifts = existingShifts.filter(s => s.dayId === dayId && (s.category === personType || s.category === 'MESA'));
  
  for (const part of parts) {
    // Try exact name match
    let match = dayShifts.find(s => s.name.toLowerCase() === part);
    // Try label include match
    if (!match) match = dayShifts.find(s => s.label.toLowerCase().includes(part));
    // Try partial name match (e.g. "T1" matches "T1 (Logistica)")
    if (!match) match = dayShifts.find(s => s.name.toLowerCase().includes(part) || part.includes(s.name.toLowerCase()));
    
    if (match) {
      matchedIds.add(match.id);
    }
  }
  return Array.from(matchedIds);
}

export async function parseExcelFile(
  file: File,
  existingPeople: Person[],
  existingShifts: ConfigurableShift[]
): Promise<ExcelImportPreview> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const rows: ExcelImportRow[] = [];
  const existingCedulas = new Set(existingPeople.map((p) => p.documentId.trim()));
  const existingUsuarios = new Set(existingPeople.filter((p) => p.username).map((p) => p.username!.trim().toLowerCase()));

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2;
    const errors: string[] = [];
    
    // Exact mapping based on standard headers, but tolerant to casing/spaces
    let nombre = '', celular = '', cedula = '', correo = '', epikId = '', gtStr = '', talla = '';
    const dayData: Record<string, string> = {};

    for (const [key, val] of Object.entries(rawRow)) {
      const k = key.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();
      const v = cleanVal(val);
      
      if (k.includes('nombre')) nombre = v;
      else if (k.includes('celular') || k.includes('telefono')) celular = v;
      else if (k.includes('documento') || k.includes('cedula')) cedula = v;
      else if (k.includes('correo')) correo = v;
      else if (k.includes('epik')) epikId = v;
      else if (k.includes('gt perteneces') || k === 'gt') gtStr = v;
      else if (k.includes('talla') || k.includes('camiseta')) talla = v.toUpperCase();
      else {
        // Check if it's a day column
        for (const [dayHeader, dId] of Object.entries(DAY_MAPPINGS)) {
          if (k.includes(dayHeader) || dayHeader.includes(k) || (k.includes(dId) && k.length > 3)) {
            dayData[dId] = v;
            break;
          }
        }
      }
    }

    if (!nombre) errors.push('Nombre es obligatorio.');
    cedula = cedula.replace(/\\D/g, '');
    if (!cedula) errors.push('Documento de identidad (cédula) es obligatorio.');

    const nameParts = nombre.toLowerCase().split(/\\s+/);
    const usuario = nameParts[0] + (nameParts[1] ? nameParts[1][0] : '') + (cedula.slice(-3) || '');
    if (!correo) correo = `${usuario}@eafit.edu.co`;

    const gtArray = gtStr.split(/[,\\/]/).map(s => s.trim()).filter(Boolean);
    const tipo = determineType(gtArray);

    const isExistingDuplicate = existingCedulas.has(cedula) || existingUsuarios.has(usuario);

    const availabilities: ParsedAvailability[] = [];
    for (const dId of ['lunes', 'martes', 'miercoles', 'jueves', 'viernes']) {
      if (dayData[dId]) {
        const shifts = parseShifts(dayData[dId], dId, existingShifts, tipo);
        if (shifts.length > 0) {
          availabilities.push({ dayId: dId, shiftIds: shifts });
        } else if (dayData[dId].trim().length > 0) {
          errors.push(`No se pudieron detectar turnos válidos para el ${dId} ("${dayData[dId]}").`);
        }
      }
    }

    rows.push({
      rowNumber, nombre, correo, celular, cedula, usuario, epikId, tipo, gt: gtArray, talla, availabilities,
      isValid: errors.length === 0,
      isExistingDuplicate,
      errors,
    });
  });

  return {
    totalRows: rows.length,
    validRows: rows.filter(r => r.isValid).length,
    errorRows: rows.filter(r => !r.isValid).length,
    existingDuplicatesCount: rows.filter(r => r.isExistingDuplicate).length,
    rows,
  };
}

export function downloadExcelTemplate(): void {
  const templateData = [{
    'Nombre': 'Aleja Pérez',
    'Número de celular': '3000000000',
    'Documento de identidad': '123456789',
    'Correo institucional': 'aleja@eafit.edu.co',
    'ID de EPIK': 'EPIK123',
    '¿A que GT perteneces?': 'Logística, Seguridad',
    'Talla de camiseta': 'M',
    'THE SHOW LUNES 28 de septiembre': 'T1, T3',
    'THE ZONE MARTES 29 de septiembre': 'T2',
    'CARNIVAL MIERCOLES 30 de septiembre': 'T1, T5',
    'THE GAMES JUEVES 1 de octubre': 'T2',
    'THE GAMES VIERNES 2 de octubre': 'T1'
  }];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Maestro DÍAS');
  XLSX.writeFile(workbook, 'Plantilla_Maestro_DIAS_2026.xlsx');
}

export function exportPeopleToExcel(people: Person[]): void {
  const exportData = people.map((p, idx) => ({
    N: idx + 1,
    'Nombre': p.name,
    'Documento': p.documentId,
    'Usuario': p.username || p.documentId,
    'Correo': p.email,
    'Celular': p.phone || '',
    'ID de EPIK': p.epikId || '',
    'Tipo': p.primaryType,
    'GT': (p.gtTeams || []).join(', '),
    'Talla de camiseta': p.shirtSize || 'M',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Directorio DÍAS');
  XLSX.writeFile(workbook, `Personas_DIAS_EAFIT_${new Date().toISOString().split('T')[0]}.xlsx`);
}
"""

with open('src/services/excelService.ts', 'w') as f:
    f.write(code)

