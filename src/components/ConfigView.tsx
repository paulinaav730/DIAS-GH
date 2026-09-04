import React, { useState, useEffect } from 'react';
import { Settings, Calendar, Clock, MapPin, Briefcase, Plus, Edit2, Trash2, Copy, X } from 'lucide-react';
import { AppEvent, ConfigurableShift, ConfigurableBase, GroupFunction, PersonType } from '../types';
import { DEFAULT_INITIAL_SHIFTS } from '../data/eventStructure';
import { migrateLocalStorageToFirestore } from '../services/migrationService';
import { 
  subscribeToShifts, saveShift, deleteShift,
  saveEvent, deleteEvent,
  saveBase, deleteBase,
  saveGroupFunction, updateGroupFunction, deleteGroupFunction
} from '../services/storageService';
import { DEFAULT_INITIAL_EVENTS, DEFAULT_INITIAL_BASES } from '../data/eventStructure';
import { DEFAULT_GROUP_FUNCTIONS } from '../data/functionsCatalog';

interface ConfigViewProps {
  shifts: ConfigurableShift[];
  events: AppEvent[];
  bases: ConfigurableBase[];
  functions: GroupFunction[];
}

export function ConfigView({ shifts, events, bases, functions }: ConfigViewProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'shifts' | 'bases' | 'functions'>('events');
  const [isMigrating, setIsMigrating] = useState(false);


  
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
          capacity: (shift as any).defaultCapacity || 20,
          label: shift.label,
          hasBases: shift.hasBases
        } as any);
      }
      alert('Turnos base cargados exitosamente.');
    } catch (error: any) {
      alert('Error al cargar turnos: ' + error.message);
    }
  };

  const handleMigration = async () => {
    if (window.confirm('¿Estás seguro de migrar los datos locales a Firestore? Esto podría sobreescribir datos existentes en la nube si hay conflictos de ID.')) {
      setIsMigrating(true);
      const res = await migrateLocalStorageToFirestore();
      alert(res.message);
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FFFDF8] border border-[#EADDC7] rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FEF8EC] border border-[#E5A12E]/30 text-[#B83A24] flex items-center justify-center">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-dalek text-[#182535]">Configuración Global</h2>
              <p className="text-sm text-[#64748B] font-montserrat mt-1">
                Administración total de eventos, turnos, bases y funciones.
              </p>
            </div>
          </div>
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className="px-4 py-2 bg-[#182535] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#2F3E53] disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            {isMigrating ? 'Migrando...' : 'Migrar LocalStorage a Firestore'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-4 border-b border-[#EADDC7] no-scrollbar">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'events' ? 'bg-[#182535] text-white' : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <Calendar className="w-4 h-4" />
            Eventos
          </button>
          <button
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'shifts' ? 'bg-[#182535] text-white' : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <Clock className="w-4 h-4" />
            Turnos
          </button>
          <button
            onClick={() => setActiveTab('bases')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'bases' ? 'bg-[#182535] text-white' : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <MapPin className="w-4 h-4" />
            Bases Físicas
          </button>
          <button
            onClick={() => setActiveTab('functions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-colors ${
              activeTab === 'functions' ? 'bg-[#182535] text-white' : 'bg-[#F8F9FA] text-[#64748B] hover:bg-[#E2E8F0]'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Funciones
          </button>
        </div>

        {activeTab === 'events' ? (
          <EventsManager events={events} />
        ) : activeTab === 'shifts' ? (
          <ShiftsManager shifts={shifts} handleSeedShifts={handleSeedShifts} />
        ) : activeTab === 'bases' ? (
          <BasesManager bases={bases} events={events} />
        ) : activeTab === 'functions' ? (
          <FunctionsManager functions={functions} />
        ) : null}
      </div>
    </div>
  );
}

function ShiftsManager({ shifts, handleSeedShifts }: { shifts: ConfigurableShift[], handleSeedShifts: () => void }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ConfigurableShift | null>(null);

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este turno definitivamente?')) {
      await deleteShift(id);
    }
  };

  const handleEdit = (shift: ConfigurableShift) => {
    setEditingShift(shift);
    setIsModalOpen(true);
  };

  const DAY_ORDER = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
  const sortedShifts = [...shifts].sort((a, b) => DAY_ORDER.indexOf(a.dayId) - DAY_ORDER.indexOf(b.dayId));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold font-dalek text-[#182535]">Gestión de Turnos</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSeedShifts}
            className="px-4 py-2 bg-[#64748B] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#475569]"
          >
            <Plus className="w-4 h-4" />
            Cargar Turnos Base
          </button>
          <button
            onClick={() => {
              setEditingShift(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#B83A24] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#9E2F1B]"
          >
            <Plus className="w-4 h-4" />
            Nuevo Turno
          </button>
        </div>
      </div>

      <div className="border border-[#EADDC7] rounded-2xl overflow-hidden bg-[#FFFDF8]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAF6EC] text-[#64748B] font-bold border-b border-[#EADDC7]">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Día</th>
              <th className="p-3">Evento</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Horario</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EADDC7]/60">
            {sortedShifts.map((shift) => (
              <tr key={shift.id} className="hover:bg-[#F8F4EA] transition-colors">
                <td className="p-3 font-bold text-[#182535]">{shift.name}</td>
                <td className="p-3 uppercase text-[#64748B]">{shift.dayId}</td>
                <td className="p-3 text-[#64748B] font-medium">{shift.eventId}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${shift.category === 'GT' ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'}`}>
                    {shift.category}
                  </span>
                </td>
                <td className="p-3 text-[#64748B]">{shift.label} ({shift.startTime} - {shift.endTime})</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(shift)} className="p-1.5 rounded-lg bg-white border hover:bg-gray-50 text-blue-600">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDelete(shift.id)} className="p-1.5 rounded-lg bg-white border hover:bg-red-50 text-red-600">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-400">No hay turnos creados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <ShiftModal
          shift={editingShift}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

function ShiftModal({ shift, onClose }: { shift: ConfigurableShift | null, onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<ConfigurableShift>>(
    shift || {
      name: '',
      dayId: 'lunes',
      eventId: 'the-show',
      category: 'GT',
      startTime: '06:00',
      endTime: '12:00',
      label: '6:00 AM - 12:00 M',
      capacity: 50,
      forTypes: ['GT']
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveShift({
      ...formData,
      id: shift?.id || `shift_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
    } as ConfigurableShift);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-[#FFFDF8] border-2 border-[#EADDC7] rounded-3xl w-full max-w-md p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-800">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-dalek mb-6 text-[#182535]">
          {shift ? 'Editar Turno' : 'Nuevo Turno'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Nombre (ej. T1)</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Día</label>
              <select value={formData.dayId} onChange={e => setFormData({...formData, dayId: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                <option value="lunes">Lunes</option>
                <option value="martes">Martes</option>
                <option value="miercoles">Miércoles</option>
                <option value="jueves">Jueves</option>
                <option value="viernes">Viernes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Evento</label>
              <select value={formData.eventId} onChange={e => setFormData({...formData, eventId: e.target.value})} className="w-full px-3 py-2 border rounded-xl">
                <option value="the-show">The Show (Lunes)</option>
                <option value="the-zone">The Zone (Martes)</option>
                <option value="carnival">Carnival (Miércoles)</option>
                <option value="the-challenge">The Challenge</option>
                <option value="the-games">The Games (Jueves/Viernes)</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Categoría</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as PersonType, forTypes: [e.target.value as PersonType]})} className="w-full px-3 py-2 border rounded-xl">
                <option value="GT">GT</option>
                <option value="GAP">GAP</option>
                <option value="MESA">MESA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Hora Inicio</label>
              <input required type="time" value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Hora Fin</label>
              <input required type="time" value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold mb-1">Etiqueta Visual (ej. 6am - 12m)</label>
              <input required type="text" value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
            </div>
          </div>
          <div className="pt-4 mt-2 border-t flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 rounded-xl font-bold text-sm">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-[#B83A24] text-white rounded-xl font-bold text-sm">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EventsManager({ events }: { events: AppEvent[] }) {
  const handleSeedEvents = async () => {
    if (!window.confirm('¿Deseas cargar los días base oficiales? Esto no borrará los existentes.')) return;
    for (const ev of DEFAULT_INITIAL_EVENTS) {
      await saveEvent(ev as any);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar este evento definitivamente?')) {
      const result = await deleteEvent(id);
      if (!result.success) {
        if (window.confirm(result.warning + '\n\n¿Forzar eliminación?')) {
          await deleteEvent(id, true);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E2E8F0]">
        <div>
          <h3 className="font-bold text-[#182535]">Días de Operación</h3>
          <p className="text-xs text-[#64748B]">Gestiona los días del evento (ej. The Show, Carnival)</p>
        </div>
        <button onClick={handleSeedEvents} className="px-4 py-2 bg-[#64748B] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#475569]">
          <Plus className="w-4 h-4" /> Cargar Días Base
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
        {events.sort((a, b) => a.order - b.order).map(ev => (
          <div key={ev.id} className="p-4 flex items-center justify-between hover:bg-[#F8F9FA] transition-colors">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#182535]">{ev.dayName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#F1F5F9] text-[#475569]">{ev.dayId}</span>
                {ev.isCarnival && <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] font-bold">Carnival Mode</span>}
              </div>
              <p className="text-sm text-[#64748B] font-medium">{ev.name}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(ev.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="p-8 text-center text-[#64748B]">No hay eventos configurados.</div>
        )}
      </div>
    </div>
  );
}

function BasesManager({ bases, events }: { bases: ConfigurableBase[], events: AppEvent[] }) {
  const handleSeedBases = async () => {
    if (!window.confirm('¿Deseas cargar las 30 bases oficiales del Carnival?')) return;
    for (const base of DEFAULT_INITIAL_BASES) {
      await saveBase(base as any);
    }
  };

  const handleDelete = async (id: string | number) => {
    if (window.confirm('¿Eliminar esta base física definitivamente?')) {
      const result = await deleteBase(id);
      if (!result.success) {
        if (window.confirm(result.warning + '\n\n¿Forzar eliminación?')) {
          await deleteBase(id, true);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E2E8F0]">
        <div>
          <h3 className="font-bold text-[#182535]">Bases Físicas</h3>
          <p className="text-xs text-[#64748B]">Gestiona los puntos físicos de operación (ej. Arcade, Speedway)</p>
        </div>
        <button onClick={handleSeedBases} className="px-4 py-2 bg-[#64748B] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#475569]">
          <Plus className="w-4 h-4" /> Cargar Bases del Carnival
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {bases.map(base => {
          const event = events.find(e => e.id === base.eventId);
          return (
            <div key={base.id} className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex flex-col justify-between hover:border-[#CBD5E1]">
              <div>
                <div className="flex justify-between items-start">
                  <span className="font-bold text-[#182535] text-sm">{base.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#F8F9FA] text-[#64748B] border border-[#E2E8F0]">{base.id}</span>
                </div>
                {event && <p className="text-xs text-[#64748B] mt-1">Evento: {event.name}</p>}
                <p className="text-xs text-[#94A3B8] mt-1">Capacidad base: {base.defaultCapacity}</p>
              </div>
              <div className="flex justify-end gap-1 mt-3">
                <button onClick={() => handleDelete(base.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {bases.length === 0 && (
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] text-center text-[#64748B]">
          No hay bases físicas configuradas.
        </div>
      )}
    </div>
  );
}

function FunctionsManager({ functions }: { functions: GroupFunction[] }) {
  const handleSeedFunctions = async () => {
    if (!window.confirm('¿Deseas cargar las funciones de Staff oficiales?')) return;
    for (const fn of DEFAULT_GROUP_FUNCTIONS) {
      // updateGroupFunction uses the same structure or we can just call saveGroupFunction if we had one.
      // Wait, there's no saveGroupFunction, only updateGroupFunction. Let's create an alias if needed, or just use update.
      // Wait, updateGroupFunction requires an id, but the id in DEFAULT_GROUP_FUNCTIONS is present.
      await saveGroupFunction(fn as any);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Eliminar esta función definitivamente?')) {
      const result = await deleteGroupFunction(id);
      if (!result.success) {
        if (window.confirm(result.warning + '\n\n¿Forzar eliminación?')) {
          await deleteGroupFunction(id, true);
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-[#E2E8F0]">
        <div>
          <h3 className="font-bold text-[#182535]">Funciones / Roles</h3>
          <p className="text-xs text-[#64748B]">Gestiona los roles específicos dentro de la operación</p>
        </div>
        <button onClick={handleSeedFunctions} className="px-4 py-2 bg-[#64748B] text-white rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-[#475569]">
          <Plus className="w-4 h-4" /> Cargar Funciones Oficiales
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {functions.map(fn => (
          <div key={fn.id} className="bg-white border border-[#E2E8F0] rounded-xl p-3 flex flex-col justify-between hover:border-[#CBD5E1]">
            <div>
              <div className="flex justify-between items-start">
                <span className="font-bold text-[#182535] text-sm">{fn.name}</span>
                {false && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#D97706] font-bold">Liderazgo</span>}
              </div>
              <p className="text-xs text-[#64748B] mt-1">{fn.description}</p>
            </div>
            <div className="flex justify-end gap-1 mt-3 pt-2 border-t border-[#F1F5F9]">
              <button onClick={() => handleDelete(fn.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {functions.length === 0 && (
        <div className="bg-white p-8 rounded-xl border border-[#E2E8F0] text-center text-[#64748B]">
          No hay funciones configuradas.
        </div>
      )}
    </div>
  );
}

