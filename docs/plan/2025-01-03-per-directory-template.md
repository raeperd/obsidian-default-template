# Implementation Plan: Per-Directory Template Support

**Date**: 2025-01-03  
**Branch**: `feature/per-directory-template`  
**Status**: Planning

## Overview

Add folder-level template overrides with inheritance support. Files will use the nearest ancestor folder's template, falling back to the root default template if no folder-specific template is configured.

## Requirements

1. Keep settings simple - minimal UI additions
2. Separate root template from folder-level templates in settings UI
3. Use same path completion and normalization as current code
4. Add proper test templates to verify functionality

## Design Decisions

### Template Resolution Strategy

**Folder hierarchy with inheritance** - Templates apply to folders and all subfolders, with deeper folder templates taking precedence.

Example: For file `Projects/ClientA/notes/meeting.md`:
1. Check `folderTemplates["Projects/ClientA/notes"]` → not found
2. Check `folderTemplates["Projects/ClientA"]` → not found  
3. Check `folderTemplates["Projects"]` → found → use this template
4. If none found → use `defaultTemplate`

If the resolved template file doesn't exist or can't be read, continue walking up the hierarchy and eventually fall back to root template.

### Data Structure

```typescript
interface DefaultTemplateSettings {
  defaultTemplate: string;           // Existing: root/global template
  folderTemplates: Record<string, string>;  // New: folder path -> template path
}

const DEFAULT_SETTINGS: DefaultTemplateSettings = {
  defaultTemplate: '',
  folderTemplates: {}
}
```

Example configuration:
```json
{
  "defaultTemplate": "Templates/Daily Note.md",
  "folderTemplates": {
    "Projects": "Templates/Project Note.md",
    "Journal": "Templates/Journal Entry.md"
  }
}
```

## Implementation Tasks

### 1. Update Settings Interface

**File**: `main.ts`  
**Lines**: ~3

- Add `folderTemplates: Record<string, string>` to `DefaultTemplateSettings`
- Update `DEFAULT_SETTINGS` with `folderTemplates: {}`

### 2. Add FolderSuggest Class

**File**: `main.ts`  
**Lines**: ~25

Create a new class similar to `FileSuggest` but for folders:
- Extend `AbstractInputSuggest<TFolder>`
- Filter `app.vault.getAllLoadedFiles()` by `TFolder` instances
- Provide autocomplete suggestions for folder paths

### 3. Template Resolution Logic

**File**: `main.ts` (inline in `create` event handler)  
**Lines**: ~15

Add inline function to resolve template path with folder hierarchy:

```typescript
const getTemplateForPath = (filePath: string): string | undefined => {
  const parts = filePath.split('/').slice(0, -1); // remove filename
  while (parts.length > 0) {
    const folderPath = parts.join('/');
    if (this.settings.folderTemplates[folderPath]) {
      return this.settings.folderTemplates[folderPath];
    }
    parts.pop();
  }
  return this.settings.defaultTemplate || undefined;
};
```

Update the file creation event handler to:
1. Call `getTemplateForPath()` to get the appropriate template
2. Try to load that template file using `getAbstractFileByPath()`
3. If template file doesn't exist, walk up hierarchy to find parent template
4. Fall back to root template if no folder templates exist

### 4. Settings UI Updates

**File**: `main.ts`  
**Lines**: ~50

Update `DefaultTemplateSettingTab.display()` following Obsidian guidelines:

**Structure**:
```
Default template file
[Templates/Daily Note.md                    ]
Select a template file to apply to new empty notes

── Folder templates ─────────────────────────
Override the default template for specific folders

Folder: Projects
[Projects              ] [Templates/Project.md    ] [×]

Folder: Journal
[Journal               ] [Templates/Journal.md    ] [×]

                                    [+ Add folder template]
```

**Implementation details**:
- No top-level heading (general settings first, per guidelines)
- Use `setHeading()` for "Folder templates" section
- Sentence case for all labels
- Each folder template entry is a separate `Setting`:
  - Folder path input with `FolderSuggest`
  - Template file input with existing `FileSuggest`
  - Delete button using `addExtraButton()` with trash icon
- "Add folder template" button creates new empty entry
- All paths normalized using `normalizePath()`

### 5. Add Test Template

**File**: `test-vault/Templates/Folder Template.md`  
**Type**: New file

Create a distinct template to verify folder-specific behavior:

```markdown
# {{title}} (Folder Template)

Created: {{date}} {{time}}

This note was created using a folder-specific template.

---
Folder: [current folder]
```

## Code Size Estimate

| Component | Lines of Code |
|-----------|---------------|
| Settings interface update | ~3 |
| FolderSuggest class | ~25 |
| Template resolution logic | ~15 |
| Settings UI updates | ~50 |
| **Total** | **~95 lines** |

## Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| No folder template, no root template | Show notice "No template configured" |
| Folder template file deleted | Fall through to parent folder template or root |
| Root template file deleted | Show notice "Template file not found" |
| File created in vault root | Use root template only |
| Nested folder with no direct template | Inherit from nearest ancestor folder |
| Empty file content | Apply template (existing behavior) |
| Non-empty file content | Don't apply template (existing behavior) |

## Testing Strategy

1. **Root template only** (existing behavior)
   - Create file in vault root → should use root template
   - Create file in any folder → should use root template

2. **Folder template inheritance**
   - Configure folder template for `Projects/`
   - Create file in `Projects/` → should use Projects template
   - Create file in `Projects/ClientA/` → should inherit Projects template
   - Create file in vault root → should use root template

3. **Nested folder templates**
   - Configure template for `Projects/` and `Projects/ClientA/`
   - Create file in `Projects/ClientA/` → should use ClientA template (most specific)
   - Create file in `Projects/ClientB/` → should use Projects template

4. **Missing template files**
   - Delete folder template file → should fall back to parent/root
   - Delete root template file → should show error notice

## References

- [Obsidian Settings Documentation](https://docs.obsidian.md/Plugins/User+interface/Settings)
- [Obsidian Plugin Guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines)

## Notes

- Follows "do one thing well" philosophy - no single-use helper functions
- Maintains maximum code conciseness
- Uses inline template resolution logic in event handler (matches current style)
- All folder paths normalized using `normalizePath()` per Obsidian guidelines
- Uses `getAbstractFileByPath()` instead of iterating files per best practices
