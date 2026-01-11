---
description: Release new plugin version
---

Release a new version of the Obsidian plugin.

Usage: /release <major|minor|patch>

This command will:
1. Update version using npm version $1
2. Push version updates to main branch
3. Create and push a git tag
4. Trigger the GitHub release workflow

Version type can be:
- major: For breaking changes (e.g., 1.2.1 → 2.0.0)
- minor: For new features (e.g., 1.2.1 → 1.3.0)
- patch: For bug fixes (e.g., 1.2.1 → 1.2.2)

Execute the following steps:

1. Check that we're on main branch
2. Run `npm version $1` to update package.json, manifest.json, and versions.json
3. Push the changes with `git push`
4. Create tag with the new version
5. Push the tag to trigger the release workflow
6. Verify the release workflow is running

Current version:!`jq -r '.version' package.json`
