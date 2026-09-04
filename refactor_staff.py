with open('src/components/StaffMyDiasView.tsx', 'r') as f:
    code = f.read()

# Add ConfigurableShift to imports
code = code.replace("import { Person, Assignment, AttendanceRecord } from '../types';", "import { Person, Assignment, AttendanceRecord, ConfigurableShift } from '../types';")

# Add shifts to props
code = code.replace("interface StaffMyDiasViewProps {\n  person: Person;\n  assignments: Assignment[];\n  attendances: AttendanceRecord[];\n  onLogout: () => void;\n}", "interface StaffMyDiasViewProps {\n  person: Person;\n  assignments: Assignment[];\n  attendances: AttendanceRecord[];\n  shifts: ConfigurableShift[];\n  onLogout: () => void;\n}")
code = code.replace("export const StaffMyDiasView: React.FC<StaffMyDiasViewProps> = ({\n  person,\n  assignments,\n  attendances,\n  onLogout,\n}) => {", "export const StaffMyDiasView: React.FC<StaffMyDiasViewProps> = ({\n  person,\n  assignments,\n  attendances,\n  shifts,\n  onLogout,\n}) => {")

# findShiftById logic inside component
code = code.replace("const shift = findShiftById(dayDef, assignment.shiftId);", "const shift = shifts.find(s => s.id === assignment.shiftId);")
code = code.replace(", findShiftById", "")

with open('src/components/StaffMyDiasView.tsx', 'w') as f:
    f.write(code)
