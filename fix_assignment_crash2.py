with open('src/components/AssignmentView.tsx', 'r') as f:
    code = f.read()

target = """  const activeShift =
    availableShifts.find((s) => s?.id === selectedShiftId) || availableShifts[0];

  // Determine physical bases for current day & category"""

replacement = """  const activeShift =
    availableShifts.find((s) => s?.id === selectedShiftId) || availableShifts[0];

  if (!activeShift) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-full text-center space-y-4">
        <h2 className="text-xl font-bold text-[#182535]">No hay turnos disponibles</h2>
        <p className="text-[#64748B]">No se encontraron turnos configurados para este día. Por favor, asegúrate de crear los turnos en la pestaña de Configuración.</p>
      </div>
    );
  }

  // Determine physical bases for current day & category"""

code = code.replace(target, replacement)

with open('src/components/AssignmentView.tsx', 'w') as f:
    f.write(code)
