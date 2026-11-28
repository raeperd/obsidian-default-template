---
name: obsidian-test
description: Test this plugin in the running Obsidian app through the Obsidian CLI. Use to check a change to the settings tab or template application in the app, or before a release.
---

Drive `test-vault` with the `obsidian` CLI. `obsidian help` lists the commands. If it says the CLI is not enabled, ask the user to turn it on in Settings > General > Advanced.

## Rules

- Pass `vault=test-vault` on every command. The user's personal vault is open too.
- Write `eval code=` as one expression. A top-level `return` fails, so wrap several statements in `(async () => { ... })()`.
- The settings window is a popout that `eval`'s `document` cannot reach. Use `app.setting`: `open()`, `close()`, `openTabById('default-template')`, `tabContentContainer` for the DOM, and `searchComponent.setValue(q)` with `onSearchChanged()` and `searchResultsEl` for settings search.
- Type into an input one keystroke at a time: set `value` and dispatch an `input` event for each prefix (`P`, `Pr`, `Projects/ClientB`). A single assignment hides bugs that run on every change.
- Find buttons by `aria-label`: `Add folder template`, `Add ignore path`, `Delete`.
- `dev:screenshot` captures only the main window, not the settings popout.

## Steps

1. Run `pnpm build`, copy `test-vault/.obsidian/plugins/default-template/data.json` to the scratchpad, and run `plugin:reload id=default-template`.
2. Exercise every behaviour the change touches.
   - For settings, close and reopen settings after each edit, and compare the rows with `data.json`.
   - For templates, `create path=<folder>/<name>.md`, wait a second, and read the note with `eval`. The folder rules in `data.json` decide which template is expected.
3. Run `dev:errors`. It must print `No errors captured.`
4. Clean up: restore `data.json` from the copy, run `plugin:reload` again, and delete each test note with `delete path=... permanent`.

Done when every touched behaviour gave the expected result in the app, `dev:errors` is clean, `data.json` matches the copy, and no test note remains.
