with open('src/App.tsx', 'r') as f:
    code = f.read()

# Update AssignmentView call in App.tsx
target_assign = """<AssignmentView
                people={people}
                assignments={assignments}
                availabilities={availabilities}
                functions={functions}
                requirements={requirements}
                shifts={shifts}
              />"""
replacement_assign = """<AssignmentView
                people={people}
                assignments={assignments}
                availabilities={availabilities}
                functions={functions}
                requirements={requirements}
                shifts={shifts}
                events={events}
                bases={bases}
              />"""
code = code.replace(target_assign, replacement_assign)

# Update DashboardView call in App.tsx
target_dash = """<DashboardView
                shifts={shifts}
                people={people}
                assignments={assignments}
                availabilities={availabilities}
                attendances={attendances}
                onNavigate={setCurrentTab}
                onOpenAddPerson={() => setIsAddPersonOpen(true)}
                onOpenExcelImport={() => setIsExcelImportOpen(true)}
              />"""
replacement_dash = """<DashboardView
                shifts={shifts}
                events={events}
                bases={bases}
                people={people}
                assignments={assignments}
                availabilities={availabilities}
                attendances={attendances}
                onNavigate={setCurrentTab}
                onOpenAddPerson={() => setIsAddPersonOpen(true)}
                onOpenExcelImport={() => setIsExcelImportOpen(true)}
              />"""
code = code.replace(target_dash, replacement_dash)

with open('src/App.tsx', 'w') as f:
    f.write(code)
