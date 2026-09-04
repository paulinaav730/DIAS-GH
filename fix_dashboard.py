with open('src/components/DashboardView.tsx', 'r') as f:
    code = f.read()

# Update signature
target_sig = """interface DashboardViewProps {
  shifts: ConfigurableShift[];
  people: Person[];"""
replacement_sig = """import { AppEvent, ConfigurableBase } from '../types';

interface DashboardViewProps {
  shifts: ConfigurableShift[];
  events: AppEvent[];
  bases: ConfigurableBase[];
  people: Person[];"""
code = code.replace(target_sig, replacement_sig)

target_params = """export const DashboardView: React.FC<DashboardViewProps> = ({
  shifts,
  people,"""
replacement_params = """export const DashboardView: React.FC<DashboardViewProps> = ({
  shifts,
  events,
  bases,
  people,"""
code = code.replace(target_params, replacement_params)

# Replace EVENT_SCHEDULE
code = code.replace("EVENT_SCHEDULE.find((d) => d.dayId === selectedDayId) || EVENT_SCHEDULE[0]", "events.find((d) => d.dayId === selectedDayId) || events[0] || {}")
code = code.replace("import { EVENT_SCHEDULE, CARNIVAL_PHYSICAL_BASES, THE_GAMES_PHYSICAL_BASES } from '../data/eventStructure';", "")

# Fix physical bases logic
code = code.replace("const currentDayTotalBases = isCarnival ? CARNIVAL_PHYSICAL_BASES.length : currentDay.eventName === 'THE GAMES' ? THE_GAMES_PHYSICAL_BASES.length : 0;", "const currentDayTotalBases = bases.filter(b => b.eventId === currentDay.id).length;")

with open('src/components/DashboardView.tsx', 'w') as f:
    f.write(code)
