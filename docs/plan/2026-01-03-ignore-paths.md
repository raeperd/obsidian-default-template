# Implementation Plan: Ignore Paths Feature

## Overview
Add an "ignore paths" feature to skip template application for files created in specified folders. Ignore paths override both default and folder-specific templates.

## Requirements
- **Matching**: Prefix matching - ignore folder and all subfolders
- **Priority**: Ignore paths override everything (default + folder templates)
- **UI**: List with add/remove buttons (similar to folder templates)
- **Storage**: Array of strings in plugin settings
- **Duplicate Prevention**: Prevent adding duplicate ignore paths
- **Realtime Suggestions**: Folder autocomplete with live filtering

## Implementation Steps

### 1. Settings Interface Changes
**File**: `main.ts:3-11`

Add `ignorePaths` field to settings:
```typescript
interface DefaultTemplateSettings {
    defaultTemplate: string;
    folderTemplates: Record<string, string>;
    ignorePaths: string[];  // NEW
}

const DEFAULT_SETTINGS: DefaultTemplateSettings = {
    defaultTemplate: '',
    folderTemplates: {},
    ignorePaths: []  // NEW
}
```

### 2. Event Handler Logic
**File**: `main.ts:18-20`

Add ignore path check immediately after markdown validation (before line 21):

```typescript
// Check if file path should be ignored (prefix matching)
const normalizedFilePath = normalizePath(file.path);
const shouldIgnore = this.settings.ignorePaths.some(ignorePath => {
    const normalizedIgnorePath = normalizePath(ignorePath);
    return normalizedFilePath === normalizedIgnorePath ||
           normalizedFilePath.startsWith(normalizedIgnorePath + '/');
});
if (shouldIgnore) return;  // Early exit - no template applied
```

**Logic Details**:
- Normalize both paths to handle trailing slashes
- Exact match handles files directly in ignored folder
- Prefix match with `/` separator handles nested files and prevents false positives
- Early return before template resolution for efficiency

### 3. Settings UI
**File**: `main.ts:205-206`

Add new section after "Add folder template" button:

**Structure**:
1. Heading: "Ignore paths"
2. Description: "Skip template application for files in these folders"
3. List of ignore paths (each with text input + delete button)
4. "Add ignore path" button

**Pattern**: Mirror folder templates UI with enhancements:
- Use `TAbstractFileSuggest` for realtime folder suggestions with live filtering
- Auto-refresh with `this.display()` on changes
- Normalize paths with `normalizePath()` on save
- **Duplicate prevention**: Check if normalized path already exists before adding
- Remove empty paths automatically
- Delete button with trash icon

**Duplicate Prevention Logic**:
```typescript
// In onChange handler for path input
const normalizedPath = normalizePath(newPath);
if (normalizedPath && !this.plugin.settings.ignorePaths.includes(normalizedPath)) {
    this.plugin.settings.ignorePaths[index] = normalizedPath;
} else if (!normalizedPath) {
    // Remove if empty
    this.plugin.settings.ignorePaths.splice(index, 1);
}
// If duplicate, show notice and don't add

// In "Add ignore path" button
onClick: async () => {
    // Don't add if empty string already exists
    if (!this.plugin.settings.ignorePaths.includes('')) {
        this.plugin.settings.ignorePaths.push('');
        await this.plugin.saveSettings();
        this.display();
    }
}
```

### 4. Edge Cases Handled
- Empty array: Works correctly (no special handling needed)
- Empty strings: Auto-removed by UI
- **Duplicates: Prevented** - normalized paths checked before adding, existing duplicates ignored
- Overlapping paths: Works correctly (first match wins) - e.g., both "Projects" and "Projects/ClientA" allowed
- Non-existent folders: Valid use case (no validation, allows pre-creation setup)
- Root path: Valid but unusual (normalized to empty → removed)
- Case sensitivity: Platform-dependent (follows Obsidian's normalizePath behavior)

## Critical Files
- `/Users/raeperd/Codes/raeperd/obsidian-default-template/main.ts` - All implementation

## Testing Checklist
- [ ] Basic ignore: File in ignored folder has no template
- [ ] Nested ignore: File in ignored subfolder has no template
- [ ] Ignore overrides folder template
- [ ] Ignore overrides default template
- [ ] Non-ignored folders still work
- [ ] Prefix matching precision (no false matches)
- [ ] Empty paths removed from UI
- [ ] Path normalization (trailing slashes)
- [ ] Duplicate prevention: Cannot add same path twice
- [ ] Realtime folder suggestions work and filter as typing

## Code Style Notes
- Inline logic (no helper functions) - aligns with repository philosophy
- Minimal abstraction - reuses existing patterns
- Top-down flow - check happens before template search
- Consistent UI patterns - matches folder templates exactly

## Total Changes
- Settings: ~2 lines
- Event handler: ~12 lines
- UI section: ~50 lines
- **Total: ~64 lines added**
