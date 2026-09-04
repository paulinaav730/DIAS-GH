import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import {
  Person,
  Assignment,
  AvailabilityRecord,
  AttendanceRecord,
  GroupFunction,
  ShiftRequirement,
  AppEvent,
  ConfigurableShift,
  ConfigurableBase,
} from '../types';
import {
  CARNIVAL_PHYSICAL_BASES,
  THE_GAMES_PHYSICAL_BASES,
  getBaseDisplayName,
  DEFAULT_INITIAL_EVENTS,
  DEFAULT_INITIAL_SHIFTS,
  DEFAULT_INITIAL_BASES,
  formatTimeRangeLabel,
  doShiftsOverlap,
} from '../data/eventStructure';
import { DEFAULT_GROUP_FUNCTIONS } from '../data/functionsCatalog';

// Storage keys
const STORAGE_KEYS = {
  PEOPLE: 'dias_eafit_people',
  ASSIGNMENTS: 'dias_eafit_assignments',
  AVAILABILITIES: 'dias_eafit_availabilities',
  ATTENDANCES: 'dias_eafit_attendances',
  FUNCTIONS: 'dias_eafit_functions',
  REQUIREMENTS: 'dias_eafit_shift_requirements',
  EVENTS: 'dias_eafit_events',
  SHIFTS: 'dias_eafit_shifts',
  BASES: 'dias_eafit_bases',
};

// Listeners for reactive updates
type Listener<T> = (data: T) => void;
const peopleListeners = new Set<Listener<Person[]>>();
const assignmentListeners = new Set<Listener<Assignment[]>>();
const availabilityListeners = new Set<Listener<AvailabilityRecord[]>>();
const attendanceListeners = new Set<Listener<AttendanceRecord[]>>();
const functionListeners = new Set<Listener<GroupFunction[]>>();
const requirementListeners = new Set<Listener<ShiftRequirement[]>>();
const eventListeners = new Set<Listener<AppEvent[]>>();
const shiftListeners = new Set<Listener<ConfigurableShift[]>>();
const baseListeners = new Set<Listener<ConfigurableBase[]>>();

// In-memory cache synced with storage
let peopleCache: Person[] = [];
let assignmentCache: Assignment[] = [];
let availabilityCache: AvailabilityRecord[] = [];
let attendanceCache: AttendanceRecord[] = [];
let functionCache: GroupFunction[] = [];
let requirementCache: ShiftRequirement[] = [];
let eventsCache: AppEvent[] = [];
let shiftsCache: ConfigurableShift[] = [];
let basesCache: ConfigurableBase[] = [];
let isInitialized = false;

// Cross-tab real-time sync listener
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (Object.values(STORAGE_KEYS).includes(e.key || '')) {
      isInitialized = false;
      initializeStorage();
    }
  });
}

// Initialize storage

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


function saveToFirebase(collectionName: string, id: string, data: any) {
  if (!isConfigured || !db) return;
  const cleanData = JSON.parse(JSON.stringify(data)); // Removes undefined values
  setDoc(doc(db, collectionName, String(id)), cleanData).catch(console.error);
}

function deleteFromFirebase(collectionName: string, id: string) {
  if (!isConfigured || !db) return;
  deleteDoc(doc(db, collectionName, String(id))).catch(console.error);
}

function notifyAll() {
  peopleListeners.forEach((fn) => fn([...peopleCache]));
  assignmentListeners.forEach((fn) => fn([...assignmentCache]));
  availabilityListeners.forEach((fn) => fn([...availabilityCache]));
  attendanceListeners.forEach((fn) => fn([...attendanceCache]));
  functionListeners.forEach((fn) => fn([...functionCache]));
  requirementListeners.forEach((fn) => fn([...requirementCache]));
  eventListeners.forEach((fn) => fn([...eventsCache]));
  shiftListeners.forEach((fn) => fn([...shiftsCache]));
  baseListeners.forEach((fn) => fn([...basesCache]));
}

// ----------------- SUBSCRIPTIONS -----------------
export function subscribeToPeople(listener: Listener<Person[]>): () => void {
  initializeStorage();
  peopleListeners.add(listener);
  listener([...peopleCache]);
  return () => peopleListeners.delete(listener);
}

export function subscribeToAssignments(listener: Listener<Assignment[]>): () => void {
  initializeStorage();
  assignmentListeners.add(listener);
  listener([...assignmentCache]);
  return () => assignmentListeners.delete(listener);
}

export function subscribeToAvailabilities(listener: Listener<AvailabilityRecord[]>): () => void {
  initializeStorage();
  availabilityListeners.add(listener);
  listener([...availabilityCache]);
  return () => availabilityListeners.delete(listener);
}

