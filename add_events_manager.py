with open('src/components/ConfigView.tsx', 'r') as f:
    code = f.read()

# 1. Update imports
imports_target = "import { subscribeToShifts, saveShift, deleteShift } from '../services/storageService';"
imports_replacement = """import { 
  subscribeToShifts, saveShift, deleteShift,
  saveEvent, deleteEvent,
  saveBase, deleteBase,
  updateGroupFunction, deleteGroupFunction
} from '../services/storageService';
import { DEFAULT_INITIAL_EVENTS, DEFAULT_INITIAL_BASES, DEFAULT_GROUP_FUNCTIONS } from '../data/eventStructure';"""

code = code.replace(imports_target, imports_replacement)

# 2. Add handleSeedEvents to ConfigView main component
# Wait, let's just pass `events` and let `EventsManager` handle seeding.
# Actually, the user asked for seeding inside the managers.
render_target = """        {activeTab === 'shifts' ? (
          <ShiftsManager shifts={shifts} handleSeedShifts={handleSeedShifts} />
        ) : (
          <div className="bg-[#F8F9FA] rounded-2xl p-8 text-center text-[#64748B] border border-[#E2E8F0] border-dashed">
            Módulo de gestión de {activeTab} en construcción.
          </div>
        )}"""

render_replacement = """        {activeTab === 'events' ? (
          <EventsManager events={events} />
        ) : activeTab === 'shifts' ? (
          <ShiftsManager shifts={shifts} handleSeedShifts={handleSeedShifts} />
        ) : activeTab === 'bases' ? (
          <BasesManager bases={bases} events={events} />
        ) : activeTab === 'functions' ? (
          <FunctionsManager functions={functions} />
        ) : null}"""

code = code.replace(render_target, render_replacement)

with open('src/components/ConfigView.tsx', 'w') as f:
    f.write(code)
