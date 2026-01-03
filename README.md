# Default Template Plugin

**Automatically applies your chosen template to every new note.** No more manual template insertion—just create notes and get consistent structure instantly.

## Why This Plugin Exists

**Obsidian has no built-in way to set a default template.** The core Templates plugin requires manual insertion every time. This creates friction and inconsistent note-taking.

**Users have been requesting this for years:**
- [3+ years of forum requests](https://forum.obsidian.md/t/default-template-for-new-note-cltr-n-click-to-non-existing-note/10332) for automatic template application
- [Multiple feature requests](https://forum.obsidian.md/t/add-a-default-template-for-new-notes/75223) asking for default template functionality
- **This plugin solves that gap.**

## What It Does

**ONE THING:** Automatically applies your selected template to new empty notes.

✅ **Set once, forget forever** - Choose any template file, never manually insert again
✅ **Works everywhere** - Ctrl+N, clicking non-existent links, any note creation method
✅ **Folder templates** - Different templates for different folders with hierarchy fallback
✅ **Ignore paths** - Skip template application for specific folders
✅ **Template variables** - Processes `{{date}}`, `{{time}}`, `{{title}}` like official Templates plugin
✅ **Zero interference** - No template selected? Plugin does nothing

## Features

### Folder Templates
Assign different templates to specific folders. Notes in `Projects/` can use a project template while notes in `Journal/` use a daily template.

**Hierarchy fallback:** If `Projects/Work/ClientA/` has no template, it checks `Projects/Work/`, then `Projects/`, then falls back to default.

### Ignore Paths
Exclude folders where templates shouldn't be applied. Useful for scratch notes, temporary files, or areas where templates would be intrusive.

## Template Variables

**Supports official Obsidian template variables with full format string support:**

- `{{title}}` → `My New Note` (filename)
- `{{date}}` → `2024-01-15` (default: YYYY-MM-DD)
- `{{time}}` → `14:30` (default: HH:mm)

**Format strings supported:**
- `{{date:YYYY-MM-DD}}` → `2024-01-15`
- `{{date:dddd, MMMM Do YYYY}}` → `Monday, January 15th 2024`
- `{{time:HH:mm:ss}}` → `14:30:25`
- `{{time:h:mm A}}` → `2:30 PM`

Uses [Moment.js format tokens](https://momentjs.com/docs/#/displaying/format/) - same as Obsidian's official Templates plugin.

### Example Template

Create a template file with content like this:
```markdown
---
created: {{date:YYYY-MM-DD}}
day: {{date:dddd}}
time: {{time:h:mm A}}
---

# {{title}}

Created on {{date:MMMM Do, YYYY}} at {{time:HH:mm}}

## Notes

```

When applied to a new note named "Meeting Notes", this becomes:
```markdown
---
created: 2024-01-15
day: Monday  
time: 2:30 PM
---

# Meeting Notes

Created on January 15th, 2024 at 14:30

## Notes

```

## Quick Start

1. **Enable** the plugin in Settings → Community Plugins
2. **Go to** plugin settings → click "Select template"  
3. **Choose** any `.md` file from your vault
4. **Done!** Every new note gets your template automatically

## Installation

### Option 1: Community Plugins (Recommended)
1. Open Obsidian Settings → Community Plugins
2. Click "Browse" and search for "Default Template"
3. Click "Install" then "Enable"

### Option 2: Manual Installation
1. Download [latest release](https://github.com/raeperd/obsidian-default-template/releases) files
2. Create `VaultFolder/.obsidian/plugins/obsidian-default-template/` folder  
3. Extract all files into the folder
4. Restart Obsidian → Settings → Community Plugins → Enable

### Option 3: [BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Testing)
1. Install [BRAT plugin](https://obsidian.md/plugins?id=obsidian42-brat)
2. In BRAT settings, click "Add beta plugin"
3. Enter repository: `https://github.com/raeperd/obsidian-default-template`
4. Check "Enable after installing the plugin" option
5. Click "Add Plugin" button

### Option 4: Clone Repository
```bash
cd /path/to/vault/.obsidian/plugins/
git clone https://github.com/raeperd/obsidian-default-template.git
cd obsidian-default-template
npm install && npm run build
```

## References

- [Templates Plugin - Obsidian Help](https://help.obsidian.md/plugins/templates) (official documentation)
- [Default template feature request](https://forum.obsidian.md/t/default-template-for-new-note-cltr-n-click-to-non-existing-note/10332) (3+ years of user requests)
