import re

with open('src/components/ConfigView.tsx', 'r') as f:
    code = f.read()

imports = """import { AppEvent, ConfigurableShift, ConfigurableBase, GroupFunction, PersonType } from '../types';
import { migrateLocalStorageToFirestore } from '../services/migrationService';
import { subscribeToShifts, saveShift, deleteShift } from '../services/storageService';
"""
code = code.replace("import { AppEvent, ConfigurableShift, ConfigurableBase, GroupFunction, PersonType } from '../types';\\nimport { migrateLocalStorageToFirestore } from '../services/migrationService';", imports)

logic_start = """export function ConfigView() {
  const [activeTab, setActiveTab] = useState<'events' | 'shifts' | 'bases' | 'functions'>('events');
  const [isMigrating, setIsMigrating] = useState(false);
  const [shifts, setShifts] = useState<ConfigurableShift[]>([]);
  
  React.useEffect(() => {
    const unsub = subscribeToShifts(setShifts);
    return () => unsub();
  }, []);

  const [newShiftName, setNewShiftName] = useState('');
  const [newShiftDay, setNewShiftDay] = useState('lunes');
  
  const handleAddShift = async () => {
    if (!newShiftName) return;
    await saveShift({
      id: `shift_${Date.now()}`,
      name: newShiftName,
      dayId: newShiftDay,
      eventId: 'the-show',
      category: 'GT',
      startTime: '08:00',
      endTime: '10:00',
      label: newShiftName,
      capacity: 10,
      forTypes: ['GT']
    });
    setNewShiftName('');
  };
"""
code = code.replace("""export function ConfigView() {
  const [activeTab, setActiveTab] = useState<'events' | 'shifts' | 'bases' | 'functions'>('events');
  const [isMigrating, setIsMigrating] = useState(false);""", logic_start)

placeholder = """        {/* Placeholder for CRUD lists */}
        <div className="bg-[#F8F9FA] rounded-2xl p-8 text-center text-[#64748B] border border-[#E2E8F0] border-dashed">
          Módulo de gestión de {activeTab} en construcción.
          <br/>
          (Aquí se implementarán los listados CRUD con formularios modales para crear/editar registros en Firestore).
        </div>"""

shifts_ui = """        {activeTab === 'shifts' ? (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <input 
                type="text" 
                value={newShiftName} 
                onChange={e => setNewShiftName(e.target.value)} 
                placeholder="Nombre del turno (ej. T1)" 
                className="px-3 py-2 border rounded-xl"
              />
              <select value={newShiftDay} onChange={e => setNewShiftDay(e.target.value)} className="px-3 py-2 border rounded-xl">
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
              </select>
              <button onClick={handleAddShift} className="px-4 py-2 bg-green-600 text-white rounded-xl">Agregar Turno</button>
            </div>
            
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Nombre</th>
                  <th className="py-2">Día</th>
                  <th className="py-2">Tipo</th>
                  <th className="py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {shifts.map(shift => (
                  <tr key={shift.id} className="border-b">
                    <td className="py-2">{shift.name}</td>
                    <td className="py-2">{shift.dayId}</td>
                    <td className="py-2">{shift.category}</td>
                    <td className="py-2">
                      <button onClick={() => deleteShift(shift.id)} className="text-red-500 hover:text-red-700">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#F8F9FA] rounded-2xl p-8 text-center text-[#64748B] border border-[#E2E8F0] border-dashed">
            Módulo de gestión de {activeTab} en construcción.
            <br/>
            (Aquí se implementarán los listados CRUD con formularios modales para crear/editar registros en Firestore).
          </div>
        )}"""

code = code.replace(placeholder, shifts_ui)

with open('src/components/ConfigView.tsx', 'w') as f:
    f.write(code)

