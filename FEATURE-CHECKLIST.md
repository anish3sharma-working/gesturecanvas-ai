# Feature verification checklist

Status labels follow the acceptance rule: **Implemented and tested**, **Implemented but not fully tested**, or **Not implemented**. Automated coverage does not imply testing with physical hardware.

## Adaptive stroke stabilization

- [x] Configurable off/low/medium/high smoothing — **Implemented and tested** (`tests/smoothing.test.ts`).
- [x] Speed-adaptive smoothing: faster movement increases response alpha — **Implemented and tested** with deterministic simulated coordinates (`tests/smoothing.test.ts`).
- [x] Jitter filtering with bounded response — **Implemented and tested** using synthetic landmark traces; perceived end-to-end latency has not been measured on camera hardware.
- [x] User control to disable smoothing — **Implemented and tested** by unit algorithm coverage and settings control.

## Gesture controls

- [x] Optional pinch-to-draw with normalized gap and engage/release hysteresis — **Implemented and tested** at geometry level.
- [x] Open palm and closed fist recognition, each independently enabled, only pauses drawing — **Implemented but not fully tested**. Temporal debouncing is tested; realistic hand-angle/light variation needs webcam trials.
- [x] Gesture debounce and temporal stability — **Implemented and tested** with unit tests.
- [x] Immediate open-palm/fist stroke stop and optional adjustable hand-proximity pause with hysteresis — **Implemented and tested** with unit and controls tests; the size threshold is a relative camera-frame estimate and should be calibrated on the user's webcam.
- [x] Visible gesture status — **Implemented but not fully tested**; UI status exists, but live browser rendering could not be verified because local HTTP access is blocked in this device environment.
- [x] No gesture can erase artwork or change tools; the eraser is a deliberate toolbar choice — **Implemented and tested** by code-path inspection and separate eraser rendering tests.
- [x] Realistic webcam gesture robustness across varied users/camera setups — **Implemented but not fully tested**; classification heuristics exist, but physical webcam trials are required and synthetic tests do not establish real-world robustness.

## Drawing toolkit

- [x] Pen, marker, eraser, line, rectangle, ellipse, arrow and text — **Implemented and tested** for item creation/render paths (`tests/drawing.test.ts`). Pointer-created artwork is exercised by an App-level test; manual real-browser visual checks for every shape remain useful.
- [x] Select tool hit-testing and visible object selection — **Implemented and tested** across strokes, shapes and text (`tests/selection.test.ts` and `tests/appCamera.test.tsx`). Eraser marks are intentionally not selectable as independent artwork objects.
- [x] Drag selected object to reposition it — **Implemented and tested** with an App-level pointer interaction and immutable coordinate/history tests. Camera pinch can also pick up and drag an object while Select mode is active.
- [x] Delete selected object directly and undo/redo the change — **Implemented and tested** through the App-level select → drag → delete → undo flow and history unit tests. Deletion does not ask for confirmation because it is reversible through Undo.
- [x] Complete-item undo and redo — **Implemented and tested** for stroke history. Clear remains protected by confirmation; a full undo snapshot for clear is not promised.
- [x] Brush opacity, size, palette/custom color — **Implemented and UI control tested** (`tests/controls.test.tsx`); manual visual comparison remains pending.
- [x] Canvas solid/transparent/custom backgrounds and guides — **Implemented but not fully tested** in end-to-end rendering.
- [x] Live camera-feed canvas background — **Implemented and tested** for UI setting, active-stream layer wiring, camera-only display class and export isolation (`tests/controls.test.tsx`, `tests/appCamera.test.tsx`, `tests/selection.test.ts`). Actual physical camera compositing remains untested on hardware. It is excluded from saved artwork and PNG exports.
- [x] Symmetry and configurable guides — **Implemented but not fully tested** in end-to-end rendering.
- [x] Mouse/touch drawing fallback — **Implemented and tested** for mouse/pointer artwork creation and drag interaction in `tests/appCamera.test.tsx`; touch-specific browser/device behavior has not been separately exercised.

## Artwork management

- [x] IndexedDB save/load and storage fallback — **Implemented but not fully tested** against browser quota/private-mode failure injection.
- [x] Gallery, reopen, rename, confirmed delete — **Implemented but not fully tested** through a full browser session.
- [x] Transparent PNG export from artwork-only off-screen canvas — **Implemented and unit tested** for canvas isolation and PNG blob generation (`tests/drawing.test.ts`). Download behavior has not been browser-verified.
- [x] Corrupt records are validated and skipped; storage errors are surfaced — **Implemented but not fully tested** using real corrupted browser profiles.

## Runtime and delivery

- [x] Opt-in camera flow, explicit stop, inference loop cleanup and stream-track cleanup — **Implemented but not fully tested**; mocked app tests cover start/stop/restart and cleanup, but physical camera and live browser behavior could not be confirmed.
- [x] Simulated demo without camera with a visible SIMULATED label — **Implemented but not fully tested**; app component tests cover the demo path, while live browser rendering could not be verified.
- [x] Missing model failure explains how to recover and demo stays available — **Implemented but not fully tested**; the app recovers with the simulated demo when the asset is missing, but camera runtime behavior has not been tested.
- [x] One-time official pretrained model download — **Implemented but not fully tested**; the download succeeded and `public/models/hand_landmarker.task` (7,819,105 bytes, about 7.8 MB) is now present locally. It is excluded from Git, so fresh clones run the command documented in `README.md`; browser model initialization remains unverified.
- [x] Physical webcam inference and realistic hand accuracy — **Implemented but not fully tested**; the model file is now present, but testing requires a user-accessible camera and real browser session. Never represented as verified.
- [x] React application, TypeScript setup, production build and automated tests — **Implemented and tested**: 9 test files / 60 tests passed, typecheck passed, and production build passed; exact environment limitations are recorded in `docs/TESTING-SUMMARY.md`.
- [x] Live HTTP/browser smoke test — **Implemented but not fully tested** because the device denied localhost socket access and Vite/esbuild could not read the protected parent directory during dependency optimization. Production build success is not treated as a runtime smoke test.
