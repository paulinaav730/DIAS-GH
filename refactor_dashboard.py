with open('src/components/DashboardView.tsx', 'r') as f:
    code = f.read()

# Add shifts to props
code = code.replace("interface DashboardViewProps {\n  people: Person[];", "interface DashboardViewProps {\n  shifts: ConfigurableShift[];\n  people: Person[];")
code = code.replace("export const DashboardView: React.FC<DashboardViewProps> = ({\n  people,", "export const DashboardView: React.FC<DashboardViewProps> = ({\n  shifts,\n  people,")

# findShiftById replacement
code = code.replace("const shift = currentDay.shifts.find((s) => s.id === a.shiftId);", "const shift = shifts.find((s) => s.id === a.shiftId);")
code = code.replace("const currentDayTotalBases = isCarnival ? CARNIVAL_PHYSICAL_BASES.length : currentDay.eventName === 'THE GAMES' ? THE_GAMES_PHYSICAL_BASES.length : 0;", "const currentDayTotalBases = isCarnival ? CARNIVAL_PHYSICAL_BASES.length : currentDay.eventName === 'THE GAMES' ? THE_GAMES_PHYSICAL_BASES.length : 0;")
code = code.replace("const currentDayShifts = currentDay.shifts.length;", "const currentDayShifts = shifts.filter(s => s.dayId === selectedDayId).length;")


with open('src/components/DashboardView.tsx', 'w') as f:
    f.write(code)
