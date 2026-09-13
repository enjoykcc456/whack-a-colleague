export interface Profile {
  id: string;
  name: string;
  funFact: string;
  photoData: string;
  avatarData: string;
}

export type GameMode = 'name' | 'fact' | 'mixed';

const STORAGE_KEY = 'whack-profiles';

export function getProfiles(): Profile[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProfiles(profiles: Profile[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function addProfile(profile: Profile): void {
  const profiles = getProfiles();
  profiles.push(profile);
  saveProfiles(profiles);
}

export function removeProfile(id: string): void {
  const profiles = getProfiles().filter(p => p.id !== id);
  saveProfiles(profiles);
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
