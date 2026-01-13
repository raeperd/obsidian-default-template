# Default Template Plugin

![Obsidian Downloads](https://img.shields.io/badge/dynamic/json?logo=obsidian&color=%23483699&label=downloads&query=%24%5B%22default-template%22%5D.downloads&url=https%3A%2F%2Fraw.githubusercontent.com%2Fobsidianmd%2Fobsidian-releases%2Fmaster%2Fcommunity-plugin-stats.json)
![GitHub Release](https://img.shields.io/github/v/release/raeperd/obsidian-default-template)

Automatically apply your chosen template to every new note. No more manual template insertion—just create notes and get consistent structure instantly.

## Features

- **Set once, forget forever** — Choose any template file, never manually insert again
- **Works everywhere** — Ctrl+N, clicking non-existent links, any note creation method
- **Folder templates** — Different templates for different folders with hierarchy fallback
- **Ignore paths** — Skip template application for specific folders
- **Template variables** — Processes `{{date}}`, `{{time}}`, `{{title}}` like the official Templates plugin
- **Zero interference** — No template selected? Plugin does nothing

## Quick Start

1. Enable the plugin in **Settings → Community Plugins**
2. Go to plugin settings and click **Select template**
3. Choose any `.md` file from your vault — done!

## Template Variables

| Variable | Output | Description |
|----------|--------|-------------|
| `{{title}}` | `My New Note` | Note filename |
| `{{date}}` | `2024-01-15` | Current date (YYYY-MM-DD) |
| `{{time}}` | `14:30` | Current time (HH:mm) |

**Format strings supported:**

| Example | Output |
|---------|--------|
| `{{date:YYYY-MM-DD}}` | `2024-01-15` |
| `{{date:dddd, MMMM Do YYYY}}` | `Monday, January 15th 2024` |
| `{{time:HH:mm:ss}}` | `14:30:25` |
| `{{time:h:mm A}}` | `2:30 PM` |

Uses [Moment.js format tokens](https://momentjs.com/docs/#/displaying/format/) — same as Obsidian's official Templates plugin.

### Example Template

```markdown
---
created: {{date:YYYY-MM-DD}}
---

# {{title}}

## Notes
```

## Folder Templates

Assign different templates to specific folders. Notes in `Projects/` can use a project template while notes in `Journal/` use a daily template.

**Hierarchy fallback:** If `Projects/Work/ClientA/` has no template, it checks `Projects/Work/`, then `Projects/`, then falls back to default.

## Ignore Paths

Exclude folders where templates shouldn't be applied. Useful for scratch notes, temporary files, or areas where templates would be intrusive.

## Installation

### Community Plugins (Recommended)

1. Open **Settings → Community Plugins**
2. Click **Browse** and search for "Default Template"
3. Click **Install** then **Enable**

### Manual Installation

Download the [latest release](https://github.com/raeperd/obsidian-default-template/releases) and extract files to `VaultFolder/.obsidian/plugins/obsidian-default-template/`

### BRAT (Beta Testing)

Add `https://github.com/raeperd/obsidian-default-template` in [BRAT](https://github.com/TfTHacker/obsidian42-brat) settings.

## References

- [Templates Plugin - Obsidian Help](https://help.obsidian.md/plugins/templates)
- [Feature request thread](https://forum.obsidian.md/t/default-template-for-new-note-cltr-n-click-to-non-existing-note/10332) (3+ years of user requests)
