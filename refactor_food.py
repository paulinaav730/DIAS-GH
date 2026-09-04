with open('src/components/FoodView.tsx', 'r') as f:
    code = f.read()

# Add ConfigurableShift to imports
code = code.replace("import { Person, Assignment } from '../types';", "import { Person, Assignment, ConfigurableShift } from '../types';")
code = code.replace(", findShiftById", "")

# Add shifts to props
code = code.replace("interface FoodViewProps {\n  people: Person[];\n  assignments: Assignment[];\n}", "interface FoodViewProps {\n  people: Person[];\n  assignments: Assignment[];\n  shifts: ConfigurableShift[];\n}")
code = code.replace("export const FoodView: React.FC<FoodViewProps> = ({\n  people,\n  assignments,\n}) => {", "export const FoodView: React.FC<FoodViewProps> = ({\n  people,\n  assignments,\n  shifts,\n}) => {")

# findShiftById logic inside component
code = code.replace("const shift = findShiftById(currentDay, assignment.shiftId);", "const shift = shifts.find(s => s.id === assignment.shiftId);")

with open('src/components/FoodView.tsx', 'w') as f:
    f.write(code)
