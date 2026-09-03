import * as XLSX from 'xlsx';
import { Person, PersonType } from '../types';

export interface ExcelImportRow {
  rowNumber: number;
  nombre: string;
  correo: string;
  celular: string;
  cedula: string;
  usuario: string;
  tipo: PersonType | '';
  gt: string;
  funciones: string;
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

// Clean string helper
const cleanVal = (val: any): string => {
  if (val === undefined || val === null) return '';
  return String(val).trim();
};

/**
 * Normalizes user provided headers to standard fields
 */
function normalizeRowKeys(row: Record<string, any>): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    if (cleanKey.includes('nombre') || cleanKey === 'name') {
      normalized.nombre = cleanVal(value);
    } else if (cleanKey.includes('correo') || cleanKey.includes('mail')) {
      normalized.correo = cleanVal(value);
    } else if (cleanKey.includes('celular') || cleanKey.includes('telefono') || cleanKey.includes('phone') || cleanKey.includes('movil')) {
      normalized.celular = cleanVal(value);
    } else if (cleanKey.includes('cedula') || cleanKey.includes('documento') || cleanKey.includes('doc') || cleanKey.includes('identificacion')) {
      normalized.cedula = cleanVal(value);
    } else if (cleanKey.includes('usuario') || cleanKey.includes('user') || cleanKey.includes('username')) {
      normalized.usuario = cleanVal(value);
    } else if (cleanKey.includes('tipo') || cleanKey.includes('type') || cleanKey.includes('categoria')) {
      normalized.tipo = cleanVal(value).toUpperCase();
    } else if (cleanKey === 'gt' || cleanKey.includes('equipo') || cleanKey.includes('gtteam')) {
      normalized.gt = cleanVal(value);
    } else if (cleanKey.includes('funcion') || cleanKey.includes('rol') || cleanKey.includes('role')) {
      normalized.funciones = cleanVal(value);
    }
  }
  return normalized;
}

/**
 * Parses file and validates rows against business rules & existing database records
 */
export async function parseExcelFile(
  file: File,
  existingPeople: Person[]
): Promise<ExcelImportPreview> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  const rows: ExcelImportRow[] = [];
  const seenCedulasInFile = new Set<string>();
  const seenUsuariosInFile = new Set<string>();

  const existingCedulas = new Set(existingPeople.map((p) => p.documentId.trim()));
  const existingUsuarios = new Set(
    existingPeople.filter((p) => p.username).map((p) => p.username!.trim().toLowerCase())
  );
  const existingEmails = new Set(existingPeople.map((p) => p.email.trim().toLowerCase()));

  rawRows.forEach((rawRow, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const norm = normalizeRowKeys(rawRow);

    const errors: string[] = [];

    // Required fields check
    const nombre = norm.nombre || '';
    if (!nombre) {
      errors.push('Nombre es obligatorio.');
    }

    const cedula = norm.cedula ? norm.cedula.replace(/\D/g, '') || norm.cedula : '';
    if (!cedula) {
      errors.push('Cédula es obligatoria.');
    }

    // Default username if not provided
    let usuario = norm.usuario ? norm.usuario.toLowerCase().trim() : '';
    if (!usuario && nombre) {
      // Auto-generate a sensible username from name
      const nameParts = nombre.toLowerCase().split(/\s+/);
      usuario = nameParts[0] + (nameParts[1] ? nameParts[1][0] : '') + (cedula.slice(-3) || '');
    }

    const correo = norm.correo || (usuario ? `${usuario}@eafit.edu.co` : '');
    const celular = norm.celular || '';

    // Validate type
    let tipo: PersonType | '' = '';
    const rawTipo = norm.tipo ? norm.tipo.toUpperCase() : 'GT';
    if (rawTipo.includes('GT')) tipo = 'GT';
    else if (rawTipo.includes('GAP')) tipo = 'GAP';
    else if (rawTipo.includes('MESA')) tipo = 'MESA';
    else {
      errors.push(`Tipo inválido: "${norm.tipo}". Debe ser GT, GAP o MESA.`);
    }

    // In-file duplicates check
    if (cedula && seenCedulasInFile.has(cedula)) {
      errors.push(`Cédula ${cedula} repetida en este archivo.`);
    } else if (cedula) {
      seenCedulasInFile.add(cedula);
    }

    if (usuario && seenUsuariosInFile.has(usuario)) {
      errors.push(`Usuario "${usuario}" repetido en este archivo.`);
    } else if (usuario) {
      seenUsuariosInFile.add(usuario);
    }

    // Existing database check
    let isExistingDuplicate = false;
    if (cedula && existingCedulas.has(cedula)) {
      isExistingDuplicate = true;
    } else if (usuario && existingUsuarios.has(usuario)) {
      isExistingDuplicate = true;
    }

    rows.push({
      rowNumber,
      nombre,
      correo,
      celular,
      cedula,
      usuario,
      tipo,
      gt: norm.gt || '',
      funciones: norm.funciones || '',
      isValid: errors.length === 0,
      isExistingDuplicate,
      errors,
    });
  });

  const validRows = rows.filter((r) => r.isValid).length;
  const errorRows = rows.filter((r) => !r.isValid).length;
  const existingDuplicatesCount = rows.filter((r) => r.isExistingDuplicate).length;

  return {
    totalRows: rows.length,
    validRows,
    errorRows,
    existingDuplicatesCount,
    rows,
  };
}

/**
 * Downloads a pre-formatted Excel template for easy filling
 */
export function downloadExcelTemplate(): void {
  const templateData = [
    {
      Nombre: 'Aleja Pérez',
      Correo: 'aleja.perez@eafit.edu.co',
      Celular: '3001234567',
      Cédula: '1234567890',
      Usuario: 'alejaperez',
      Tipo: 'GT',
      GT: 'Generales, Montaje',
      Funciones: 'Montaje, Coordinación',
    },
    {
      Nombre: 'Juan Camilo Gómez',
      Correo: 'juan.gomez@eafit.edu.co',
      Celular: '3017654321',
      Cédula: '9876543210',
      Usuario: 'juangomez',
      Tipo: 'GAP',
      GT: '',
      Funciones: 'Líder de Base, Apoyo',
    },
    {
      Nombre: 'María José Vélez',
      Correo: 'maria.velez@eafit.edu.co',
      Celular: '3029876543',
      Cédula: '1020304050',
      Usuario: 'mariavelez',
      Tipo: 'MESA',
      GT: '',
      Funciones: 'Apoyo Operativo, Registro',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Plantilla Personas DÍAS');

  XLSX.writeFile(workbook, 'Plantilla_Personas_DIAS_EAFIT_2026.xlsx');
}

/**
 * Exports current directory of people to Excel
 */
export function exportPeopleToExcel(people: Person[]): void {
  const exportData = people.map((p, idx) => ({
    N: idx + 1,
    Nombre: p.name,
    Documento: p.documentId,
    Usuario: p.username || p.documentId,
    Correo: p.email,
    Celular: p.phone || '',
    Tipo: p.primaryType,
    GT: (p.gtTeams || []).join(', '),
    Funciones: (p.functions || []).join(', '),
    Rol: p.roleTitle || 'Staff',
    Camiseta: p.shirtSize || 'M',
    Alimentacion: p.dietaryRestrictions || 'Ninguna',
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Directorio DÍAS');

  XLSX.writeFile(workbook, `Personas_DIAS_EAFIT_${new Date().toISOString().split('T')[0]}.xlsx`);
}