export function subscribeToAttendances(listener: Listener<AttendanceRecord[]>): () => void {
  initializeStorage();
  attendanceListeners.add(listener);
  listener([...attendanceCache]);
  return () => attendanceListeners.delete(listener);
}

export function subscribeToFunctions(listener: Listener<GroupFunction[]>): () => void {
  initializeStorage();
  functionListeners.add(listener);
  listener([...functionCache]);
  return () => functionListeners.delete(listener);
}

export function subscribeToRequirements(listener: Listener<ShiftRequirement[]>): () => void {
  initializeStorage();
  requirementListeners.add(listener);
  listener([...requirementCache]);
  return () => requirementListeners.delete(listener);
}

export function subscribeToEvents(listener: Listener<AppEvent[]>): () => void {
  initializeStorage();
  eventListeners.add(listener);
  listener([...eventsCache]);
  return () => eventListeners.delete(listener);
}

export function subscribeToShifts(listener: Listener<ConfigurableShift[]>): () => void {
  initializeStorage();
  shiftListeners.add(listener);
  listener([...shiftsCache]);
  return () => shiftListeners.delete(listener);
}

export function subscribeToBases(listener: Listener<ConfigurableBase[]>): () => void {
  initializeStorage();
  baseListeners.add(listener);
  listener([...basesCache]);
  return () => baseListeners.delete(listener);
}

// ----------------- PEOPLE CRUD -----------------
export async function addPerson(
  personData: Omit<Person, 'id' | 'createdAt'>
): Promise<Person> {
  initializeStorage();
  const newPerson: Person = {
    ...personData,
    id: 'person_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };

  peopleCache = [...peopleCache, newPerson];
  saveToFirebase("people", newPerson.id, newPerson);
  peopleListeners.forEach((fn) => fn([...peopleCache]));
  return newPerson;
}

export async function updatePerson(id: string, updates: Partial<Person>): Promise<void> {
  initializeStorage();
  const updated = { ...peopleCache.find(p => p.id === id), ...updates };
  peopleCache = peopleCache.map((p) => (p.id === id ? updated : p));
  saveToFirebase("people", id, updated);
  peopleListeners.forEach((fn) => fn([...peopleCache]));
}

export interface ImportBatchResult {
  added: number;
  updated: number;
  skipped: number;
}

export async function importPeopleBatch(
  newPeople: Array<Omit<Person, 'id' | 'createdAt'>>,
  options: { updateExisting: boolean } = { updateExisting: false }
): Promise<ImportBatchResult> {
  initializeStorage();
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const personData of newPeople) {
    const cleanDoc = personData.documentId.trim();
    const cleanUser = (personData.username || '').trim().toLowerCase();

    // Check if person exists by documentId or username
    const existingIndex = peopleCache.findIndex(
      (p) =>
        p.documentId.trim() === cleanDoc ||
        (cleanUser && p.username && p.username.trim().toLowerCase() === cleanUser)
    );

    if (existingIndex >= 0) {
      if (options.updateExisting) {
        peopleCache[existingIndex] = {
          ...peopleCache[existingIndex],
          ...personData,
        };
        updated++;
        saveToFirebase("people", peopleCache[existingIndex].id, peopleCache[existingIndex]);
      } else {
        skipped++;
      }
    } else {
      const newPerson: Person = {
        ...personData,
        id: 'person_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        createdAt: new Date().toISOString(),
      };
      peopleCache.push(newPerson);
      saveToFirebase("people", newPerson.id, newPerson);
      added++;
    }
  }
  peopleListeners.forEach((fn) => fn([...peopleCache]));

  return { added, updated, skipped };
}

export async function deletePerson(id: string): Promise<void> {
  initializeStorage();
  peopleCache = peopleCache.filter((p) => p.id !== id);
  deleteFromFirebase("people", id);
  // Also clean up their assignments, availability and attendance
  assignmentCache.filter((a) => a.personId === id).forEach(a => deleteFromFirebase("assignments", a.id));
  assignmentCache = assignmentCache.filter((a) => a.personId !== id);
  availabilityCache.filter((av) => av.personId === id).forEach(av => deleteFromFirebase("availabilities", av.id));
  availabilityCache = availabilityCache.filter((av) => av.personId !== id);
  attendanceCache.filter((at) => at.personId === id).forEach(at => deleteFromFirebase("attendances", at.id));
  attendanceCache = attendanceCache.filter((at) => at.personId !== id);

  notifyAll();
}

