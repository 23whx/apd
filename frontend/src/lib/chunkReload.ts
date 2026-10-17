// Recovery from stale code-split chunks.
//
// Route pages are lazy-loaded files with content hashes in their names. After a deploy, a tab that was
// opened on the previous version still asks for the old file names, which no longer exist, so the dynamic
// import fails. Reloading picks up the new index.html and its new chunk names.

const RELOAD_KEY = 'apd-chunk-reload-at';
const RELOAD_WINDOW_MS = 30_000;

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Unable to preload CSS|ChunkLoadError|is not a valid JavaScript MIME type|Expected a JavaScript module script/i.test(
    message
  );
}

/**
 * Reload the page once to fetch the new deployment. Returns false (and does nothing) if we already reloaded
 * for this reason very recently, so a genuinely missing file can't cause a reload loop.
 */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Without storage we can't guard against loops; still try once per page load
    if ((window as unknown as { __apdChunkReloaded?: boolean }).__apdChunkReloaded) return false;
    (window as unknown as { __apdChunkReloaded?: boolean }).__apdChunkReloaded = true;
  }
  window.location.reload();
  return true;
}
