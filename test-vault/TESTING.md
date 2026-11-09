# Template Testing Guide

## Folder Structure

```
test-vault/
├── Templates/
│   ├── Default.md       - Root default template
│   ├── Project.md       - For Projects/
│   ├── ClientA.md       - For Projects/ClientA/
│   └── Journal.md       - For Journal/
├── Projects/
│   ├── ClientA/           - Nested override
│   └── ClientB/           - Inherits from Projects/
└── Journal/
```

## Plugin Settings

Configure folder templates:
- `Projects` → `Templates/Project.md`
- `Projects/ClientA` → `Templates/Client.md`
- `Journal` → `Templates/Journal.md`
- `Projects/*/People` → `Templates/Folder.md`
- `Journal/**` → `Templates/Ignored.md`
- `Journal/2026` → `Templates/Journal.md`

## Test Scenarios

1. Create file in vault root → "Daily Note template"
2. Create file in `Projects/` → "Projects template with {{date}}"
3. Create file in `Projects/ClientB/` → "Projects template with {{date}}" (inherits)
4. Create file in `Projects/ClientA/` → "ClientA template with {{date}}" (override)
5. Create file in `Journal/` → "Journal template with {{date}}"
6. Create file in `Projects/ClientB/People/` → Folder template (wildcard match)
7. Create file in `Projects/ClientA/People/` → Folder template (wildcard at a deeper level wins over `Projects/ClientA`)
8. Create file in `Journal/2026/01/` → Journal template (`Journal/2026` is deeper than `Journal/**`)
