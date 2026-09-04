with open('src/App.tsx', 'r') as f:
    code = f.read()

# Add ConfigurableShift to imports
if 'ConfigurableShift' not in code:
    code = code.replace("  ShiftRequirement,\\n} from './types';", "  ShiftRequirement,\\n  ConfigurableShift,\\n} from './types';")

# Add subscribeToShifts
if 'subscribeToShifts' not in code:
    code = code.replace("  subscribeToRequirements,\\n} from './services/storageService';", "  subscribeToRequirements,\\n  subscribeToShifts,\\n} from './services/storageService';")

# Add shifts state
if 'const [shifts' not in code:
    code = code.replace("const [requirements, setRequirements] = useState<ShiftRequirement[]>([]);", "const [requirements, setRequirements] = useState<ShiftRequirement[]>([]);\\n  const [shifts, setShifts] = useState<ConfigurableShift[]>([]);")

# Add to useEffect
if 'subscribeToShifts' not in code.split('useEffect')[1]:
    code = code.replace("const unsubRequirements = subscribeToRequirements(setRequirements);", "const unsubRequirements = subscribeToRequirements(setRequirements);\\n    const unsubShifts = subscribeToShifts(setShifts);")
    code = code.replace("unsubRequirements();\\n    };", "unsubRequirements();\\n      unsubShifts();\\n    };")

with open('src/App.tsx', 'w') as f:
    f.write(code)