// ----------------- AVAILABILITY -----------------
export async function saveAvailability(
  personId: string,
  dayId: string,
  shiftIds: string[],
  notes?: string
): Promise<void> {
  initializeStorage();
  const existingIndex = availabilityCache.findIndex(
    (av) => av.personId === personId && av.dayId === dayId
  );

  const newRecord: AvailabilityRecord = {
    id: existingIndex >= 0 ? availabilityCache[existingIndex].id : 'avail_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    personId,
    dayId,
    shiftIds,
    notes,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    availabilityCache = availabilityCache.map((av, idx) =>
      idx === existingIndex ? newRecord : av
    );
  } else {
    availabilityCache = [...availabilityCache, newRecord];
  }
  saveToFirebase("availabilities", newRecord.id, newRecord);
  availabilityListeners.forEach((fn) => fn([...availabilityCache]));
}

// ----------------- ASSIGNMENTS WITH CONTINUITY AND CAPACITY CHECKS -----------------
export interface AssignmentResult {
  success: boolean;
  alertMessage?: string;
  assignment?: Assignment;
}

export async function assignPerson(
  assignmentData: Omit<Assignment, 'id' | 'updatedAt'>
): Promise<AssignmentResult> {
  initializeStorage();

  const { personId, dayId, shiftId, assignedType } = assignmentData;
  let baseNumber = assignmentData.baseNumber;

  // RULE 1: CARNIVAL CONTINUITY CHECK
  // Si una persona GAP trabaja varios turnos de Carnival, debe permanecer en la misma base.
  // Ejemplo: T1 -> Base 8, T2 -> Base 8, T3 -> Base 8.
  // También aplica para: Base Toro, Base Speedway, Base Arcade.
  if (dayId === 'miercoles') {
    const existingCarnivalWithBase = assignmentCache.find(
      (a) =>
        a.personId === personId &&
        a.dayId === 'miercoles' &&
        a.shiftId !== shiftId &&
        a.baseNumber !== undefined &&
        a.baseNumber !== null &&
        a.baseNumber !== ''
    );

    if (existingCarnivalWithBase && existingCarnivalWithBase.baseNumber !== undefined) {
      const priorBase = existingCarnivalWithBase.baseNumber;
      const priorBaseName = getBaseDisplayName(priorBase);

      if (baseNumber !== undefined && baseNumber !== null && baseNumber !== '') {
        if (String(baseNumber) !== String(priorBase)) {
          return {
            success: false,
            alertMessage: `REGLA DE CONTINUIDAD EN CARNIVAL: Esta persona ya está asignada a ${priorBaseName} en otro turno de Carnival. En Carnival debe permanecer en la MISMA base física en todos sus turnos (aplica para Base 1..27, Base Toro, Base Speedway y Base Arcade). Asignación rechazada.`,
          };
        }
      } else {
        // Enforce continuity by auto-assigning the prior base if none was explicitly picked
        baseNumber = priorBase;
      }
    }
  }

  // RULE 2: BASE CAPACITY CHECK
  if (baseNumber !== undefined && baseNumber !== null && baseNumber !== '') {
    let maxCapacity = 2;
    let targetBaseObj = undefined;

    if (dayId === 'miercoles') {
      targetBaseObj = CARNIVAL_PHYSICAL_BASES.find(
        (b) =>
          String(b.id) === String(baseNumber) ||
          b.name.toLowerCase() === String(baseNumber).toLowerCase() ||
          b.code === baseNumber
      );
      if (targetBaseObj) maxCapacity = targetBaseObj.defaultCapacity;
    } else if (dayId === 'jueves' || dayId === 'viernes') {
      targetBaseObj = THE_GAMES_PHYSICAL_BASES.find(
        (b) =>
          String(b.id) === String(baseNumber) ||
          b.name.toLowerCase() === String(baseNumber).toLowerCase()
      );
      if (targetBaseObj) maxCapacity = targetBaseObj.defaultCapacity;
    }

    const currentOccupants = assignmentCache.filter(
      (a) =>
        a.dayId === dayId &&
        a.shiftId === shiftId &&
        (String(a.baseNumber) === String(baseNumber) ||
          (targetBaseObj && a.baseName === targetBaseObj.name)) &&
        a.personId !== personId
    );

    if (currentOccupants.length >= maxCapacity) {
      const displayName = getBaseDisplayName(baseNumber);
      return {
        success: false,
        alertMessage: `ALERTA DE CUPO: ${displayName} no tiene cupo suficiente en este turno (Capacidad máxima de ${maxCapacity} alcanzada). Por favor libere un cupo o seleccione otra base.`,
      };
    }
  }

  // Check if this person already has an assignment for this day and shift
  const existingIndex = assignmentCache.findIndex(
    (a) => a.personId === personId && a.dayId === dayId && a.shiftId === shiftId
  );

  const baseName =
    baseNumber !== undefined && baseNumber !== null && baseNumber !== ''
      ? getBaseDisplayName(baseNumber)
      : undefined;

  const newAssignment: Assignment = {
    id:
      existingIndex >= 0
        ? assignmentCache[existingIndex].id
        : 'asgn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    personId,
    dayId,
    shiftId,
    assignedType,
    gtSubTeam: assignmentData.gtSubTeam,
    baseNumber,
    baseName,
    assignedFunction: assignmentData.assignedFunction,
    roleInBase: assignmentData.roleInBase || assignmentData.assignedFunction,
    requirementId: assignmentData.requirementId,
    notes: assignmentData.notes,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    assignmentCache = assignmentCache.map((a, idx) =>
      idx === existingIndex ? newAssignment : a
    );
    saveToFirebase("assignments", newAssignment.id, newAssignment);
  } else {
    assignmentCache = [...assignmentCache, newAssignment];
  saveToFirebase("assignments", newAssignment.id, newAssignment);
  }
  assignmentListeners.forEach((fn) => fn([...assignmentCache]));

  return { success: true, assignment: newAssignment };
}

