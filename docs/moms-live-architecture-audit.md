# Mom’s Live Architecture Audit and Refactor

## Executive summary

Mom’s Live was a browser-only Vite/React studio with a strong set of reusable visual controls but a monolithic application coordinator. The previous `src/App.tsx` owned 777 lines of camera acquisition, audio processing, chroma-key calibration, virtual studio settings, teleprompter behavior, recording, modal state, and drawer composition. That structure made every new feature depend on one component and made browser-only concerns difficult to isolate from application composition.

The repository now uses the **Next.js App Router**. The studio page is a thin route boundary. Browser media orchestration lives in `src/features/studio/hooks/useStudioSession.ts`. The presentational composition lives in `src/features/studio/StudioWorkspace.tsx`. Recording conversion and temporary-file handling live in `src/server/recordings.ts` and are exposed through typed Next.js route handlers.

The refactor preserves the current studio workflow while establishing a clearer boundary for future authentication, persistence, saved presets, recording history, and background processing. The current change is an architectural foundation rather than a completed product-management backend because the original application did not define durable user-owned entities or a database schema.

## Baseline audit

| Area | Previous state | Risk | Refactor result |
|---|---|---|---|
| Application entrypoint | One 777-line `src/App.tsx` | All product changes increased coupling and regression surface | `app/page.tsx` delegates to a feature workspace; the legacy `src/App.tsx` is a compatibility wrapper |
| Browser media state | Camera, audio, canvas, and recorder refs were page-owned | Browser APIs were inseparable from layout and drawer rendering | `useStudioSession` owns the media lifecycle and exposes a typed session contract |
| UI composition | Controls were extracted, but their orchestration remained centralized | Reuse required copying state and handler logic | `StudioWorkspace` composes existing controls through a stable feature boundary |
| Server runtime | Express/Vite server mixed static serving, health, and FFmpeg conversion | Deployment and server responsibilities were tied to the SPA server | Next.js App Router with route handlers for health, conversion, and downloads |
| Recording conversion | Shell command string assembled in Express | Command invocation and file access were difficult to reuse and audit | `execFile` receives an argument array, input is bounded, and file names are validated |
| Camera state typing | `selectedDeviceId` was typed as `string` while initialized as `null` | Strict TypeScript could not represent the real browser state | Type is now `string | null` |
| Cleanup | Recording temp cleanup ran from a long-lived Express interval | Cleanup depended on a process that may not exist in serverless deployments | Cleanup runs when conversion requests arrive; file access is centralized |
| Build system | Vite plus a custom Express server | No App Router, route hierarchy, or server component boundary | Next.js 15 App Router with strict TypeScript and Tailwind PostCSS |

## Target structure

```text
app/
  layout.tsx                         # metadata and global document shell
  page.tsx                           # server-rendered route boundary
  api/
    health/route.ts                  # runtime health endpoint
    convert-to-mp4/route.ts          # server-side recording conversion
    download-file/[file]/route.ts    # safe converted-file streaming
src/
  features/
    studio/
      StudioWorkspace.tsx            # feature-level UI composition
      hooks/
        useStudioSession.ts          # browser media and recording orchestration
  components/                        # reusable controls and canvas primitives
  data/studios.ts                    # default studio and script configuration
  server/
    recordings.ts                    # conversion and temporary-file service
  utils/                              # camera, audio, canvas, and chroma-key utilities
  types.ts                            # shared domain types
```

## Architectural decisions

### App Router as the application boundary

`app/page.tsx` is intentionally small. It is a server component that renders the client-only studio workspace. This keeps browser permissions, `MediaStream`, `MediaRecorder`, `AudioContext`, and DOM operations inside a client feature instead of forcing the entire route to contain orchestration logic.

### Feature-first client organization

The studio is treated as a product feature rather than as a collection of unrelated pages. The feature owns its workspace and session hook. Existing controls remain reusable components, while the hook provides the stateful contract that connects them. A future feature can use the same pattern without adding more state to the root route.

### Server-side recording boundary

The previous Express server accepted raw WebM data, invoked FFmpeg, and streamed an MP4 response. That behavior is retained as Next.js route handlers. The conversion service now validates file names, bounds input size to 1.5 GB, avoids shell interpolation by using `execFile`, removes input files in a `finally` block, and exposes a small API that can later be replaced by object storage or a job queue.

### Explicit persistence gap

The original repository contains no durable business entities. There is no saved project, user preset, recording history, or account model to persist. Adding a database without a product entity would create schema noise and an unowned lifecycle. The next persistence milestone should begin with a product decision about which objects users can save and share.

## Verification

The refactor was validated with the following checks:

| Check | Result |
|---|---|
| Strict TypeScript (`pnpm lint`) | Passed |
| Production Next.js build (`NODE_ENV=production pnpm build`) | Passed |
| Root page smoke test | HTTP 200 |
| Health endpoint smoke test | Returned `status: ok` and service metadata |
| Production route inventory | `/`, `/_not-found`, `/api/health`, `/api/convert-to-mp4`, and `/api/download-file/[file]` compiled successfully |

## Follow-up roadmap

The next implementation phase should introduce durable project state only after the product entities are confirmed. A sensible sequence is to add user authentication, a `studio_projects` entity for saved settings, a `studio_presets` entity for reusable configurations, and a recording metadata entity that stores object-storage references rather than video bytes in the database. The conversion route should then move large inputs and outputs to object storage or an asynchronous worker because large FFmpeg jobs do not fit reliably into every serverless runtime.

The client can subsequently be split into smaller feature hooks if the session contract grows. Candidate seams are `useCameraSession`, `useAudioEngine`, `useRecordingSession`, and `useStudioSettings`. The current single `useStudioSession` hook is intentionally the first extraction because it removes the page-level coupling without prematurely fragmenting closely related media lifecycles.

## References

[1]: https://nextjs.org/docs/app "Next.js App Router documentation"

[2]: https://nextjs.org/docs/app/building-your-application/routing/route-handlers "Next.js Route Handlers documentation"

[3]: https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns "Next.js server and client composition patterns"
