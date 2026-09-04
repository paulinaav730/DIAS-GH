with open('src/services/storageService.ts', 'r') as f:
    code = f.read()

old_save = """function saveToFirebase(collectionName: string, id: string, data: any) {
  if (!isConfigured || !db) return;
  setDoc(doc(db, collectionName, String(id)), data).catch(console.error);
}"""

new_save = """function saveToFirebase(collectionName: string, id: string, data: any) {
  if (!isConfigured || !db) return;
  const cleanData = JSON.parse(JSON.stringify(data)); // Removes undefined values
  setDoc(doc(db, collectionName, String(id)), cleanData).catch(console.error);
}"""

code = code.replace(old_save, new_save)

with open('src/services/storageService.ts', 'w') as f:
    f.write(code)