export async function removeAssignment(assignmentId: string): Promise<void> {
  initializeStorage();
  assignmentCache = assignmentCache.filter((a) => a.id !== assignmentId);
  deleteFromFirebase("assignments", assignmentId);
  assignmentListeners.forEach((fn) => fn([...assignmentCache]));
}

// ----------------- GROUP FUNCTIONS CRUD -----------------
export async function addGroupFunction(
  data: Omit<GroupFunction, 'id' | 'createdAt'>
): Promise<GroupFunction> {
  initializeStorage();
  const newFn: GroupFunction = {
    ...data,
    id: 'fn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    createdAt: new Date().toISOString(),
  };

  functionCache = [...functionCache, newFn];
  saveToFirebase("functions", newFn.id, newFn);
  functionListeners.forEach((fn) => fn([...functionCache]));
  return newFn;
}

export async function saveGroupFunction(
  data: Partial<GroupFunction> & { name: string; category: string }
): Promise<GroupFunction> {
  initializeStorage();
  const id = data.id || 'fn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const existingIdx = functionCache.findIndex((f) => f.id === id);
  
  const newFn: GroupFunction = {
    ...data,
    id,
    name: data.name,
    description: data.description || '',
    category: data.category as any,
    isActive: data.isActive !== undefined ? data.isActive : true,
    createdAt: existingIdx >= 0 ? functionCache[existingIdx].createdAt : new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    functionCache[existingIdx] = newFn;
  } else {
    functionCache.push(newFn);
  }
  
  saveToFirebase("functions", id, newFn);
  functionListeners.forEach((fn) => fn([...functionCache]));
  return newFn;
}

export async function updateGroupFunction(
  id: string,
  updates: Partial<GroupFunction>
): Promise<void> {
  initializeStorage();
  const updated = { ...functionCache.find(f => f.id === id), ...updates };
  functionCache = functionCache.map((f) => (f.id === id ? updated : f));
  saveToFirebase("functions", id, updated);
  functionListeners.forEach((fn) => fn([...functionCache]));
}

export async function toggleGroupFunctionActive(id: string): Promise<void> {
  initializeStorage();
  functionCache = functionCache.map((f) =>
    f.id === id ? { ...f, isActive: !f.isActive } : f
  );
  const updatedFn = functionCache.find(f => f.id === id);
  if (updatedFn) saveToFirebase("functions", id, updatedFn);
  functionListeners.forEach((fn) => fn([...functionCache]));
}

export interface FunctionUsageReport {
  peopleCount: number;
  assignmentsCount: number;
  peopleNames: string[];
}

export function checkFunctionUsage(
  functionName: string,
  category: string,
  gtSubTeam?: string
): FunctionUsageReport {
  initializeStorage();
  const cleanName = functionName.trim().toLowerCase();

  // Check people using this function
  const peopleUsing = peopleCache.filter((p) => {
    if (p.primaryType !== category) return false;
    if (category === 'GT' && gtSubTeam && p.gtSubTeam && p.gtSubTeam !== gtSubTeam) return false;
    return (p.functions || []).some((f) => f.trim().toLowerCase() === cleanName);
  });

  // Check assignments using this function
  const assignmentsUsing = assignmentCache.filter((a) => {
    return (
      (a.assignedFunction && a.assignedFunction.trim().toLowerCase() === cleanName) ||
      (a.roleInBase && a.roleInBase.trim().toLowerCase() === cleanName)
    );
  });

  return {
    peopleCount: peopleUsing.length,
    assignmentsCount: assignmentsUsing.length,
    peopleNames: peopleUsing.map((p) => p.name),
  };
}

