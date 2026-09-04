import React, { useState, useRef } from 'react';
import { Person, PersonType, ConfigurableShift } from '../types';
import {
  parseExcelFile,
  downloadExcelTemplate,
  ExcelImportPreview,
  ExcelImportRow,
} from '../services/excelService';
import { importMasterExcelBatch, ImportBatchResult } from '../services/storageService';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  X,
  Download,
  Check,
  RefreshCw,
  Users,
} from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingPeople: Person[];
  existingShifts: ConfigurableShift[];
  onImportComplete?: () => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingPeople,
  existingShifts,
  onImportComplete,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ExcelImportPreview | null>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [importResult, setImportResult] = useState<ImportBatchResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (selectedFile: File) => {
    setFile(selectedFile);
    setIsLoading(true);
    setImportResult(null);

    try {
      const parsedPreview = await parseExcelFile(selectedFile, existingPeople, existingShifts);
      setPreview(parsedPreview);
    } catch (err) {
      console.error('Error parsing excel file:', err);
      alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo .xlsx, .xls o .csv válido.');
      setFile(null);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    setIsConfirming(true);
    try {
      const result = await importMasterExcelBatch(preview.rows, { updateExisting });
      setImportResult(result);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      console.error('Error importing master batch:', err);
      alert('Hubo un error al guardar los datos.');
    } finally {
      setIsConfirming(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setImportResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFDF8] border-2 border-[#EADDC7] rounded-3xl w-full max-w-4xl p-5 sm:p-8 shadow-2xl relative my-6 text-[#182535] animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-[#64748B] hover:text-[#182535] hover:bg-[#F3EEDC] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3.5 mb-6 border-b border-[#EADDC7] pb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF8EC] border border-[#E5A12E]/40 flex items-center justify-center text-[#C87F17] shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#C87F17] tracking-wider font-montserrat">
              EXCEL MAESTRO • DÍAS EAFIT
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[#182535] font-dalek tracking-wider">
              IMPORTAR EXCEL MAESTRO (PERSONAS Y DISPONIBILIDAD)
            </h2>
            <p className="text-xs text-[#64748B] font-montserrat mt-0.5">
              Sube tu Excel Maestro. Se crearán o actualizarán personas y su disponibilidad por turnos sin borrar asignaciones previas.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-6">
          {/* Step 1: File Dropzone (if no preview yet) */}
          {!preview && !importResult && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#D5CCA8] hover:border-[#B83A24] bg-[#FBF8EE] rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                />

                <div className="w-16 h-16 rounded-3xl bg-[#FEF8EC] text-[#C87F17] group-hover:scale-105 group-hover:text-[#B83A24] flex items-center justify-center mb-3 transition-transform shadow-2xs">
                  <UploadCloud className="w-8 h-8" />
                </div>

                <p className="font-dalek text-lg sm:text-xl text-[#182535] tracking-wide">
                  ARRASTRA TU ARCHIVO AQUÍ O HAZ CLIC PARA SELECCIONAR
                </p>
                <p className="text-xs text-[#64748B] font-montserrat mt-1 max-w-md">
                  Formatos compatibles: .xlsx, .xls, .csv. Utiliza la plantilla oficial con las 12 columnas requeridas.
                </p>

                {isLoading && (
                  <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#C87F17]">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analizando planilla y validando registros...</span>
                  </div>
                )}
              </div>

              {/* Template Download Section */}
              <div className="bg-[#FAF6EC] border border-[#E5DAC0] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-[#C87F17] shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-[#182535] font-montserrat">
                      ¿Necesitas el formato oficial?
                    </h4>
                    <p className="text-[11px] text-[#64748B] font-montserrat">
                      Descarga nuestra plantilla de ejemplo con las columnas exactas para GT, GAP y MESA.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={downloadExcelTemplate}
                  className="px-4 py-2 rounded-xl bg-[#FFFDF8] hover:bg-[#F3EEDC] text-[#C87F17] border border-[#E5A12E]/40 font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla Excel</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Validation Results */}
          {preview && !importResult && (
            <div className="space-y-4">
              {/* Summary Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total */}
                <div className="bg-[#FAF6EC] border border-[#E5DAC0] rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-[#64748B] font-montserrat uppercase">
                    Total Encontrados
                  </span>
                  <div className="text-2xl font-extrabold text-[#182535] font-montserrat mt-0.5">
                    {preview.totalRows}
                  </div>
                  <span className="text-[10px] text-[#64748B]">en el archivo subido</span>
                </div>

                {/* Válidos */}
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-[#16A34A] font-montserrat uppercase">
                    Correctos
                  </span>
                  <div className="text-2xl font-extrabold text-[#16A34A] font-montserrat mt-0.5">
                    {preview.validRows}
                  </div>
                  <span className="text-[10px] text-[#16A34A]">listos para guardar</span>
                </div>

                {/* Ya Registrados */}
                <div className="bg-[#FEF8EC] border border-[#FDE68A] rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-[#C87F17] font-montserrat uppercase">
                    Ya Registrados
                  </span>
                  <div className="text-2xl font-extrabold text-[#C87F17] font-montserrat mt-0.5">
                    {preview.existingDuplicatesCount}
                  </div>
                  <span className="text-[10px] text-[#C87F17]">cédula o usuario existente</span>
                </div>

                {/* Errores */}
                <div className="bg-[#FDF2EE] border border-[#F6C7BA] rounded-2xl p-3.5">
                  <span className="text-[10px] font-bold text-[#B83A24] font-montserrat uppercase">
                    Con Errores
                  </span>
                  <div className="text-2xl font-extrabold text-[#B83A24] font-montserrat mt-0.5">
                    {preview.errorRows}
                  </div>
                  <span className="text-[10px] text-[#B83A24]">no se importarán</span>
                </div>
              </div>

              {/* Duplicate Handling Toggle */}
              {preview.existingDuplicatesCount > 0 && (
                <div className="bg-[#FEF8EC] border border-[#FDE68A] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#C87F17] shrink-0" />
                    <span className="text-[#182535] font-medium font-montserrat">
                      Se detectaron <b>{preview.existingDuplicatesCount} personas</b> que ya están en la base de datos.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setUpdateExisting(false)}
                      className={`px-3 py-1.5 rounded-xl font-bold font-montserrat transition-all ${
                        !updateExisting
                          ? 'bg-[#B83A24] text-white shadow-xs'
                          : 'bg-[#FFFDF8] text-[#64748B] border border-[#EADDC7]'
                      }`}
                    >
                      Omitir existentes
                    </button>
                    <button
                      type="button"
                      onClick={() => setUpdateExisting(true)}
                      className={`px-3 py-1.5 rounded-xl font-bold font-montserrat transition-all ${
                        updateExisting
                          ? 'bg-[#B83A24] text-white shadow-xs'
                          : 'bg-[#FFFDF8] text-[#64748B] border border-[#EADDC7]'
                      }`}
                    >
                      Actualizar datos
                    </button>
                  </div>
                </div>
              )}

              {/* Table Preview */}
              <div className="border border-[#EADDC7] rounded-2xl overflow-hidden bg-[#FFFDF8]">
                <div className="p-3 bg-[#FAF6EC] border-b border-[#EADDC7] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#182535] font-dalek tracking-wider">
                    PREVISUALIZACIÓN DE REGISTROS ({preview.rows.length})
                  </span>
                  <span className="text-[11px] text-[#64748B]">
                    Archivo: <b>{file?.name}</b>
                  </span>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF6EC] text-[#64748B] font-bold border-b border-[#EADDC7] sticky top-0">
                      <tr>
                        <th className="p-2.5">Fila</th>
                        <th className="p-2.5">Estado</th>
                        <th className="p-2.5">Nombre</th>
                        <th className="p-2.5">Cédula</th>
                        <th className="p-2.5">Usuario</th>
                        <th className="p-2.5">Tipo</th>
                        <th className="p-2.5">GT / EPIK</th>
                        <th className="p-2.5">Disponibilidad</th>
                        <th className="p-2.5">Detalle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EADDC7]/60">
                      {preview.rows.map((row) => (
                        <tr
                          key={row.rowNumber}
                          className={`hover:bg-[#F8F4EA] transition-colors ${
                            !row.isValid
                              ? 'bg-rose-50/40 text-rose-950'
                              : row.isExistingDuplicate
                              ? 'bg-amber-50/30'
                              : ''
                          }`}
                        >
                          <td className="p-2.5 font-mono text-[11px] text-[#64748B]">#{row.rowNumber}</td>
                          <td className="p-2.5">
                            {!row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FDF2EE] text-[#B83A24] font-bold text-[10px] border border-[#F6C7BA]">
                                <AlertCircle className="w-3 h-3" /> Error
                              </span>
                            ) : row.isExistingDuplicate ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FEF8EC] text-[#C87F17] font-bold text-[10px] border border-[#FDE68A]">
                                <AlertTriangle className="w-3 h-3" /> Registrada
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F0FDF4] text-[#16A34A] font-bold text-[10px] border border-[#BBF7D0]">
                                <Check className="w-3 h-3" /> Correcto
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 font-bold text-[#182535]">{row.nombre || '—'}</td>
                          <td className="p-2.5 font-mono text-[#334155]">{row.cedula || '—'}</td>
                          <td className="p-2.5 font-mono text-[#334155]">{row.usuario || '—'}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                                row.tipo === 'GT'
                                  ? 'bg-[#FDF2EE] text-[#B83A24]'
                                  : row.tipo === 'GAP'
                                  ? 'bg-[#FEF8EC] text-[#C87F17]'
                                  : 'bg-purple-50 text-purple-700'
                              }`}
                            >
                              {row.tipo || 'INVÁLIDO'}
                            </span>
                          </td>
                          <td className="p-2.5 text-[#64748B] text-[11px]">
                            <div className="font-bold">{row.gt?.join(', ') || '—'}</div>
                            <div>{row.epikId || 'Sin EPIK'}</div>
                          </td>
                          <td className="p-2.5 text-[11px] text-[#334155]">
                            {row.availabilities && row.availabilities.length > 0 ? (
                              <div className="flex flex-col gap-0.5">
                                {row.availabilities.map(a => (
                                  <span key={a.dayId} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md text-[9px] font-bold">
                                    {a.dayId.toUpperCase()}: {a.shiftIds.length} turnos
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin disp.</span>
                            )}
                          </td>
                          <td className="p-2.5 text-[11px]">
                            {row.errors.length > 0 ? (
                              <span className="text-[#B83A24] font-medium">{row.errors.join('; ')}</span>
                            ) : row.isExistingDuplicate ? (
                              <span className="text-[#C87F17]">
                                {updateExisting ? 'Se actualizará' : 'Se omitirá'}
                              </span>
                            ) : (
                              <span className="text-[#16A34A]">Nuevo registro</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Success Confirmation Screen */}
          {importResult && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#F0FDF4] border-2 border-[#BBF7D0] text-[#16A34A] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h3 className="text-2xl font-extrabold text-[#182535] font-dalek tracking-wide">
                ¡IMPORTACIÓN EXITOSA!
              </h3>

              <div className="max-w-md mx-auto bg-[#FAF6EC] border border-[#E5DAC0] rounded-2xl p-4 text-xs space-y-2 text-[#334155] font-montserrat">
                <div className="flex justify-between">
                  <span>Personas nuevas añadidas:</span>
                  <b className="text-[#16A34A]">{importResult.added}</b>
                </div>
                <div className="flex justify-between">
                  <span>Personas actualizadas:</span>
                  <b className="text-[#C87F17]">{importResult.updated}</b>
                </div>
                <div className="flex justify-between">
                  <span>Personas omitidas (duplicadas):</span>
                  <b className="text-[#64748B]">{importResult.skipped}</b>
                </div>
              </div>

              <p className="text-xs text-[#64748B] font-montserrat">
                Los registros han sido guardados individualmente en el directorio de personal.
              </p>

              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-2xl bg-[#B83A24] hover:bg-[#9E2F1B] text-white font-bold font-dalek tracking-wider shadow-md transition-all"
              >
                CERRAR Y VER PERSONAS
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {preview && !importResult && (
          <div className="pt-4 mt-4 border-t border-[#EADDC7] flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#64748B] hover:bg-[#F3EEDC] transition-colors"
            >
              Cambiar archivo
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#334155] hover:bg-[#F3EEDC] border border-[#EADDC7] transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={preview.validRows === 0 || isConfirming}
                onClick={handleConfirmImport}
                className="px-6 py-2.5 rounded-2xl bg-[#B83A24] hover:bg-[#9E2F1B] disabled:opacity-50 text-white font-bold text-xs font-dalek tracking-wider flex items-center gap-2 shadow-md transition-all"
              >
                {isConfirming ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>GUARDANDO EN FIRESTORE...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>CONFIRMAR IMPORTACIÓN ({preview.validRows})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
