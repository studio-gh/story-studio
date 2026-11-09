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

- [ ] Open Create; the workspace, preview, toolbar, and contextual controls fit without horizontal overflow.
- [ ] Add, select, move, resize, rotate, duplicate, hide, lock, and delete a shape.
- [ ] Add, select, edit, move, resize, and delete text.
- [ ] Edit text while the keyboard is open; focus is retained, the preview stays useful, and the page does not jump unexpectedly.
- [ ] Close the keyboard; the preview and controls return to their normal layout.
- [ ] Change font, font size, text width, alignment, color, outline, shadow, highlight, and curve. Confirm the artwork remains visible and updates correctly.
- [ ] Undo and redo restore the expected state without removing unrelated content.
- [ ] Layer controls, selection state, and layer count always match the actual document.
- [ ] Import a photo from the device; confirm it appears, can be selected, moved, resized, cropped, and deleted.
- [ ] Remove the photo background using a real image. Confirm progress, successful cutout, transparency, and useful error/retry feedback when processing cannot complete.
- [ ] Edit the cutout: erase leftovers, change outline and shadow, and confirm the result is preserved.
- [ ] Save a draft, leave the editor, return, and confirm the work is still available.

## 2. Export integrity

- [ ] Export a design containing text, shapes, and a photo cutout.
- [ ] Verify PNG dimensions are tightly cropped to visible artwork bounds, not the internal working canvas.
- [ ] Verify transparent pixels remain transparent and no opaque background is introduced.
- [ ] Verify the exported image matches the preview, including curved text, outlines, shadows, crop, rotation, and multiple layers.
- [ ] Verify copy, download, and share actions provide clear feedback and work on supported devices.
- [ ] Test empty and edge cases: empty design, tiny object, object near an edge, and transparent-only artwork.

## 3. Visual and device evidence

- [ ] Capture real browser screenshots at mobile and desktop sizes.
- [ ] Capture mobile preview with keyboard closed and open.
- [ ] Capture shape, photo, and text editing states.
- [ ] Keep the screenshots or browser preview linked in the delivery summary.
- [ ] Never create mock screenshots or present a code diff as visual validation.
- [ ] If browser automation or real-browser access is unavailable, explicitly state "Visual validation not performed" and do not call the change complete.
- [ ] Complete a real-device Android check before release; complete an iOS Safari check before claiming broad mobile compatibility.

## 4. Reliability and accessibility

- [ ] No uncaught browser errors during the core creation flows.
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

Status as of 2026-11-09. This is an automated QA update, not release approval.

### Repository and deployment state

- Public `main` remains V61 at `e7ef3c25317ccf15bcf617698db953a9dbeb5072`.
- The last GitHub Pages deployment for that commit completed successfully on 2026-10-30: [deployment run](https://github.com/studio-gh/story-studio/actions/runs/41045565012).
- PR #6 remains open as Draft, based on `main`, and has not been merged.
- The V62 working branch remains `design/v62-editorial-identity`.

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
