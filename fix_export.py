import re

# 1. Update excelService.ts
with open('src/services/excelService.ts', 'r') as f:
    code = f.read()

new_export = """export function exportPeopleToExcel(people: Person[], availabilities: AvailabilityRecord[], shifts: ConfigurableShift[]): void {
  const exportData = people.map((p, idx) => {
    // Collect availability for this person
    const personAvails = availabilities.filter(a => a.personId === p.id);
    const dayData: Record<string, string> = {
      'lunes': '',
      'martes': '',
      'miercoles': '',
      'jueves': '',
      'viernes': ''
    };
    
    personAvails.forEach(av => {
      const shiftNames = av.shiftIds
        .map(sId => shifts.find(s => s.id === sId)?.label || sId)
        .join(';');
      if (dayData[av.dayId] !== undefined) {
        dayData[av.dayId] = shiftNames;
      }
    });

    return {
      'Nombre': p.name,
      'Número de celular': p.phone || '',
      'Documento de identidad': p.documentId,
      'Correo institucional': p.email,
      'ID de EPIK': p.epikId || '',
      '¿A que GT perteneces?': p.primaryType === 'GT' ? (p.gtTeams || []).join(', ') : p.primaryType,
      'Talla de camiseta': p.shirtSize || 'M',
      'THE SHOW LUNES': dayData['lunes'],
      'THE ZONE MARTES': dayData['martes'],
      'CARNIVAL MIERCOLES': dayData['miercoles'],
      'THE GAMES JUEVES': dayData['jueves'],
      'THE GAMES VIERNES': dayData['viernes']
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Directorio DÍAS');
  XLSX.writeFile(workbook, `Personas_DIAS_EAFIT_${new Date().toISOString().split('T')[0]}.xlsx`);
}"""

code = re.sub(r'export function exportPeopleToExcel\(people: Person\[\]\): void \{.*?\n\}', new_export, code, flags=re.DOTALL)
# Import AvailabilityRecord and ConfigurableShift in excelService if not present
if 'AvailabilityRecord' not in code:
    code = code.replace("import { Person, PersonType, ConfigurableShift } from '../types';", "import { Person, PersonType, ConfigurableShift, AvailabilityRecord } from '../types';")

with open('src/services/excelService.ts', 'w') as f:
    f.write(code)

# 2. Update DashboardView.tsx
with open('src/components/DashboardView.tsx', 'r') as f:
    code = f.read()

code = code.replace("interface DashboardViewProps {\\n  people: Person[];", "interface DashboardViewProps {\\n  people: Person[];\\n  shifts: ConfigurableShift[];")
if 'ConfigurableShift' not in code:
    code = code.replace("import { Person, Assignment, AvailabilityRecord, AttendanceRecord } from '../types';", "import { Person, Assignment, AvailabilityRecord, AttendanceRecord, ConfigurableShift } from '../types';")
code = code.replace("export const DashboardView: React.FC<DashboardViewProps> = ({", "export const DashboardView: React.FC<DashboardViewProps> = ({\\n  shifts,")
code = code.replace("exportPeopleToExcel(people)", "exportPeopleToExcel(people, availabilities, shifts)")

with open('src/components/DashboardView.tsx', 'w') as f:
    f.write(code)

# 3. Update PeopleView.tsx
with open('src/components/PeopleView.tsx', 'r') as f:
    code = f.read()

code = code.replace("interface PeopleViewProps {\\n  people: Person[];", "interface PeopleViewProps {\\n  people: Person[];\\n  availabilities: AvailabilityRecord[];")
if 'AvailabilityRecord' not in code:
    code = code.replace("import { Person, ConfigurableShift, GroupFunction } from '../types';", "import { Person, ConfigurableShift, GroupFunction, AvailabilityRecord } from '../types';")
code = code.replace("export const PeopleView: React.FC<PeopleViewProps> = ({", "export const PeopleView: React.FC<PeopleViewProps> = ({\\n  availabilities,")
code = code.replace("exportPeopleToExcel(people)", "exportPeopleToExcel(people, availabilities, shifts)")

with open('src/components/PeopleView.tsx', 'w') as f:
    f.write(code)

# 4. Update App.tsx
with open('src/App.tsx', 'r') as f:
    code = f.read()

code = code.replace("              <DashboardView\\n                people={people}", "              <DashboardView\\n                shifts={shifts}\\n                people={people}")
code = code.replace("              <PeopleView\\n                people={people}", "              <PeopleView\\n                availabilities={availabilities}\\n                people={people}")

with open('src/App.tsx', 'w') as f:
    f.write(code)

