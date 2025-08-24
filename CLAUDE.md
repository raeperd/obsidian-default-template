# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a minimal Obsidian plugin that automatically applies a default template to new empty notes. The plugin follows a "do one thing well" philosophy with no single-use helper functions and maximum code conciseness.

## Development Commands

- `npm run dev` - Start development with hot reload
- `npm run build` - Build for production (includes TypeScript check)
- `npm run version` - Bump version and update manifest/versions files

## Architecture

**Single-file architecture**: All plugin logic is contained in `main.ts` with three classes:

- `DefaultTemplatePlugin` - Main plugin class that registers event handlers and settings
- `TemplateSelectModal` - FuzzySuggestModal for selecting template files from vault
- `DefaultTemplateSettingTab` - Simple settings UI with template selection button

**Core mechanism**: Listens to `app.vault.on('create')` events and applies template to empty markdown files immediately after creation.

**Template processing**: Inline template variable replacement (`{{date}}`, `{{time}}`, `{{title}}`) matching Obsidian's official Templates plugin format.

## Key Design Principles

**Minimal by design**: No commands, no complex configuration, single setting (template file path).

**Robust error handling**: Graceful degradation when template files are missing/deleted with user-friendly notices.

**Code style**: Functions are inlined rather than abstracted when used only once. All template processing logic is embedded directly in the event handler.

## Plugin Files

- `main.ts` - Single source file containing all plugin logic
- `manifest.json` - Plugin metadata (version, description, compatibility)
- `styles.css` - Minimal styling (mostly empty)
- `versions.json` - Version compatibility tracking

## Release Process

Plugin releases require three files: `main.js`, `manifest.json`, `styles.css`. These are packaged both as individual downloads and as a ZIP file for easy installation.

## Template Variables

Supports three official Obsidian template variables:
- `{{date}}` - YYYY-MM-DD format
- `{{time}}` - HH:mm format  
- `{{title}}` - Note filename (basename)

Format strings (like `{{date:YYYY-MM-DD}}`) are intentionally not supported to maintain simplicity.