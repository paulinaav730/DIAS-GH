import re

with open('src/components/ConfigView.tsx', 'r') as f:
    code = f.read()

# Add import for DEFAULT_INITIAL_SHIFTS
if 'DEFAULT_INITIAL_SHIFTS' not in code:
    code = code.replace("import { AppEvent, ConfigurableShift, ConfigurableBase, GroupFunction, PersonType } from '../types';", "import { AppEvent, ConfigurableShift, ConfigurableBase, GroupFunction, PersonType } from '../types';\nimport { DEFAULT_INITIAL_SHIFTS } from '../data/eventStructure';")

# Add the seeding function
seed_func = """
  const handleSeedShifts = async () => {
    if (!window.confirm('¿Deseas cargar los turnos base por defecto a la base de datos?')) return;
    try {
      for (const shift of DEFAULT_INITIAL_SHIFTS) {
        await saveShift({
          id: shift.id,
          name: shift.name,
          dayId: shift.dayId,
          eventId: shift.eventId || 'the-show',
          category: shift.category as any,
          startTime: shift.startTime,
          endTime: shift.endTime,
          capacity: shift.defaultCapacity || 20,
          label: shift.label,
          hasBases: shift.hasBases
        } as any);
      }
      alert('Turnos base cargados exitosamente.');
    } catch (error: any) {
      alert('Error al cargar turnos: ' + error.message);
    }
  };
"""

if 'handleSeedShifts' not in code:
    code = code.replace("const handleMigration = async () => {", seed_func + "\n  const handleMigration = async () => {")

# Add the button
button_code = """          <button
            onClick={handleSeedShifts}
            className="px-4 py-2 bg-[#64748B] hover:bg-[#475569] text-white rounded-xl text-sm font-bold font-dalek tracking-wider shadow-sm transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Cargar Turnos Base
          </button>
          <button
            onClick={() => handleEdit()}"""

code = code.replace("""          <button
            onClick={() => handleEdit()}""", button_code)

with open('src/components/ConfigView.tsx', 'w') as f:
    f.write(code)

