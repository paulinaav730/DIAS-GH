import re

with open('src/services/storageService.ts', 'r') as f:
    code = f.read()

# 1. Imports
imports = """
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
"""
last_import = code.rfind('import')
last_import_end = code.find(';', last_import) + 1
code = code[:last_import_end] + imports + code[last_import_end:]

# 2. initializeStorage
init_storage = """
export function initializeStorage(): void {
  if (isInitialized || !isConfigured || !db) return;
  
  const collections = {
    [STORAGE_KEYS.PEOPLE]: 'people',
    [STORAGE_KEYS.ASSIGNMENTS]: 'assignments',
    [STORAGE_KEYS.AVAILABILITIES]: 'availabilities',
    [STORAGE_KEYS.ATTENDANCES]: 'attendances',
    [STORAGE_KEYS.FUNCTIONS]: 'functions',
    [STORAGE_KEYS.REQUIREMENTS]: 'requirements',
    [STORAGE_KEYS.EVENTS]: 'events',
    [STORAGE_KEYS.SHIFTS]: 'shifts',
    [STORAGE_KEYS.BASES]: 'bases',
  };

  const syncCache = (key: string, data: any[]) => {
    switch(key) {
      case STORAGE_KEYS.PEOPLE: peopleCache = data; break;
      case STORAGE_KEYS.ASSIGNMENTS: assignmentCache = data; break;
      case STORAGE_KEYS.AVAILABILITIES: availabilityCache = data; break;
      case STORAGE_KEYS.ATTENDANCES: attendanceCache = data; break;
      case STORAGE_KEYS.FUNCTIONS: functionCache = data; break;
      case STORAGE_KEYS.REQUIREMENTS: requirementCache = data; break;
      case STORAGE_KEYS.EVENTS: eventsCache = data; break;
      case STORAGE_KEYS.SHIFTS: shiftsCache = data; break;
      case STORAGE_KEYS.BASES: basesCache = data; break;
    }
    notifyAll();
  };

  Object.entries(collections).forEach(([key, colName]) => {
    onSnapshot(collection(db, colName), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      syncCache(key, data);
    }, (err) => console.error("Firebase sync error:", err));
  });
  
  isInitialized = true;
}
"""
code = re.sub(r'export function initializeStorage\(\): void \{.*?(?=\nfunction notifyAll\(\))', init_storage, code, flags=re.DOTALL)

# 3. Helpers
firebase_helpers = """
function saveToFirebase(collectionName: string, id: string, data: any) {
  if (!isConfigured || !db) return;
  setDoc(doc(db, collectionName, String(id)), data).catch(console.error);
}

function deleteFromFirebase(collectionName: string, id: string) {
  if (!isConfigured || !db) return;
  deleteDoc(doc(db, collectionName, String(id))).catch(console.error);
}
"""
code = code.replace('function notifyAll() {', firebase_helpers + '\nfunction notifyAll() {')

# 4. Remove all localStorage.setItem and replace with firebase calls
# We'll just remove all localStorage.setItem calls.
code = re.sub(r'\s*localStorage\.setItem\(.*?\);', '', code)

# 5. Add firebase calls to CRUD functions
# PEOPLE
code = code.replace('peopleCache = [...peopleCache, newPerson];', 'peopleCache = [...peopleCache, newPerson];\n  saveToFirebase("people", newPerson.id, newPerson);')
code = code.replace('peopleCache = peopleCache.map((p) => (p.id === id ? { ...p, ...updates } : p));', 'const updated = { ...peopleCache.find(p => p.id === id), ...updates };\n  peopleCache = peopleCache.map((p) => (p.id === id ? updated : p));\n  saveToFirebase("people", id, updated);')
code = code.replace('peopleCache.push(newPerson);', 'peopleCache.push(newPerson);\n      saveToFirebase("people", newPerson.id, newPerson);')
code = code.replace('updated++;', 'updated++;\n        saveToFirebase("people", peopleCache[existingIndex].id, peopleCache[existingIndex]);')
code = code.replace("peopleCache = peopleCache.filter((p) => p.id !== id);", 'peopleCache = peopleCache.filter((p) => p.id !== id);\n  deleteFromFirebase("people", id);')

# ASSIGNMENTS
code = code.replace('assignmentCache = [...assignmentCache, newAssignment];', 'assignmentCache = [...assignmentCache, newAssignment];\n  saveToFirebase("assignments", newAssignment.id, newAssignment);')
code = code.replace('idx === existingIndex ? newAssignment : a', 'idx === existingIndex ? newAssignment : a\n    );\n    saveToFirebase("assignments", newAssignment.id, newAssignment);')
code = code.replace('assignmentCache = assignmentCache.filter((a) => a.id !== assignmentId);', 'assignmentCache = assignmentCache.filter((a) => a.id !== assignmentId);\n  deleteFromFirebase("assignments", assignmentId);')
code = code.replace('assignmentCache = assignmentCache.filter((a) => a.personId !== id);', 'assignmentCache.filter((a) => a.personId === id).forEach(a => deleteFromFirebase("assignments", a.id));\n  assignmentCache = assignmentCache.filter((a) => a.personId !== id);')
code = code.replace('assignmentCache = assignmentCache.filter((a) => a.shiftId !== id);', 'assignmentCache.filter((a) => a.shiftId === id).forEach(a => deleteFromFirebase("assignments", a.id));\n    assignmentCache = assignmentCache.filter((a) => a.shiftId !== id);')
code = code.replace('assignmentCache = assignmentCache.filter((a) => !shiftIds.includes(a.shiftId));', 'assignmentCache.filter((a) => shiftIds.includes(a.shiftId)).forEach(a => deleteFromFirebase("assignments", a.id));\n    assignmentCache = assignmentCache.filter((a) => !shiftIds.includes(a.shiftId));')


