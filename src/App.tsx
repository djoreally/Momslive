'use client';

import StudioWorkspace from './features/studio/StudioWorkspace';

/**
 * Compatibility entrypoint for consumers that still import the legacy App module.
 * The actual studio composition now lives in the feature module.
 */
export default function App() {
  return <StudioWorkspace />;
}
