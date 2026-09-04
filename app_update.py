with open('src/App.tsx', 'r') as f:
    code = f.read()

# Add AppEvent and ConfigurableBase to imports
code = code.replace("  ConfigurableShift,\n} from './types';", "  ConfigurableShift,\n  AppEvent,\n  ConfigurableBase,\n} from './types';")
code = code.replace("  subscribeToShifts,\n} from './services/storageService';", "  subscribeToShifts,\n  subscribeToEvents,\n  subscribeToBases,\n} from './services/storageService';")

# Add state variables
code = code.replace("const [shifts, setShifts] = useState<ConfigurableShift[]>([]);", "const [shifts, setShifts] = useState<ConfigurableShift[]>([]);\n  const [events, setEvents] = useState<AppEvent[]>([]);\n  const [bases, setBases] = useState<ConfigurableBase[]>([]);")

# Add subscriptions
code = code.replace("const unsubShifts = subscribeToShifts(setShifts);", "const unsubShifts = subscribeToShifts(setShifts);\n    const unsubEvents = subscribeToEvents(setEvents);\n    const unsubBases = subscribeToBases(setBases);")
code = code.replace("unsubShifts();", "unsubShifts();\n      unsubEvents();\n      unsubBases();")

# Pass events and bases to ConfigView
code = code.replace("<ConfigView shifts={shifts} />", "<ConfigView shifts={shifts} events={events} bases={bases} functions={functions} />")

with open('src/App.tsx', 'w') as f:
    f.write(code)