# AVAILABILITY
code = code.replace('availabilityCache = [...availabilityCache, newRecord];', 'availabilityCache = [...availabilityCache, newRecord];\n  }\n  saveToFirebase("availabilities", newRecord.id, newRecord);')
code = code.replace('availabilityCache = availabilityCache.filter((av) => av.personId !== id);', 'availabilityCache.filter((av) => av.personId === id).forEach(av => deleteFromFirebase("availabilities", av.id));\n  availabilityCache = availabilityCache.filter((av) => av.personId !== id);')

# ATTENDANCE
code = code.replace('attendanceCache = [...attendanceCache, newRecord];', 'attendanceCache = [...attendanceCache, newRecord];\n  }\n  saveToFirebase("attendances", newRecord.id, newRecord);')
code = code.replace('attendanceCache = attendanceCache.filter((at) => at.personId !== id);', 'attendanceCache.filter((at) => at.personId === id).forEach(at => deleteFromFirebase("attendances", at.id));\n  attendanceCache = attendanceCache.filter((at) => at.personId !== id);')

# FUNCTIONS
code = code.replace('functionCache = [...functionCache, newFn];', 'functionCache = [...functionCache, newFn];\n  saveToFirebase("functions", newFn.id, newFn);')
code = code.replace('functionCache = functionCache.map((f) => (f.id === id ? { ...f, ...updates } : f));', 'const updated = { ...functionCache.find(f => f.id === id), ...updates };\n  functionCache = functionCache.map((f) => (f.id === id ? updated : f));\n  saveToFirebase("functions", id, updated);')
code = code.replace('f.id === id ? { ...f, isActive: !f.isActive } : f', 'f.id === id ? { ...f, isActive: !f.isActive } : f\n  );\n  const updatedFn = functionCache.find(f => f.id === id);\n  if (updatedFn) saveToFirebase("functions", id, updatedFn);')
code = code.replace('functionCache = functionCache.filter((f) => f.id !== id);', 'functionCache = functionCache.filter((f) => f.id !== id);\n  deleteFromFirebase("functions", id);')

# REQUIREMENTS
code = code.replace('requirementCache = [...requirementCache, newReq];', 'requirementCache = [...requirementCache, newReq];\n  }\n  saveToFirebase("requirements", newReq.id, newReq);')
code = code.replace('requirementCache = requirementCache.filter((r) => r.id !== id);', 'requirementCache = requirementCache.filter((r) => r.id !== id);\n  deleteFromFirebase("requirements", id);')

# SHIFTS
code = code.replace('shiftsCache.push(newShift);', 'shiftsCache.push(newShift);\n  }\n  saveToFirebase("shifts", newShift.id, newShift);')
code = code.replace('shiftsCache[existingIndex] = newShift;', 'shiftsCache[existingIndex] = newShift;')
code = code.replace('shiftsCache.push(duplicated);', 'shiftsCache.push(duplicated);\n  saveToFirebase("shifts", duplicated.id, duplicated);')
code = code.replace('shiftsCache = shiftsCache.filter((s) => s.id !== id);', 'shiftsCache = shiftsCache.filter((s) => s.id !== id);\n  deleteFromFirebase("shifts", id);')
code = code.replace('shiftsCache = shiftsCache.filter((s) => !shiftIds.includes(s.id));', 'shiftsCache.filter((s) => shiftIds.includes(s.id)).forEach(s => deleteFromFirebase("shifts", s.id));\n    shiftsCache = shiftsCache.filter((s) => !shiftIds.includes(s.id));')

# EVENTS
code = code.replace('eventsCache.push(newEvent);', 'eventsCache.push(newEvent);\n  }\n  saveToFirebase("events", newEvent.id, newEvent);')
code = code.replace('eventsCache[existingIdx] = newEvent;', 'eventsCache[existingIdx] = newEvent;')
code = code.replace('eventsCache = eventsCache.filter((e) => e.id !== id);', 'eventsCache = eventsCache.filter((e) => e.id !== id);\n  deleteFromFirebase("events", id);')

# BASES
code = code.replace('basesCache.push(newBase);', 'basesCache.push(newBase);\n  }\n  saveToFirebase("bases", newBase.id, newBase);')
code = code.replace('basesCache[existingIdx] = newBase;', 'basesCache[existingIdx] = newBase;')
code = code.replace('basesCache = basesCache.filter((b) => String(b.id) !== String(id));', 'basesCache = basesCache.filter((b) => String(b.id) !== String(id));\n  deleteFromFirebase("bases", String(id));')

with open('src/services/storageService.ts', 'w') as f:
    f.write(code)

