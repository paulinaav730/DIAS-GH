with open('src/components/ConfigView.tsx', 'r') as f:
    code = f.read()

# Change ConfigView signature
target_sig = """export function ConfigView() {"""
replacement_sig = """interface ConfigViewProps {
  shifts: ConfigurableShift[];
  events: AppEvent[];
  bases: ConfigurableBase[];
  functions: GroupFunction[];
}

export function ConfigView({ shifts, events, bases, functions }: ConfigViewProps) {"""

code = code.replace(target_sig, replacement_sig)

# Remove internal shifts state and subscription
target_sub = """  const [shifts, setShifts] = useState<ConfigurableShift[]>([]);
  
  useEffect(() => {
    const unsub = subscribeToShifts(setShifts);
    return () => unsub();
  }, []);"""
code = code.replace(target_sub, "")

with open('src/components/ConfigView.tsx', 'w') as f:
    f.write(code)