export async function deleteGroupFunction(
  id: string,
  force = false
): Promise<{ success: boolean; warning?: string }> {
  initializeStorage();
  const targetFn = functionCache.find((f) => f.id === id);
  if (!targetFn) return { success: true };

  const usage = checkFunctionUsage(targetFn.name, targetFn.category, targetFn.gtSubTeam);

  if (!force && (usage.peopleCount > 0 || usage.assignmentsCount > 0)) {
    return {
      success: false,
      warning: `La función "${targetFn.name}" está asignada actualmente a ${usage.peopleCount} persona(s) y ${usage.assignmentsCount} asignación(es) activa(s). No se puede eliminar silenciosamente. Debe confirmar la eliminación forzada.`,
    };
  }

  functionCache = functionCache.filter((f) => f.id !== id);
  deleteFromFirebase("functions", id);
  functionListeners.forEach((fn) => fn([...functionCache]));
  return { success: true };
}

export async function restoreDefaultFunctions(): Promise<void> {
  initializeStorage();
  functionCache = [...DEFAULT_GROUP_FUNCTIONS];
  functionListeners.forEach((fn) => fn([...functionCache]));
}

// ----------------- SHIFT REQUIREMENTS CRUD -----------------
export async function saveShiftRequirement(
  reqData: Omit<ShiftRequirement, 'id' | 'updatedAt'> & { id?: string }
): Promise<ShiftRequirement> {
  initializeStorage();
  const id = reqData.id || 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const existingIdx = requirementCache.findIndex((r) => r.id === id);

  const newReq: ShiftRequirement = {
    ...reqData,
    id,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    requirementCache = requirementCache.map((r, idx) => (idx === existingIdx ? newReq : r));
  } else {
    requirementCache = [...requirementCache, newReq];
  }
  saveToFirebase("requirements", newReq.id, newReq);
  requirementListeners.forEach((fn) => fn([...requirementCache]));
  return newReq;
}

export async function deleteShiftRequirement(id: string): Promise<void> {
  initializeStorage();
  requirementCache = requirementCache.filter((r) => r.id !== id);
  deleteFromFirebase("requirements", id);
  requirementListeners.forEach((fn) => fn([...requirementCache]));
}

// ----------------- ATTENDANCE -----------------
export async function recordAttendance(
  attendanceData: Omit<AttendanceRecord, 'id' | 'updatedAt'>
): Promise<void> {
  initializeStorage();
  const { personId, dayId, shiftId } = attendanceData;

  const existingIndex = attendanceCache.findIndex(
    (at) => at.personId === personId && at.dayId === dayId && at.shiftId === shiftId
  );

  const newRecord: AttendanceRecord = {
    id: existingIndex >= 0 ? attendanceCache[existingIndex].id : 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    ...attendanceData,
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    attendanceCache = attendanceCache.map((at, idx) =>
      idx === existingIndex ? newRecord : at
    );
  } else {
    attendanceCache = [...attendanceCache, newRecord];
  }
  saveToFirebase("attendances", newRecord.id, newRecord);
  attendanceListeners.forEach((fn) => fn([...attendanceCache]));
}

// ----------------- DYNAMIC SHIFTS (ADMIN TOTAL CONTROL) -----------------
export interface ShiftConflictReport {
  personName: string;
  personId: string;
  conflictingShiftName: string;
  conflictingHours: string;
}

export function checkShiftTimeChangeConflicts(
  shiftId: string,
  newStartTime: string,
  newEndTime: string
): ShiftConflictReport[] {
  initializeStorage();
  const currentShift = shiftsCache.find((s) => s.id === shiftId);
  if (!currentShift) return [];

  const tempShift: ConfigurableShift = {
    ...currentShift,
    startTime: newStartTime,
    endTime: newEndTime,
  };

  const shiftAssignments = assignmentCache.filter((a) => a.shiftId === shiftId);
  const conflicts: ShiftConflictReport[] = [];

  for (const assign of shiftAssignments) {
    const person = peopleCache.find((p) => p.id === assign.personId);
    const personName = person ? person.name : 'Persona asignada';

    // Find other assignments for the same person on the same day
    const otherAssignments = assignmentCache.filter(
      (a) => a.personId === assign.personId && a.dayId === assign.dayId && a.shiftId !== shiftId
    );

    for (const other of otherAssignments) {
      const otherShift = shiftsCache.find((s) => s.id === other.shiftId);
      if (otherShift && otherShift.isActive && doShiftsOverlap(tempShift, otherShift)) {
        conflicts.push({
          personName,
          personId: assign.personId,
          conflictingShiftName: otherShift.name,
          conflictingHours: otherShift.label,
        });
      }
    }
  }

  return conflicts;
}

