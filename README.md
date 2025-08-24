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
✅ **Template variables** - Processes `{{date}}`, `{{time}}`, `{{title}}` like official Templates plugin  
✅ **Zero interference** - No template selected? Plugin does nothing

## Template Variables

**Supports official Obsidian template variables:**

- `{{title}}` → `My New Note` (filename)
- `{{date}}` → `2024-01-15` (YYYY-MM-DD)
- `{{time}}` → `14:30` (HH:mm)

**No format strings** (like `{{date:YYYY-MM-DD}}`) in this minimal version.

### Example Template

Create a template file with content like this:
```markdown
---
created: {{date}}
time: {{time}}
---

# {{title}}

Created on {{date}} at {{time}}

## Notes

```

When applied to a new note named "Meeting Notes", this becomes:
```markdown
---
created: 2024-01-15
time: 14:30
---

# Meeting Notes

Created on 2024-01-15 at 14:30

## Notes

```

## Quick Start

1. **Enable** the plugin in Settings → Community Plugins
2. **Go to** plugin settings → click "Select template"  
3. **Choose** any `.md` file from your vault
4. **Done!** Every new note gets your template automatically

## Installation

### From Releases (Recommended)
1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/raeperd/obsidian-default-template/releases)
2. Create folder `VaultFolder/.obsidian/plugins/obsidian-default-template/`
3. Copy the downloaded files into the folder
4. Reload Obsidian and enable the plugin in Settings → Community Plugins

### Manual Build
```bash
git clone https://github.com/raeperd/obsidian-default-template.git
cd obsidian-default-template
npm install
npm run build
```

## References

**User demand:**
- [Default template for new note - Obsidian Forum](https://forum.obsidian.md/t/default-template-for-new-note-cltr-n-click-to-non-existing-note/10332) (3+ years of requests)
- [Add a Default Template for New Notes - Obsidian Forum](https://forum.obsidian.md/t/add-a-default-template-for-new-notes/75223)

**Similar solutions:**
- [new-note-default-template](https://github.com/somsomers/new-note-default-template)
- [obsidian-hotkeys-for-templates](https://github.com/Vinzent03/obsidian-hotkeys-for-templates)

**Official docs:**
- [Templates Plugin - Obsidian Help](https://help.obsidian.md/plugins/templates)  
- [Obsidian Plugin API](https://github.com/obsidianmd/obsidian-api)
- [Plugin Development Guide](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
