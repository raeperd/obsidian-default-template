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

## Test Scenarios

1. Create file in vault root → "Daily Note template"
2. Create file in `Projects/` → "Projects template with {{date}}"
3. Create file in `Projects/ClientB/` → "Projects template with {{date}}" (inherits)
4. Create file in `Projects/ClientA/` → "ClientA template with {{date}}" (override)
5. Create file in `Journal/` → "Journal template with {{date}}"
