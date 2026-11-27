# Story Studio: product and release quality gate

This checklist defines what must be true before a build is offered for user testing or commercial release. A feature is not complete because its button exists or its JavaScript parses.

## Product contract

- [ ] The editor is reliable on Android Chrome and desktop Chrome; iOS Safari is checked before broad public release.
- [ ] The artwork remains the focal point. The preview uses the available workspace efficiently and preserves the artwork's proportions.
- [ ] The preview is not forced into a large visible 9:16 frame. It must leave room for the tool menu and contextual controls.
- [ ] With the keyboard open, the text field and a useful live preview remain visible. With it closed, the preview and controls reclaim the available space.
- [ ] Exported PNG dimensions are cropped to the visible artwork bounds, with a transparent background and no unnecessary canvas margins.
- [ ] The UI is understandable in Brazilian Portuguese, with consistent labels and clear feedback for loading, success, and errors.

## 1. Core creation flows

Test on a narrow mobile viewport and desktop viewport:

- [x] Open Create; the workspace, preview, toolbar, and contextual controls fit without horizontal overflow in Chromium mobile and desktop checks.
- [ ] Add, select, move, resize, rotate, duplicate, hide, lock, and delete a shape.
- [x] Add, select, edit, and move text; resize and delete remain for device/manual verification.
- [x] Edit text while the simulated keyboard is open; focus is retained and the preview and text field remain visible.
- [x] Close the simulated keyboard; the preview and controls return to their normal layout.
- [ ] Change font, font size, text width, alignment, color, outline, shadow, highlight, and curve. Confirm the artwork remains visible and updates correctly.
- [ ] Undo and redo restore the expected state without removing unrelated content.
- [ ] Layer controls, selection state, and layer count always match the actual document.
- [ ] Import a photo from the device; confirm it appears, can be selected, moved, resized, cropped, and deleted.
- [x] Remove the photo background using a real licensed portrait fixture; confirm successful cutout and transparent pixels. Failure handling is also tested: the original photo and sticker settings remain intact. Real-device retry UX remains to be checked.
- [ ] Edit the cutout: erase leftovers, change outline and shadow, and confirm the result is preserved.
- [x] Save a draft, simulate leaving immediately (pagehide), reload, and confirm text and shape layers are restored.
- [x] Save a real photo layer, simulate immediate exit, reload, and confirm the same layer/asset identities and decoded image dimensions are restored.

## 2. Export integrity

- [x] Export a design containing text, shapes, and a photo layer; real-photo cutout processing is separately verified.
- [x] Verify PNG dimensions are tightly cropped to visible artwork bounds, not the internal working canvas.
- [x] Verify transparent pixels remain transparent and no opaque background is introduced.
- [x] On mobile, export feedback stays in the editor panel flow and does not cover the artwork controls.
- [ ] Verify the exported image matches the preview, including curved text, outlines, shadows, crop, rotation, and multiple layers.
- [ ] Verify copy, download, and share actions provide clear feedback and work on supported devices.
- [ ] Test empty and edge cases: empty design, tiny object, object near an edge, and transparent-only artwork.

## 3. Visual and device evidence

- [x] Capture Chromium browser screenshots at mobile and desktop sizes.
- [x] Capture mobile preview with keyboard simulation closed and open.
- [x] Capture arc and circle selection states after the UI transition; assert the active and inactive mode buttons.
- [x] Capture shape, photo, and text editing states.
- [ ] Keep the screenshots or browser preview linked in the delivery summary.
- [ ] Never create mock screenshots or present a code diff as visual validation.
- [ ] If browser automation or real-browser access is unavailable, explicitly state "Visual validation not performed" and do not call the change complete.
- [ ] Complete a real-device Android check before release; complete an iOS Safari check before claiming broad mobile compatibility.

## 4. Reliability and accessibility

- [x] No uncaught browser errors during the automated core creation flows.
- [ ] External processing dependencies load reliably, have visible progress, and fail gracefully.
- [ ] Touch targets are comfortable; controls have labels and visible focus states.
- [ ] No action is available only through an undiscoverable gesture or color cue.
- [ ] Long-running operations do not freeze the editor; cancellation or retry is available where practical.
- [ ] Local drafts and language preferences survive reloads and app updates where expected.
- [ ] Performance is acceptable with high-resolution photos and multi-layer designs.

