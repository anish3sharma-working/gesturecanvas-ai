# GestureCanvas AI — Project report

## Abstract

GestureCanvas AI is a local-first drawing studio that maps hand movement to digital artwork. It uses a pretrained MediaPipe Hand Landmarker task to infer hand landmarks from camera frames in the browser. A tracked fingertip can control a separate HTML Canvas drawing surface. Camera-free simulated coordinates and pointer-based drawing make the visual interaction available when a camera or tracking model cannot be used.

## Problem and objectives

Traditional drawing software depends on mouse, stylus or touch input. This project investigates a contact-free interaction method appropriate for demonstrations and introductory computer-vision coursework. Its objectives are to request webcam access only after explicit user action, process frames locally, estimate hand landmarks, stabilize fingertip coordinates, apply those coordinates to a drawing engine, and persist/export artwork separately from the camera feed.

## Why this is image processing and computer vision

Each camera frame is an image signal. MediaPipe's pretrained palm detector and landmark model analyze that signal to localize a hand and estimate its 21 keypoints. Gesture logic interprets spatial relationships among those image features. The system transforms normalized image-space coordinates through scale, crop and mirror operations into canvas coordinates. This combines image acquisition, learned visual-feature inference, geometric measurement and raster/vector rendering. The system does not recognize faces or identify a person.

## Architecture and workflow

The browser permission flow acquires a video-only MediaStream on demand. The mirrored video is a distinct display layer. MediaPipe Tasks Vision loads its local WebAssembly runtime and the `hand_landmarker.task` model, then processes up to two hands. Result landmarks and handedness feed geometric gesture classification and an adaptive low-pass stabilizer. The index fingertip is mapped to the canvas, where drawing objects are batched and rendered. History stores complete drawing items for undo/redo. IndexedDB stores named artworks; PNG export renders the artwork onto an off-screen canvas without including video or controls.

The smoothing algorithm uses an exponential update. Its base response is configurable across four levels. At each sample, movement distance divided by elapsed milliseconds estimates normalized speed. Faster movement raises the interpolation response to reduce lag; slow small movements retain stronger filtering. Simulated points in `tests/smoothing.test.ts` verify bounds, speed response, reset behavior and jitter filtering. This is unit evidence, not a claim of measured camera accuracy.

Pinch uses the distance between thumb tip 4 and index tip 8 normalized by wrist-to-middle-MCP scale, plus separate engage and release thresholds. Open palm, fist, index and two-finger states are estimated from landmark geometry. A multi-frame debouncer prevents isolated classifications from taking effect. Only explicitly enabled pinch-to-draw and open-palm/fist pause behaviors affect gesture drawing. No gesture performs erasing or tool selection.

## Tests and evidence

The Vitest suite covers deterministic simulated smoothing traces, gesture distances and thresholds, temporal stability, mirror mapping, invalid dimensions, device-pixel calculations, tool drawing objects, item history, export-layer isolation and toolbar controls. Browser-based e2e tests and physical webcam trials are outside the present test environment. Actual results and limitations are listed in `TESTING-SUMMARY.md` and `FEATURE-CHECKLIST.md`.

## Privacy and safety

The user initiates camera access through Start camera. The app requests no audio, records no video, uploads no frames, and avoids facial analysis. Media tracks and animation frames are stopped on camera shutdown or page exit. Artwork is stored locally in the current browser profile. Gestures cannot erase work or change tools; clearing the drawing requires a confirmation dialog.

## Limitations and future work

Landmark geometry heuristics can vary with camera angle, occlusion, hand size and lighting. Physical-camera evaluation across multiple conditions remains necessary. Synchronous inference can block the UI on slower devices; a worker-based inference path would improve scheduling. The official model bundle could not be downloaded in the creation environment because network authentication failed. The one-time model installation path is documented. Useful future work includes physical-device user testing, a worker pipeline, confidence visualizations, richer accessibility testing and model download checksums.

## Examiner demonstration script

1. Explain that camera access is opt-in, and select **Try demo** to show the app without webcam permission. Point out the explicit simulated indicator.
2. Select **Start drawing**, move the simulated fingertip and show the independent drawing layer. Emphasize that the simulation validates interaction only, not the ML detector.
3. Switch stabilization through off, low, medium and high; show the cursor behavior and explain the speed-adaptive unit tests.
4. Turn on pinch-to-draw and point out the visible stable gesture status. Demonstrate that open palm/fist are pause-only controls and cannot change the tool or erase.
5. Demonstrate the pen, marker, eraser, line, rectangle, ellipse, arrow and text tools using pointer input. Show color, size, opacity, undo and redo.
6. Change the background, toggle a guide and symmetry. Export transparent PNG and explain that the exporter uses artwork items, not a screenshot.
7. Save a named artwork, reopen it from the local gallery, rename it, and show the confirmation before deletion.
8. Finish with privacy: stop the camera explicitly if one was started. State whether the physical camera path has actually been validated for this presentation environment.
