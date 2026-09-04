import re

with open('src/components/ExcelImportModal.tsx', 'r') as f:
    code = f.read()

# We need to fix the try-catch mess inside handleFileChange and handleConfirmImport
code = code.replace("""    try {
      const result = await importMasterExcelBatch(preview.rows, { updateExisting });
      setImportResult(result);
      if (onImportComplete) onImportComplete();
    } catch (err) {
      console.error('Error importing master batch:', err);
      alert('Hubo un error al guardar los datos.');
    } finally { catch (err) {
      console.error('Error importing people batch:', err);
      alert('Hubo un error al guardar las personas.');
    } finally {
      setIsConfirming(false);
    }""", """    try {
      const parsedPreview = await parseExcelFile(selectedFile, existingPeople, existingShifts);
      setPreview(parsedPreview);
    } catch (err) {
      console.error('Error parsing excel file:', err);
      alert('Error al leer el archivo Excel. Asegúrate de que sea un archivo .xlsx, .xls o .csv válido.');
      setFile(null);
      setPreview(null);
    } finally {
      setIsLoading(false);
    }""")

code = code.replace("""  const handleConfirmImport = async () => {
    if (!preview) return;

    setIsConfirming(true);
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
  };""", """  const handleConfirmImport = async () => {
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
  };""")

code = code.replace("""export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingPeople,
  onImportComplete,
}) => {""", """export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingPeople,
  existingShifts,
  onImportComplete,
}) => {""")

with open('src/components/ExcelImportModal.tsx', 'w') as f:
    f.write(code)