## 5. Deployment verification

- [ ] Confirm the expected commit is on the intended release branch.
- [ ] Check the GitHub Pages deployment/workflow status where available.
- [ ] Open the published URL with a cache-busting query and verify the served version where browser access is available.
- [ ] Distinguish "saved in GitHub", "deployment detected", and "visually verified".
- [ ] Do not describe a page as updated merely because a commit succeeded.
- [ ] Do not merge or publish while any core creation or export flow is failing or unverified.

## 6. Required delivery summary

Every delivery update must include:

1. **Implemented:** exact behavior changed and commit link.
2. **Visual feedback:** real screenshots/preview links, or an explicit statement that visual validation was not performed.
3. **Verification:** checklist items passed and items still untested.
4. **Deployment:** confirmed status, or state that it has not been confirmed.
5. **Known issues:** remaining limitations and the next concrete step.

## Current investigation

Status as of 2026-11-20. Latest product/browser QA passed on commit `d03e83cf604f1aa0c93ba3d443eadb6d07cbb98b` in [workflow run #260](https://github.com/studio-gh/story-studio/actions/runs/44763376599). The current PR head contains documentation-only QA records after the tested code commit; it was not a new browser-test run. This is strong browser evidence, not final release approval.

### Latest automated evidence (2026-11-20)

- [Workflow run #260](https://github.com/studio-gh/story-studio/actions/runs/44763376599) passed on the exact PR #6 head commit `d03e83cf604f1aa0c93ba3d443eadb6d07cbb98b`; all 14 workflow steps completed successfully.
- Added a dedicated real-photo draft recovery test. It imports the openly licensed 667 × 834 px portrait, flushes the draft on simulated page exit, reloads, and confirms the same layer ID and asset ID return with the same 62,743-character data URL and a fully decoded 667 × 834 image. The recovered document contains exactly one photo layer and no uncaught page errors.
- The existing text + shape recovery test also passed: 2 layers restored, text content retained, and no uncaught page errors.
- Real-photo background removal passed again at 667 × 834 px, with 132,720 transparent pixels and 388,855 opaque subject pixels.
- The circular PNG downloaded as `story-studio.png` at 936 × 992 px / 74,620 bytes. The composite PNG downloaded at 1,036 × 764 px / 73,270 bytes, with 382,580 fully transparent pixels, 408,576 pixels with alpha > 8, and four transparent corners. Both PNG files were opened and inspected; their SHA-256 hashes match the previous run #259 outputs byte-for-byte.
- The 17-file evidence artifact is available at [workflow artifact #14643290024](https://github.com/studio-gh/story-studio/actions/runs/44763376599/artifacts/14643290024). The new photo recovery screenshot is `v62-photo-draft-recovery.png`.
- This remains Chromium evidence. The compact keyboard is simulated; physical Android keyboard/safe-area/gallery checks and iOS Safari are still pending. The workflow asserts safe-area CSS declarations exist, but that is not a physical-device verification.

### Latest automated evidence (2026-11-18)

- [Workflow run #258](https://github.com/studio-gh/story-studio/actions/runs/44340209091) passed on the exact PR #6 head commit `d9e4d2f5daf9ac8317b335a18b22f98fbbb05b66`; all 13 workflow steps completed successfully.
- The mobile export confirmation now sits inside the editor panel flow, before the first visible control section. The browser test checks its actual position and confirms it does not cover the editing controls.
- Arc and circle mode are verified separately. The test confirms `curveMode === "arc"`, Arc selected, Circle unselected, and captures the screenshot after the selected-state transition.
- PT-BR default and PT-BR ↔ EN editor labels, live text editing, compact mobile keyboard emulation, text geometry, circular text, arc text, shape geometry, photo layer, and desktop home/editor states passed.
- Real-photo background removal completed with the licensed portrait fixture at 667 × 834 px. The processed result contained 132,720 transparent pixels and 388,855 opaque subject pixels.
- Draft recovery passed after immediate simulated page exit and reload: 2 layers restored (text and shape), with no browser errors. Photo-layer recovery remains untested.
- Circular PNG: 936 × 992 px, 74,620 bytes. Composite PNG: 1,036 × 764 px, 73,270 bytes; 382,580 fully transparent pixels, 408,576 visible pixels above the alpha threshold, and all four corners transparent. Both downloaded files were opened and inspected.
- The 16-file evidence artifact is available at [workflow artifact #14442783611](https://github.com/studio-gh/story-studio/actions/runs/44340209091/artifacts/14442783611).

### Previous automated evidence (2026-11-13)

- Mobile and desktop Chromium regression passed, including compact mobile viewport and simulated keyboard layout.
- Text editing, curved text, shape movement/clamping, layer controls, photo import, and PNG download passed.
- PNG export verified transparent pixels, transparent corners, and tight crop bounds.
- Background removal completed end-to-end with a real portrait photo, and the output contained both transparent background pixels and opaque subject pixels.
- Failure-path test confirmed the original photo and existing sticker settings remain unchanged when the model import fails; controls recover afterward.
- Draft persistence passed after an immediate simulated page exit and reload. Text and shape layers were restored.
- No uncaught browser errors in the tested flows.
- The real-photo QA fixture is [Portrait-sample.jpg](https://commons.wikimedia.org/wiki/File:Portrait-sample.jpg), by David Ball, licensed CC BY 2.5. It is used only for automated testing.

### Still required before release

- Physical Android test: real device keyboard, safe areas, touch gestures, and selecting a photo from the gallery.
- Test photo crop/resize/delete and cutout cleanup on a physical device.
- iOS Safari check before claiming broad mobile compatibility.
- Broader accessibility, share/copy, high-resolution image, and performance checks.
- Visually verify the published URL after deployment. Production remains on V61; V62 has not been merged or published.

Playwright Chromium is not a substitute for physical-device testing. Keep release approval blocked until the remaining device and compatibility checks are evidenced.

### Repository and deployment state

- The production root remains V61. `main` is now two commits beyond the V61 release commit because PR #9 added and updated six files under `/v62-preview/`.
- The root `index.html` and `manifest.json` blob SHAs are identical to those at V61 commit `e7ef3c25317ccf15bcf617698db953a9dbeb5072`; the two commits changed only the isolated `/v62-preview/` files. This extra route is a process deviation and must not be expanded or removed without explicit approval.
- PR #6 remains open as Draft and has not been merged. Its working branch is `design/v62-editorial-identity`, current head includes documentation-only QA records; the latest product/browser-tested commit is `d03e83cf604f1aa0c93ba3d443eadb6d07cbb98b`..
- The V62 branch is two commits behind the current `main` tip because of the preview-only commits. Do not update the branch automatically; that would bring the preview route into the PR diff.
- The last confirmed GitHub Pages production deployment remains the V61 deployment on 2026-10-30: [deployment run](https://github.com/studio-gh/story-studio/actions/runs/41045565012). The official URL was not visually verified in this session.

### Automated evidence completed

The latest browser regression, [run #230](https://github.com/studio-gh/story-studio/actions/runs/42648474564), passed on code commit `d294a53b1f92f0a8a4d9b715faf29c9a16947e4e`.

The run verified:

- Initial PT-BR language, switching to English, and switching back. It checked the editor heading, preview label, quick tools, paste, background removal, copy, and export labels.
- Live text editing and the curved-text preview.
- Mobile Chromium layouts at 390×844 and compact 390×460 viewport emulation. The simulated keyboard state kept the preview and text field visible.
- Circular text preview and a downloaded circular PNG (936×992 px).
- Arc text preview and a downloaded composite PNG (1036×764 px, 73,270 bytes), with transparent pixels and transparent outer corners.
- A real download through the Export PNG button, with the expected filename and valid PNG signature.
- Shape movement to the center and lower-right artboard boundary.
- Photo-layer import, contextual controls, and layer ordering. The automated image fixture is a synthetic 32×32 PNG, not a photograph from a device.
- Desktop home and editor screenshots at 1440×1000; the desktop home had three cards and no horizontal overflow.
- No uncaught page errors in the tested Chromium flows.

The canvas renderer for circular and arced text was corrected to follow the same path geometry as the live SVG preview. The generated circle and composite PNGs were opened and visually inspected; the output is cropped to the artwork bounds and retains transparency.

The run produced 14 evidence files, including mobile/desktop screenshots and both downloaded PNGs. See the [workflow artifact](https://github.com/studio-gh/story-studio/actions/runs/42648474564).

### Still required before release

- Test on a physical Android device: real keyboard opening/closing, device safe areas, touch behavior, and selecting a photo from the gallery.
- Import and edit a real photograph, including crop/resize/delete. The synthetic CI image does not prove the device gallery flow.
- Test background removal end-to-end with a real photo, including progress, transparency, retry, and cutout editing.
- Verify saved drafts survive leaving and reopening the editor.
- Complete broader checks for copy/share, accessibility, high-resolution images, and edge cases.
- Test iOS Safari before claiming broad mobile compatibility.
- Visually verify the official published URL when browser access is available. The production URL remains on V61 and was not changed by this work.

Playwright Chromium emulation is not a substitute for physical-device testing. Keep the release checkboxes open until the remaining manual checks are evidenced. V62 remains a Draft review build, not a release candidate.

### Latest automated evidence (2026-11-23 — run #285)

Product and browser-test commit: `32223969809b0c3b8eca6a67f2630d41c03f6fcd` on `design/v62-editorial-identity`.

- [GitHub Actions run #285](https://github.com/studio-gh/story-studio/actions/runs/45218845718) completed successfully. The `mobile-editor` job passed all 14 substantive workflow steps.
- The latest change to mobile export feedback was visually verified from the downloaded artifact, not only from DOM measurements. `v62-mobile-export-feedback.png` visibly shows the message in its own row; the pinned preview begins immediately below it and the contextual panel remains below the preview. `v62-mobile-export-feedback-toast.png` was also opened and inspected.
- Measured feedback state: toast y=175.09–227.09 px; preview top=228 px; panel top=492 px. Text `rgb(255,254,250)` on background `rgb(48,51,45)` gives a measured contrast ratio of 9.78:1, above WCAG AA's 4.5:1 threshold.
- PT-BR initial state and PT-BR ↔ EN editor labels/actions passed. Live text editing, 390×844 mobile, 390×460 compact/keyboard emulation, arc and circle modes, shape/photo flows, desktop 1440×1000, PNG downloads, and draft recovery passed.
- Real-photo background removal completed with a 667×834 px openly licensed fixture: 132,720 transparent pixels and 388,855 opaque subject pixels.
- Photo draft recovery after reload preserved the same layer ID, asset ID, 62,743-character image data URL, and decoded 667×834 dimensions. Text/shape draft recovery also passed.
- Both downloaded PNGs were opened and inspected: circular text 936×991 px / 74,401 bytes; composite 1,036×764 px / 73,090 bytes. The composite retained transparent outer corners and both transparent and visible pixels.
- All 19 files in artifact [14840530323](https://github.com/studio-gh/story-studio/actions/runs/45218845718/artifacts/14840530323) were downloaded. The contact sheet and key mobile/desktop screenshots, toast, photo recovery, cutout, and PNG files were inspected.
- The browser log includes the intentionally simulated model-load failure used to verify fallback behavior. The workflow's uncaught-error assertions passed; do not confuse this expected QA scenario with an unhandled application error.

### Still required before release (rechecked 2026-11-23)

- Physical Android verification: real keyboard opening/closing, device safe areas, touch gestures, and photo selection from the device gallery.
- On a physical device, verify photo crop/resize/delete and cutout-edge cleanup.
- iOS Safari compatibility check.
- [x] Automated Chromium: recovered a real 667×834 px photograph, combined it with text and a shape, and exported it. A with/without-photo pixel comparison confirmed 354,312 pixels contributed by the photograph. Physical-device gallery, crop/resize/delete, and cutout cleanup remain pending.
- Broader preview-versus-export comparison for outlines, shadows, crop, rotation, and multi-layer artwork.
- Broader accessibility, copy/share, high-resolution image, performance, and edge-case checks.
- Open and visually verify the official GitHub Pages URL after an approved production deployment. The official URL was not accessible from the current browser/network environment during this session; no live-page verification is claimed.

Chromium's simulated keyboard and safe-area CSS are not physical-device proof. PR #6 remains Draft and unmerged. No merge, production deploy, or change to `main` or the official URL was performed.

### Latest automated evidence (2026-11-23 — run #287)

- [GitHub Actions run #287](https://github.com/studio-gh/story-studio/actions/runs/45222521810) completed successfully on test commit `452b4514c570ed93370160881da011f54fa7a8d8`; the `mobile-editor` job completed all substantive steps.
- The photo-recovery test now continues after reload: it composes the recovered real 667×834 px portrait with a text layer and an orange circle, then downloads a PNG through the editor's Export button.
- The test renders the same composition once with the photo visible and once with that layer hidden. Both renders retain identical crop dimensions (1,108×1,988 px); the photo contributes 354,312 changed/opaque pixels. This proves the real photo is present in the rendered artwork, rather than merely present in the layer list.
- The downloaded file is a valid PNG, 650,705 bytes. I opened the PNG and its preview screenshot; the portrait, headline and orange shape are all visibly present. The artifact contains 21 files, including `v62-real-photo-recovery-export-preview.png` and `story-studio-real-photo-recovery-export.png`: [artifact #14840239707](https://github.com/studio-gh/story-studio/actions/runs/45222521810/artifacts/14840239707).
- Photo recovery after reload still preserves the same layer ID, asset ID, 62,743-character image data URL and decoded 667×834 dimensions. Text/shape recovery and real-photo background removal also passed.
- This closes the automated real-photo-recovery-to-PNG flow. The earlier generic composite test still uses a small synthetic fixture; the new dedicated test is the evidence for real-photo export.

### Still required before release (rechecked 2026-11-23)

- Physical Android verification: real keyboard opening/closing, device safe areas, touch gestures, and photo selection from the device gallery.
- On a physical device, verify photo crop/resize/delete and cutout-edge cleanup.
- iOS Safari compatibility check.
- Broader preview-versus-export comparison for outlines, shadows, crop, rotation, and multi-layer artwork.
- Broader accessibility, copy/share, high-resolution image, performance, and edge-case checks.
- Open and visually verify the official GitHub Pages URL after an approved production deployment. The official URL was not accessible from the current browser/network environment during this session; no live-page verification is claimed.

Chromium's simulated keyboard and safe-area CSS are not physical-device proof. PR #6 remains Draft and unmerged. No merge, production deploy, or change to `main` or the official URL was performed.

### Compact keyboard viewport regression (2026-11-25 — run #290)

- The V80 keyboard layout now sizes the preview from the available visual viewport instead of forcing a 230 px minimum. The contextual panel's minimum height is capped by the space actually available, preventing its minimum from pushing it below the visible viewport.
- The existing keyboard simulation now covers 390×460, 390×320, and 390×280 visible viewports. Assertions verify that the preview wrapper stays within the viewport, the editor panel starts below it, and the panel bottom stays within the visible height.
- [GitHub Actions run #290](https://github.com/studio-gh/story-studio/actions/runs/45647070029) completed successfully. The keyboard geometry step and the full editor/photo/recovery/export regression both passed.
- The downloaded artifact contains 24 files, including three new screenshots: `v62-keyboard-viewport-460.png`, `v62-keyboard-viewport-320.png`, and `v62-keyboard-viewport-280.png`. All three were opened and inspected.
- At 460 px, the preview and text field remain comfortably visible. At 320 px, the preview is reduced but remains visible and the text field is visible. At 280 px, the preview is very compact and lower controls extend below the captured viewport; this is an edge-case stress capture, not proof of a comfortable physical-device experience.
- These are Chromium viewport/visualViewport simulations. They do not open a physical keyboard, reproduce real device safe-area insets, or replace Android/iOS device testing.

### Still required before release (rechecked 2026-11-25)

- Physical Android verification: real keyboard opening/closing, device safe areas, touch gestures, and photo selection from the device gallery.
- On a physical device, verify photo crop/resize/delete and cutout-edge cleanup.
- iOS Safari compatibility check.
- Broader preview-versus-export comparison for outlines, shadows, crop, rotation, and multi-layer artwork.
- Broader accessibility, copy/share, high-resolution image, performance, and edge-case checks.
- Open and visually verify the official GitHub Pages URL after an approved production deployment. The URL could not be opened from the current browser/network environment; no live-page verification is claimed.

Chromium's simulated keyboard and safe-area CSS are not physical-device proof. PR #6 remains Draft and unmerged. No merge, production deploy, or change to `main` or the official URL was performed.


### Latest automated evidence (2026-11-27 — runs #293–#294)

- [GitHub Actions run #293](https://github.com/studio-gh/story-studio/actions/runs/46025577522) passed after adding explicit checks that the text-edit completion action can be reached by scrolling the editor panel at 390×460, 390×320, and 390×280. At 280 px, clicking **Concluir edição** successfully removed the keyboard state. The artifact includes three `v62-keyboard-done-action-*.png` screenshots.
- [GitHub Actions run #294](https://github.com/studio-gh/story-studio/actions/runs/46025886476) passed on commit `0ee515c995412ef02d75ebe0ebc607c0a70aaf8a`. It adds a desktop assertion for the character counter when a prefilled text layer is created. The counter now reads `19 / 120` for “Desktop layer check”; the final screenshot `v62-desktop-selected-layer.png` was opened and inspected.
- Run #294 completed all substantive workflow steps: PT-BR initial language and EN toggle, editor translations in both languages, live text preview, mobile and desktop Chromium layouts, keyboard viewport checks, arc and 360-degree circular text geometry, shape creation/dragging, photo import, background removal and failure recovery, draft recovery, and PNG export.
- The background-removal fixture was 667×834 px and produced 132,720 transparent pixels and 388,855 opaque pixels. A failed model-load simulation preserved the original photo, left sticker styling unchanged, and re-enabled the action.
- Text/shape recovery after reload passed. Photo recovery retained the same layer ID and asset ID, the 62,743-character image data URL, and decoded 667×834 px dimensions.
- The recovered photo was exported with text and a shape. The PNG is valid, 1,108×1,988 px and 650,705 bytes; comparing renders with and without the photo confirmed 354,312 pixels contributed by the photograph.
- Artifact [#15210329922](https://github.com/studio-gh/story-studio/actions/runs/46025886476/artifacts/15210329922) contains 27 files. Key desktop/mobile, arc/circle, keyboard-action, photo-recovery, cutout, and PNG screenshots were opened and visually inspected.
- The intentional `QA simulated model load failure` console message is part of the fallback test. The workflow's uncaught-error assertions passed; this was not an unhandled application failure.

### Still required before release (rechecked 2026-11-27)

- Physical Android verification: real keyboard opening/closing, device safe areas, touch gestures, and photo selection from the device gallery.
- Physical-device photo crop/resize/delete and cutout-edge cleanup.
- iOS Safari compatibility check.
- Stress-test large/high-resolution photos and multiple images. Current recovery evidence uses one 667×834 px photo stored as a data URL; localStorage quota behavior is not yet proven for large projects.
- Broader preview-versus-export comparison for outlines, shadows, crop, rotation, and multi-layer artwork.
- Broader accessibility, copy/share, performance, and edge-case checks.
- Open and visually verify the official GitHub Pages URL after an approved production deployment. External network access was unavailable in this run, so no live-page or physical-device verification is claimed.
- The existing `/v62-preview/` Pages path is not a valid current-branch preview: its `index.html` matches the V62 branch, but its CSS and JS blobs differ. Do not use it as current V62 evidence. No new preview branch or deployment was created.

Chromium keyboard/safe-area simulation is not physical-device proof. PR #6 remains Draft and unmerged. No merge, production deployment, change to `main`, or change to the official URL was performed.
