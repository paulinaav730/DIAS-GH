with open('src/components/AssignmentView.tsx', 'r') as f:
    code = f.read()

# Update signature
target_sig = """interface AssignmentViewProps {
  people: Person[];
  assignments: Assignment[];
  availabilities?: AvailabilityRecord[];
  functions?: GroupFunction[];
  requirements?: ShiftRequirement[];
  shifts: ConfigurableShift[];
}"""
replacement_sig = """import { AppEvent, ConfigurableBase } from '../types';

interface AssignmentViewProps {
  people: Person[];
  assignments: Assignment[];
  availabilities?: AvailabilityRecord[];
  functions?: GroupFunction[];
  requirements?: ShiftRequirement[];
  shifts: ConfigurableShift[];
  events: AppEvent[];
  bases: ConfigurableBase[];
}"""
code = code.replace(target_sig, replacement_sig)

target_params = """export const AssignmentView: React.FC<AssignmentViewProps> = ({
  people,
  assignments,
  availabilities = [],
  functions = [],
  requirements = [],
  shifts,
}) => {"""
replacement_params = """export const AssignmentView: React.FC<AssignmentViewProps> = ({
  people,
  assignments,
  availabilities = [],
  functions = [],
  requirements = [],
  shifts,
  events,
  bases,
}) => {"""
code = code.replace(target_params, replacement_params)

# Replace EVENT_SCHEDULE references
code = code.replace("EVENT_SCHEDULE.find((d) => d.dayId === selectedDayId) || EVENT_SCHEDULE[0]", "events.find((d) => d.dayId === selectedDayId) || events[0] || {}")
code = code.replace("const dayObj = EVENT_SCHEDULE.find((d) => d.dayId === dayId);", "const dayObj = events.find((d) => d.dayId === dayId);")
# wait, EVENT_SCHEDULE has shifts? no, dayObj in handleDaySelect accesses dayObj.shifts.
# In AssignmentView.tsx:
# const dayObj = EVENT_SCHEDULE.find((d) => d.dayId === dayId);
# if (dayObj && dayObj.shifts.length > 0) { ...
# I will fix this in handleDaySelect to use shifts.filter
code = code.replace("if (dayObj && dayObj.shifts.length > 0) {\n        setSelectedShiftId(dayObj.shifts[0].id);\n      }", "const dayShifts = shifts.filter(s => s.dayId === dayId);\n      if (dayShifts.length > 0) {\n        setSelectedShiftId(dayShifts[0].id);\n      }")

# Replace bases logic
target_bases = """  let physicalBases: PhysicalBase[] = [];
  if (isCarnival) {
    if (carnivalCategory === 'GAP') {
      physicalBases = CARNIVAL_PHYSICAL_BASES; // Exactly 30 bases
    }
  } else if (
    (selectedDayId === 'jueves' && activeShift?.id === 'jueves-t2') ||
    (selectedDayId === 'viernes' && activeShift?.id === 'viernes-gap')
  ) {
    physicalBases = THE_GAMES_PHYSICAL_BASES;
  }"""
replacement_bases = """  let physicalBases: ConfigurableBase[] = [];
  if (isCarnival) {
    if (carnivalCategory === 'GAP') {
      // Find bases that belong to this event
      physicalBases = bases.filter(b => b.eventId === currentDay?.id);
    }
  } else if (
    (selectedDayId === 'jueves' && activeShift?.id === 'jueves-t2') ||
    (selectedDayId === 'viernes' && activeShift?.id === 'viernes-gap')
  ) {
    // In theory, there could be an event for these
    physicalBases = bases.filter(b => b.eventId === currentDay?.id);
  }"""
code = code.replace(target_bases, replacement_bases)

# Replace CARNIVAL_PHYSICAL_BASES imports
code = code.replace("import { EVENT_SCHEDULE, CARNIVAL_PHYSICAL_BASES, THE_GAMES_PHYSICAL_BASES } from '../data/eventStructure';", "")
code = code.replace("import { PhysicalBase, ShiftRequirement } from '../types';", "import { ShiftRequirement } from '../types';")
# wait, I need to make sure PhysicalBase is removed since I'm using ConfigurableBase.
# But PhysicalBase was defined in eventStructure.ts or types.ts?
# Let's just remove PhysicalBase imports if present.
code = code.replace("PhysicalBase", "ConfigurableBase")

with open('src/components/AssignmentView.tsx', 'w') as f:
    f.write(code)
