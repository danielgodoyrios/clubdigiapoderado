/**
 * In-memory cache of recently created/accessed attendance sessions.
 * Populated by ProgramacionScreen whenever a session is created so that
 * SesionesHoyScreen can display them even when the backend doesn't link
 * them to a specific team (e.g. category-scoped schedule slots).
 */

export type CachedSession = {
  id:            number;
  date:          string;
  title:         string;
  type:          string;       // 'training' | 'match' | 'event'
  team_name:     string;
  team_id:       number | null;
  submitted:     boolean;
  total:         number;
  present_count: number;
  absent_count:  number;
};

const store: CachedSession[] = [];

/** Add or update a session in the cache. */
export function cacheSession(s: CachedSession) {
  const idx = store.findIndex(x => x.id === s.id);
  if (idx >= 0) {
    store[idx] = s;
  } else {
    store.push(s);
  }
}

/** Return all cached sessions. */
export function getCachedSessions(): CachedSession[] {
  return [...store];
}

/** Mark a session as submitted in the cache. */
export function markCachedSubmitted(id: number) {
  const s = store.find(x => x.id === id);
  if (s) s.submitted = true;
}
