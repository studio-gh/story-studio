# Story Studio — Personal Creative Workspace

## Product direction (2026-11-25)

Story Studio is now a personal creative tool for its owner's everyday visual work. It is not being prepared as a commercial product or public launch.

The goal is to make the editor genuinely useful, fast, dependable, and enjoyable in the owner's own creative workflow. The V61 code in the root of `main` remains a stable reference; V62 on `design/v62-editorial-identity` remains the active working line. This direction change does not authorize merging or publishing.

## Principles

- **Personal utility over product-market fit:** prioritize features the owner will actually use.
- **Local-first by default:** projects and assets stay on the device unless cloud sync is explicitly requested later.
- **Protect creative work:** autosave, recovery, backup, and clear storage behavior are core features.
- **Fast creative flow:** minimize steps between an idea and a finished graphic.
- **Visual freedom:** support experimentation without adding commercial onboarding, pricing, accounts, or paywalls.
- **Keep the editor dependable:** every meaningful change must preserve text, shapes, photos, layers, undo/redo, and PNG export.

## Current foundation

The current branch already includes:
- Live text editing, typography, arc and circular text.
- Shapes, photo import, background removal, crop controls, layers, and PNG export.
- Automatic recovery of text, shape, and real-photo layers after reload.
- PT-BR/EN language toggle.
- Responsive mobile and desktop editor layouts.

Latest verified browser run at the time of this document: [GitHub Actions #291](https://github.com/studio-gh/story-studio/actions/runs/45647583465), successful on the current PR #6 head. This is Chromium automation, not physical-device proof.

## Personal roadmap

### P0 — Make personal work safe and reusable

1. **Multiple named projects**
   - Create, open, rename, duplicate, and delete projects.
   - Show recent projects and last-edited time.
   - Keep each project's layers, settings, and assets independent.
   - Confirm before destructive deletion.

2. **Reliable local storage**
   - Move large photo/image assets from `localStorage` data URLs to IndexedDB blobs.
   - Keep project metadata and small preferences separate from binary assets.
   - Add versioned data migrations and graceful recovery for older drafts.
   - Detect storage failures/quota limits and explain what happened without silently losing work.

3. **Portable backup**
   - Export a complete project package containing editable layers and assets.
   - Import that package on the same or another device.
   - Keep PNG export as the final-artwork path; project backup is a separate editable format.

### P1 — Make everyday creation faster

4. **Personal presets**
   - Save reusable color palettes, font combinations, text treatments, and shape styles.
   - Create a few owner-defined canvas presets while retaining 9:16 as the default.
   - Reapply a preset without flattening editable layers.

5. **Better personal library**
   - Search and filter projects.
   - Mark favorites.
   - Duplicate a previous design as a starting point.
   - Distinguish editable projects from exported PNGs.

6. **Editing comfort**
   - Improve selection, alignment guides, snapping, multi-select/grouping where useful.
   - Keep crop, resize, rotate, opacity, and layer ordering predictable.
   - Add only keyboard shortcuts that help the owner's desktop workflow.

### P2 — Optional conveniences, only if useful

7. Optional installable/PWA behavior and offline readiness.
8. Optional device-to-device sync or backup. Do not add accounts or a backend unless the owner asks for them.
9. Optional integrations with other Studio GH tools, designed only when a real shared workflow exists.

## Explicitly out of scope for now

- Gumroad, licensing, subscriptions, pricing, Free/Pro/Lifetime tiers.
- Paywalls, account systems, commercial onboarding, public launch checklists.
- Merge or deployment of V62 to the official GitHub Pages URL without a separate explicit request.
- Cloud sync or a server database before local-first needs are solved.

## Working process

- Work in sessions of at most 45 minutes.
- Choose one useful personal outcome per session.
- Work only on the existing V62 branch unless the owner explicitly changes that instruction.
- Verify the final behavior and inspect generated screenshots/files; a successful setup step is not a passing test.
- At session end, report what changed, evidence, remaining risks, and the next useful step in plain language.
- Do not ask the owner to perform technical implementation tasks.

## Recommended next implementation

Start P0.1: replace the single global draft as the only working document with a small local project library supporting create/open/rename/duplicate/delete. Before implementing, map the current `stickerStudioDraft`, `stickerStudioSaved`, and image `assetStore` flows so existing work is migrated safely. Then move image blobs to IndexedDB in a separate, testable step.