export function checkShiftDeleteImpact(shiftId: string): {
  count: number;
  peopleNames: string[];
} {
  initializeStorage();
  const assignments = assignmentCache.filter((a) => a.shiftId === shiftId);
  const peopleNames = assignments
    .map((a) => peopleCache.find((p) => p.id === a.personId)?.name || 'Persona')
    .filter((name, idx, self) => self.indexOf(name) === idx);

  return {
    count: assignments.length,
    peopleNames,
  };
}

export async function saveShift(
  shiftData: Partial<ConfigurableShift> & {
    name: string;
    dayId: string;
    eventId: string;
    category: ConfigurableShift['category'];
    startTime: string;
    endTime: string;
    capacity: number;
  }
): Promise<{ shift: ConfigurableShift; conflicts: ShiftConflictReport[] }> {
  initializeStorage();

  const id =
    shiftData.id ||
    `shift_${shiftData.dayId}_${shiftData.category.toLowerCase()}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

  const label =
    shiftData.label || formatTimeRangeLabel(shiftData.startTime, shiftData.endTime);

  // Check if updating an existing shift with changed hours
  let conflicts: ShiftConflictReport[] = [];
  const existingIndex = shiftsCache.findIndex((s) => s.id === id);
  if (existingIndex >= 0) {
    const existing = shiftsCache[existingIndex];
    if (existing.startTime !== shiftData.startTime || existing.endTime !== shiftData.endTime) {
      conflicts = checkShiftTimeChangeConflicts(id, shiftData.startTime, shiftData.endTime);
    }
  }

  const newShift: ConfigurableShift = {
    id,
    name: shiftData.name.trim(),
    dayId: shiftData.dayId,
    eventId: shiftData.eventId,
    category: shiftData.category,
    gtSubTeam: shiftData.category === 'GT' ? shiftData.gtSubTeam : undefined,
    startTime: shiftData.startTime,
    endTime: shiftData.endTime,
    label,
    capacity: Number(shiftData.capacity) || 1,
    isActive: shiftData.isActive !== undefined ? shiftData.isActive : true,
    hasBases: shiftData.hasBases !== undefined ? shiftData.hasBases : shiftData.category === 'GAP',
    baseIds: shiftData.baseIds,
    specificFunctions: shiftData.specificFunctions || [],
    notes: shiftData.notes || '',
    forTypes: [shiftData.category, 'MESA'],
    createdAt: existingIndex >= 0 ? shiftsCache[existingIndex].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    shiftsCache[existingIndex] = newShift;
  } else {
    shiftsCache.push(newShift);
  }
  saveToFirebase("shifts", newShift.id, newShift);
  shiftListeners.forEach((fn) => fn([...shiftsCache]));

  return { shift: newShift, conflicts };
}

export async function duplicateShift(id: string): Promise<ConfigurableShift | null> {
  initializeStorage();
  const source = shiftsCache.find((s) => s.id === id);
  if (!source) return null;

  const newId = `shift_${source.dayId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

  // Find sensible duplicate name, e.g. T1 -> T1 (Copia) or auto-increment
  let duplicateName = `${source.name} (Copia)`;
  const matchT = source.name.match(/^T(\d+)$/i);
  if (matchT) {
    const nextNum = parseInt(matchT[1], 10) + 1;
    const candidate = `T${nextNum}`;
    const exists = shiftsCache.some((s) => s.dayId === source.dayId && s.category === source.category && s.name.toUpperCase() === candidate);
    if (!exists) {
      duplicateName = candidate;
    }
  }

  const duplicated: ConfigurableShift = {
    ...source,
    id: newId,
    name: duplicateName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  shiftsCache.push(duplicated);
  saveToFirebase("shifts", duplicated.id, duplicated);
  shiftListeners.forEach((fn) => fn([...shiftsCache]));

  return duplicated;
}

export async function deleteShift(
  id: string,
  removeAssignments = false
): Promise<{ success: boolean; warning?: string }> {
  initializeStorage();
  const impact = checkShiftDeleteImpact(id);

  if (!removeAssignments && impact.count > 0) {
    return {
      success: false,
      warning: `Este turno tiene ${impact.count} persona(s) asignada(s) (${impact.peopleNames.slice(0, 3).join(', ')}${impact.peopleNames.length > 3 ? '...' : ''}). Al eliminarlo, sus asignaciones relacionadas también deberán gestionarse. Por favor confirma la eliminación.`,
    };
  }

  // Remove related assignments if confirmed
  if (impact.count > 0 && removeAssignments) {
    assignmentCache.filter((a) => a.shiftId === id).forEach(a => deleteFromFirebase("assignments", a.id));
    assignmentCache = assignmentCache.filter((a) => a.shiftId !== id);
    assignmentListeners.forEach((fn) => fn([...assignmentCache]));
  }

  shiftsCache = shiftsCache.filter((s) => s.id !== id);
  deleteFromFirebase("shifts", id);
  shiftListeners.forEach((fn) => fn([...shiftsCache]));

  return { success: true };
}

// ----------------- DYNAMIC EVENTS (ADMIN TOTAL CONTROL) -----------------
export async function saveEvent(
  eventData: Partial<AppEvent> & { name: string; dayId: string; dayName: string }
): Promise<AppEvent> {
  initializeStorage();
  const id =
    eventData.id ||
    `event_${eventData.dayId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`;

  const existingIdx = eventsCache.findIndex((e) => e.id === id);
  const newEvent: AppEvent = {
    id,
    name: eventData.name.trim().toUpperCase(),
    dayId: eventData.dayId.toLowerCase().trim(),
    dayName: eventData.dayName.trim(),
    description: eventData.description || '',
    notes: eventData.notes || '',
    isActive: eventData.isActive !== undefined ? eventData.isActive : true,
    isCarnival: eventData.isCarnival || false,
    order: eventData.order || eventsCache.length + 1,
    createdAt: existingIdx >= 0 ? eventsCache[existingIdx].createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    eventsCache[existingIdx] = newEvent;
  } else {
    eventsCache.push(newEvent);
  }
  saveToFirebase("events", newEvent.id, newEvent);
  eventListeners.forEach((fn) => fn([...eventsCache]));
  return newEvent;
}

export async function deleteEvent(
  id: string,
  force = false
): Promise<{ success: boolean; warning?: string }> {
  initializeStorage();
  const relatedShifts = shiftsCache.filter((s) => s.eventId === id);

  if (!force && relatedShifts.length > 0) {
    return {
      success: false,
      warning: `Este evento tiene ${relatedShifts.length} turno(s) configurado(s). Para eliminarlo, confirme que desea eliminar también los turnos y sus datos.`,
    };
  }

  if (force && relatedShifts.length > 0) {
    const shiftIds = relatedShifts.map((s) => s.id);
    shiftsCache.filter((s) => shiftIds.includes(s.id)).forEach(s => deleteFromFirebase("shifts", s.id));
    shiftsCache = shiftsCache.filter((s) => !shiftIds.includes(s.id));
    assignmentCache.filter((a) => shiftIds.includes(a.shiftId)).forEach(a => deleteFromFirebase("assignments", a.id));
    assignmentCache = assignmentCache.filter((a) => !shiftIds.includes(a.shiftId));
    shiftListeners.forEach((fn) => fn([...shiftsCache]));
    assignmentListeners.forEach((fn) => fn([...assignmentCache]));
  }

  eventsCache = eventsCache.filter((e) => e.id !== id);
  deleteFromFirebase("events", id);
  eventListeners.forEach((fn) => fn([...eventsCache]));
  return { success: true };
}

// ----------------- DYNAMIC BASES (ADMIN TOTAL CONTROL) -----------------
export function checkBaseDeleteImpact(baseId: number | string): {
  count: number;
  peopleNames: string[];
} {
  initializeStorage();
  const cleanId = String(baseId);
  const assignments = assignmentCache.filter(
    (a) => String(a.baseNumber) === cleanId || (a.baseName && a.baseName.toLowerCase().includes(cleanId.toLowerCase()))
  );

  const peopleNames = assignments
    .map((a) => peopleCache.find((p) => p.id === a.personId)?.name || 'Persona')
    .filter((name, idx, self) => self.indexOf(name) === idx);

  return { count: assignments.length, peopleNames };
}

export async function saveBase(
  baseData: Partial<ConfigurableBase> & { name: string; defaultCapacity: number }
): Promise<ConfigurableBase> {
  initializeStorage();
  const id = baseData.id !== undefined ? baseData.id : `base_${Date.now()}`;
  const existingIdx = basesCache.findIndex((b) => String(b.id) === String(id));

  const newBase: ConfigurableBase = {
    id,
    name: baseData.name.trim(),
    code: baseData.code || `base-${id}`,
    defaultCapacity: Number(baseData.defaultCapacity) || 2,
    isSpecial: baseData.isSpecial || false,
    isActive: baseData.isActive !== undefined ? baseData.isActive : true,
    eventId: baseData.eventId,
    notes: baseData.notes || '',
  };

  if (existingIdx >= 0) {
    basesCache[existingIdx] = newBase;
  } else {
    basesCache.push(newBase);
  }
  saveToFirebase("bases", String(newBase.id), newBase);
  baseListeners.forEach((fn) => fn([...basesCache]));
  return newBase;
}

export async function deleteBase(
  id: number | string,
  force = false
): Promise<{ success: boolean; warning?: string }> {
  initializeStorage();
  const impact = checkBaseDeleteImpact(id);

  if (!force && impact.count > 0) {
    return {
      success: false,
      warning: `Esta base tiene ${impact.count} asignación(es) activa(s). Confirma si deseas eliminarla de todas formas.`,
    };
  }

  basesCache = basesCache.filter((b) => String(b.id) !== String(id));
  deleteFromFirebase("bases", String(id));
  baseListeners.forEach((fn) => fn([...basesCache]));
  return { success: true };
}

export async function restoreDefaultSchedule(): Promise<void> {
  initializeStorage();
  eventsCache = [...DEFAULT_INITIAL_EVENTS];
  shiftsCache = [...DEFAULT_INITIAL_SHIFTS];
  basesCache = [...DEFAULT_INITIAL_BASES];

  eventListeners.forEach((fn) => fn([...eventsCache]));
  shiftListeners.forEach((fn) => fn([...shiftsCache]));
  baseListeners.forEach((fn) => fn([...basesCache]));
}

// ----------------- CLEAN RESET (STRICT ZERO STATE) -----------------
export function resetToEmptyState(): void {
  peopleCache = [];
  assignmentCache = [];
  availabilityCache = [];
  attendanceCache = [];

  localStorage.removeItem(STORAGE_KEYS.PEOPLE);
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  localStorage.removeItem(STORAGE_KEYS.AVAILABILITIES);
  localStorage.removeItem(STORAGE_KEYS.ATTENDANCES);

  notifyAll();
}

// ----------------- EXPORT / IMPORT -----------------
export function exportAllData(): string {
  return JSON.stringify(
    {
      app: 'DIAS_EAFIT',
      version: '3.0',
      exportedAt: new Date().toISOString(),
      people: peopleCache,
      assignments: assignmentCache,
      availabilities: availabilityCache,
      attendances: attendanceCache,
      functions: functionCache,
      requirements: requirementCache,
      events: eventsCache,
      shifts: shiftsCache,
      bases: basesCache,
    },
    null,
    2
  );
}

export function importAllData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data.people)) return false;

    peopleCache = data.people || [];
    assignmentCache = data.assignments || [];
    availabilityCache = data.availabilities || [];
    attendanceCache = data.attendances || [];
    if (Array.isArray(data.functions)) {
      functionCache = data.functions;
    }
    if (Array.isArray(data.requirements)) {
      requirementCache = data.requirements;
    }
    if (Array.isArray(data.events)) {
      eventsCache = data.events;
    }
    if (Array.isArray(data.shifts)) {
      shiftsCache = data.shifts;
    }
    if (Array.isArray(data.bases)) {
      basesCache = data.bases;
    }

    notifyAll();
    return true;
  } catch (err) {
    console.error('Failed to import data:', err);

    return false;
  }
}


