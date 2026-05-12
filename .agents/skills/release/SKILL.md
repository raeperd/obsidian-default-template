---
name: release
description: Release this Obsidian plugin. Use when the user asks to release, publish, bump version, create a tag, or trigger the GitHub release workflow for this repo.
---

Release a new version of this Obsidian plugin.

## Inputs

Version type must be one of:

- `major` for breaking changes, e.g. `1.2.1` → `2.0.0`
- `minor` for new features, e.g. `1.2.1` → `1.3.0`
- `patch` for bug fixes, e.g. `1.2.1` → `1.2.2`

If the user does not specify the version type, ask before continuing.

## Workflow

1. Confirm the working tree is clean with `git status --short`.
2. Confirm the current branch is `main`.
3. Run `npm version <major|minor|patch>`.
   - This updates `package.json`, `package-lock.json`, `manifest.json`, and `versions.json`.
   - It also creates the version commit and git tag.
4. Push the version commit with `git push`.
5. Push the tag with `git push origin <tag>`.
6. Verify the GitHub release workflow started for the new tag.
   - Use `gh run list --workflow "Release Obsidian plugin" --event push --json databaseId,headBranch,status,conclusion,url`.
   - Find the run whose `headBranch` is the new tag.
   - If it has not appeared yet, wait briefly and check again.
   - Inspect it with `gh run view <run-id>`.
7. Report the new version, tag, and workflow URL.

## Safety checks

- Do not release from a dirty working tree.
- Do not release from a branch other than `main` unless the user explicitly asks.
- Do not invent a version type. Ask when missing or ambiguous.
- The release workflow should upload `main.js`, `manifest.json`, and `styles.css` and generate artifact attestations for them.
