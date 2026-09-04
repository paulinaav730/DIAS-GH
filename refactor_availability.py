import re

with open('src/components/AvailabilityView.tsx', 'r') as f:
    code = f.read()

# 1. Update imports
code = code.replace("import { Person, AvailabilityRecord } from '../types';", "import { Person, AvailabilityRecord, ConfigurableShift } from '../types';")
code = code.replace("  CARNIVAL_GT_SHIFTS,\n  CARNIVAL_GAP_SHIFTS,\n", "")

# 2. Update Props
code = code.replace("interface AvailabilityViewProps {\n  people: Person[];\n  availabilities: AvailabilityRecord[];\n}", "interface AvailabilityViewProps {\n  people: Person[];\n  availabilities: AvailabilityRecord[];\n  shifts: ConfigurableShift[];\n}")

code = code.replace("export const AvailabilityView: React.FC<AvailabilityViewProps> = ({\n  people,\n  availabilities,\n}) => {", "export const AvailabilityView: React.FC<AvailabilityViewProps> = ({\n  people,\n  availabilities,\n  shifts,\n}) => {")

# 3. Replace GT_SHIFTS and GAP_SHIFTS usage
code = code.replace("const gapIds = CARNIVAL_GAP_SHIFTS.map((s) => s.id);", "const gapIds = shifts.filter(s => s.dayId === 'miercoles' && s.category === 'GAP').map((s) => s.id);")
code = code.replace("const gtIds = CARNIVAL_GT_SHIFTS.map((s) => s.id);", "const gtIds = shifts.filter(s => s.dayId === 'miercoles' && s.category === 'GT').map((s) => s.id);")

code = code.replace("{CARNIVAL_GAP_SHIFTS.map((shift) => {", "{shifts.filter(s => s.dayId === 'miercoles' && s.category === 'GAP').map((shift) => {")
code = code.replace("{CARNIVAL_GT_SHIFTS.map((shift) => {", "{shifts.filter(s => s.dayId === 'miercoles' && s.category === 'GT').map((shift) => {")

with open('src/components/AvailabilityView.tsx', 'w') as f:
    f.write(code)
