with open('src/services/storageService.ts', 'r') as f:
    code = f.read()

target = "export async function updateGroupFunction("

replacement = """export async function saveGroupFunction(
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

export async function updateGroupFunction("""

code = code.replace(target, replacement)

with open('src/services/storageService.ts', 'w') as f:
    f.write(code)
