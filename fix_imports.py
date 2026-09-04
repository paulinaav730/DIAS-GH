with open('src/services/storageService.ts', 'r') as f:
    code = f.read()

# Find the imported lines that are at the bottom
imports_to_move = """import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
"""

code = code.replace(imports_to_move, "")

# Add them to the top
first_import = code.find('import')
code = code[:first_import] + imports_to_move + code[first_import:]

with open('src/services/storageService.ts', 'w') as f:
    f.write(code)

with open('src/services/firebase.ts', 'r') as f:
    fb_code = f.read()
if '/// <reference types="vite/client" />' not in fb_code:
    fb_code = '/// <reference types="vite/client" />\n' + fb_code
    with open('src/services/firebase.ts', 'w') as f:
        f.write(fb_code)

