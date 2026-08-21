type SessionEnvelope<T> = {
  version: number;
  value: T;
};

const getSessionStorage = (): Storage | null =>
  typeof window === "undefined" ? null : window.sessionStorage;

export function writeSessionValue<T>(key: string, version: number, value: T): void {
  const storage = getSessionStorage();
  if (!storage) return;

  const envelope: SessionEnvelope<T> = { version, value };
  storage.setItem(key, JSON.stringify(envelope));
}

export function readSessionValue<T>(
  key: string,
  version: number,
  validate: (value: unknown) => value is T,
): T | null {
  const storage = getSessionStorage();
  if (!storage) return null;

  const stored = storage.getItem(key);
  if (stored === null) return null;

  try {
    const envelope: unknown = JSON.parse(stored);
    if (
      typeof envelope === "object"
      && envelope !== null
      && "version" in envelope
      && "value" in envelope
      && envelope.version === version
      && validate(envelope.value)
    ) {
      return envelope.value;
    }
  } catch {
    // Invalid stored values are discarded below.
  }

  storage.removeItem(key);
  return null;
}

export function removeSessionValue(key: string): void {
  getSessionStorage()?.removeItem(key);
}
