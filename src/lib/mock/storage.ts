const memoryStore = new Map<string, string>();

function canUseBrowserStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

function readBrowserValue(key: string): string | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeBrowserValue(key: string, value: string): boolean {
  if (!canUseBrowserStorage()) {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeBrowserValue(key: string): boolean {
  if (!canUseBrowserStorage()) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getValue(key: string): string | null {
  const browserValue = readBrowserValue(key);
  if (browserValue !== null) {
    memoryStore.set(key, browserValue);
    return browserValue;
  }

  return memoryStore.get(key) ?? null;
}

function setValue(key: string, value: string): void {
  memoryStore.set(key, value);
  writeBrowserValue(key, value);
}

function deleteValue(key: string): void {
  memoryStore.delete(key);
  removeBrowserValue(key);
}

export function readJson<T>(key: string): Promise<T | null> {
  const raw = getValue(key);
  if (!raw) {
    return Promise.resolve(null);
  }

  try {
    return Promise.resolve(JSON.parse(raw) as T);
  } catch {
    return Promise.resolve(null);
  }
}

export function writeJson<T>(key: string, value: T): Promise<void> {
  setValue(key, JSON.stringify(value));
  return Promise.resolve();
}

export function deleteItem(key: string): Promise<void> {
  deleteValue(key);
  return Promise.resolve();
}

export function hasKey(key: string): Promise<boolean> {
  const browserValue = readBrowserValue(key);
  if (browserValue !== null) {
    memoryStore.set(key, browserValue);
    return Promise.resolve(true);
  }

  return Promise.resolve(memoryStore.has(key));
}
