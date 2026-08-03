const STORAGE_KEY = "the-awakened:player-identity";

/**
 * A random id generated once per device/browser and reused across
 * sessions. Not authentication — just enough identity for matchmaking
 * and presence. See DESIGN.md section 4.
 */
export function getLocalIdentity(): string {
  const existing = localStorage.getItem(STORAGE_KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  localStorage.setItem(STORAGE_KEY, id);
  return id;
}
