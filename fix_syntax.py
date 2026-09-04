with open('src/services/storageService.ts', 'r') as f:
    lines = f.readlines()

fixes = {
    322: '', # extra '}'
    448: '', # extra ');'
    500: '', # extra ');'
    589: '', # extra '}'
    626: '', # extra '}'
    754: '', # extra '}'
    852: '', # extra '}'
    930: ''  # extra '}'
}

for i in range(len(lines)):
    line_num = i + 1
    if line_num in fixes:
        lines[i] = fixes[line_num]

with open('src/services/storageService.ts', 'w') as f:
    f.writelines(lines)
