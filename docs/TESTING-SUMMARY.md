# Testing summary

## Checks completed on the active device

| Check | Result | Details |
|---|---|---|
| Unit and component tests | **Passed** | 9 test files; 60 tests passed with Vitest. Coverage includes simulated smoothing traces, gesture geometry/debounce, drawing/rendering/history, storage validation, controls, mocked camera/demo lifecycle and camera-background wiring, and pointer-driven select/move/delete/undo. |
| TypeScript | **Passed** | `npm run typecheck` (`tsc --noEmit`). |
| Production build | **Passed** | `npm run build`; Vite 6.4.4 transformed 1,593 modules and emitted the production bundle. |
| Development server / browser runtime | **Partially verified** | The user-visible browser context displayed the GestureCanvas studio at `http://127.0.0.1:4174/` and showed its missing-model message, confirming that the page can render when launched from the user's local browser. The agent's isolated browser and direct shell TCP client could not reach local ports; the development server also fails this device's protected-parent dependency scan. Full interactive browser automation remains unavailable here. |
| Model asset | **Downloaded; initialization not tested** | `npm run model:download` succeeded and wrote the official 7,819,105-byte model to `public/models/hand_landmarker.task`; the production build copied the same-sized file to `dist/models/hand_landmarker.task`. The binary is intentionally Git-ignored; fresh clones need the documented one-time download. |
| Camera-feed canvas background | **Implemented; control/wiring/export tested** | The UI provides a live camera-feed background mode behind the artwork layer. App tests confirm it becomes visible only with an active camera and selected mode; unit tests confirm camera imagery is not painted into PNG exports. Actual physical camera compositing still needs hardware verification. |
| Select, drag, and direct delete | **Passed automated interaction test** | App-level pointer simulation creates an object, selects it, drags it, deletes it, and restores it with Undo; geometry and history logic have additional unit coverage. |
| Physical camera and real MediaPipe inference | **Not tested** | No physical camera trial was performed. The local model asset now exists, but mocked camera lifecycle tests do not prove browser model initialization, camera startup or real-world tracking accuracy. |

## Acceptance interpretation

The successful tests/build and the user's visible page establish automated coverage and a rendered studio preview. They do **not** establish physical camera permission/inference or real-world hand-pose robustness. See [`FEATURE-CHECKLIST.md`](../FEATURE-CHECKLIST.md) for per-feature status.

## Recovery and remaining manual verification

On a normal local development environment with standard access to the project and localhost sockets:

1. Run `npm install` and `npm run dev` from the project directory, then open the printed `http://127.0.0.1:5173` URL.
2. If using camera mode, run `npm run model:download` once (or save Google's official Hand Landmarker task model to `public/models/hand_landmarker.task`), allow camera access, and exercise start, stop, and repeated restart. The camera flow requires localhost or HTTPS.
3. Test the camera-free **Try demo** first; confirm the simulated indicator is visible and that the toolkit remains usable without camera permission.
4. Follow `FEATURE-CHECKLIST.md` for hands-on checks of gestures, each tool, Select-mode drag/drop, direct object deletion and Undo, artwork save/reopen/rename/delete, camera/solid/transparent backgrounds, guides/symmetry, and transparent PNG download. Recheck that PNG output excludes video, landmarks and interface elements.

Model download reference: <https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task>
