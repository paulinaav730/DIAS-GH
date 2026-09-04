with open('src/components/AttendanceView.tsx', 'r') as f:
    code = f.read()

# Add ConfigurableShift to imports
code = code.replace("import { Person, Assignment, AttendanceRecord, AttendanceStatus } from '../types';", "import { Person, Assignment, AttendanceRecord, AttendanceStatus, ConfigurableShift } from '../types';")
code = code.replace(", findShiftById", "")

# Add shifts to props
code = code.replace("interface AttendanceViewProps {\n  people: Person[];\n  assignments: Assignment[];\n  attendances: AttendanceRecord[];\n}", "interface AttendanceViewProps {\n  people: Person[];\n  assignments: Assignment[];\n  attendances: AttendanceRecord[];\n  shifts: ConfigurableShift[];\n}")
code = code.replace("export const AttendanceView: React.FC<AttendanceViewProps> = ({\n  people,\n  assignments,\n  attendances,\n}) => {", "export const AttendanceView: React.FC<AttendanceViewProps> = ({\n  people,\n  assignments,\n  attendances,\n  shifts,\n}) => {")

# findShiftById logic inside component
code = code.replace("const shift = findShiftById(dayObj, assignment.shiftId);", "const shift = shifts.find(s => s.id === assignment.shiftId);")
code = code.replace("const shift = findShiftById(EVENT_SCHEDULE.find(d => d.dayId === dayId)!, shiftId);", "const shift = shifts.find(s => s.id === shiftId);")

with open('src/components/AttendanceView.tsx', 'w') as f:
    f.write(code)