import { writeBatch } from 'firebase/firestore';
import { ExcelImportRow } from './excelService';

export interface ImportBatchResult {
  added: number;
  updated: number;
  skipped: number;
  error?: string;
}

export async function importMasterExcelBatch(
  rows: ExcelImportRow[],
  options: { updateExisting: boolean }
): Promise<ImportBatchResult> {
  if (!isConfigured || !db) throw new Error('Firebase no configurado');
  
  const batch = writeBatch(db);
  let added = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    if (!row.isValid) continue;

    if (row.isExistingDuplicate && !options.updateExisting) {
      skipped++;
      continue;
    }

    // 1. Person Data
    // We try to find existing person by cedula to reuse their ID, otherwise create new ID
    let personId = `person_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const existingP = peopleCache.find(p => p.documentId === row.cedula || p.username === row.usuario);
    if (existingP) {
      personId = existingP.id;
      updated++;
    } else {
      added++;
    }

    const personData = {
      id: personId,
      name: row.nombre,
      documentId: row.cedula,
      username: row.usuario || row.cedula,
      email: row.correo,
      phone: row.celular,
      epikId: row.epikId,
      primaryType: row.tipo,
      gtTeams: row.gt,
      shirtSize: row.talla as any,
      createdAt: existingP ? existingP.createdAt : new Date().toISOString(),
    };

    // Use setDoc with merge:true equivalent in batch
    batch.set(doc(db, 'people', personId), personData, { merge: true });

    // 2. Availability Data
    for (const avail of row.availabilities) {
      const availId = `${personId}_${avail.dayId}`;
      const existingAvail = availabilityCache.find(a => a.personId === personId && a.dayId === avail.dayId);
      
      const availData = {
        id: existingAvail ? existingAvail.id : availId,
        personId,
        dayId: avail.dayId,
        shiftIds: avail.shiftIds, // this merges/updates the selected shifts
        updatedAt: new Date().toISOString(),
      };
      
      batch.set(doc(db, 'availabilities', availData.id), availData, { merge: true });
    }
  }

  await batch.commit();
  return { added, updated, skipped };
}
