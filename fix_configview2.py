with open('src/components/ConfigView.tsx', 'r') as f:
    code = f.read()

code = code.replace("import { DEFAULT_INITIAL_EVENTS, DEFAULT_INITIAL_BASES, DEFAULT_GROUP_FUNCTIONS } from '../data/eventStructure';", "import { DEFAULT_INITIAL_EVENTS, DEFAULT_INITIAL_BASES } from '../data/eventStructure';\nimport { DEFAULT_GROUP_FUNCTIONS } from '../data/functionsCatalog';")

# Fix isLeadership
code = code.replace("{fn.isLeadership && <span className=", "{false && <span className=")

with open('src/components/ConfigView.tsx', 'w') as f:
    f.write(code)
