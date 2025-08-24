# Default Template Plugin

A minimal plugin that automatically applies a default template to new empty notes.

## What it does

1. **Select a template file**: Choose any markdown file in your vault as your default template
2. **Auto-apply to new notes**: When you create a new note, if it's empty, the template content is automatically applied
3. **Process template variables**: Replaces template variables with actual values
4. **That's it**: No commands, no complex settings, just one simple function

## Template Variables

The plugin supports these template variables (matching Obsidian's official Templates plugin):

- `{{title}}`: Title of the active note → `My New Note`
- `{{date}}`: Today's date (YYYY-MM-DD) → `2024-01-15`
- `{{time}}`: Current time (HH:mm) → `14:30`

> **Note**: Format strings like `{{date:YYYY-MM-DD}}` are not supported in this minimal version.

For more information about template variables and formatting options, see the [official Obsidian Templates documentation](https://help.obsidian.md/Plugins/Templates).

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

## How to use

1. **Enable the plugin** in Obsidian's Community Plugins settings
2. **Go to plugin settings** and click "Select template"
3. **Choose any markdown file** from your vault as your default template
4. **Create new notes** - if they're empty, your template will be automatically applied

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

## No template selected?

If you haven't selected a default template, the plugin does nothing. It won't interfere with your workflow.
