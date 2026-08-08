import type { SpinAnnouncement, SpinSide } from '../types';
import {
  addRemoteSpinAnnouncement,
  deleteRemoteSpinAnnouncement,
  fetchRemoteSpinAnnouncements,
  hasRemoteBackend
} from './supabaseClient';
import { toLocalDateString } from '../utils/date';

const storageKey = 'srd-posusje-spin-announcements';

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `spin-${Date.now()}`;
}

function loadLocal(): SpinAnnouncement[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      return [];
    }
    const parsed = JSON.parse(stored) as SpinAnnouncement[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocal(announcements: SpinAnnouncement[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(announcements));
}

function removeExpired(announcements: SpinAnnouncement[]): SpinAnnouncement[] {
  const today = toLocalDateString(new Date());
  return announcements.filter((announcement) => announcement.arrivalDate >= today);
}

export const spinAnnouncementService = {
  async loadAnnouncements(): Promise<SpinAnnouncement[]> {
    if (hasRemoteBackend) {
      try {
        const fetched = await fetchRemoteSpinAnnouncements();
        const active = removeExpired(fetched);
        const expired = fetched.filter((announcement) => !active.some((item) => item.id === announcement.id));
        await Promise.all(expired.map((announcement) => deleteRemoteSpinAnnouncement(announcement.id)));
        return active;
      } catch (error) {
        console.error('Supabase load failed, falling back to local spin announcements.', error);
      }
    }

    const active = removeExpired(loadLocal());
    saveLocal(active);
    return active;
  },

  async createAnnouncement(
    side: SpinSide,
    firstName: string,
    lastName: string,
    phone: string,
    arrivalDate: Date
  ): Promise<SpinAnnouncement> {
    const announcement: SpinAnnouncement = {
      id: generateId(),
      side,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      arrivalDate: toLocalDateString(arrivalDate)
    };

    if (hasRemoteBackend) {
      try {
        return await addRemoteSpinAnnouncement(announcement);
      } catch (error) {
        console.error('Supabase save failed, storing spin announcement locally.', error);
      }
    }

    const next = [...removeExpired(loadLocal()), announcement];
    saveLocal(next);
    return announcement;
  },

  async deleteAnnouncement(id: string): Promise<void> {
    if (hasRemoteBackend) {
      try {
        await deleteRemoteSpinAnnouncement(id);
        return;
      } catch (error) {
        console.error('Supabase delete failed, deleting local spin announcement.', error);
      }
    }

    saveLocal(loadLocal().filter((announcement) => announcement.id !== id));
  }
};
