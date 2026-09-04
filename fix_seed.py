with open('src/components/ConfigView.tsx', 'r') as f:
    code = f.read()

code = code.replace("capacity: shift.defaultCapacity || 20,", "capacity: (shift as any).defaultCapacity || 20,")

with open('src/components/ConfigView.tsx', 'w') as f:
    f.write(code)
