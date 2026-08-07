import { useEffect, useState } from 'react';
import { spinAnnouncementService } from '../services/spinAnnouncementService';
import type { SpinAnnouncement, SpinSide } from '../types';

export function useSpinAnnouncements() {
  const [announcements, setAnnouncements] = useState<SpinAnnouncement[]>([]);

  const refresh = async () => {
    setAnnouncements(await spinAnnouncementService.loadAnnouncements());
  };

  useEffect(() => {
    void refresh();
  }, []);

  const addAnnouncement = async (
    side: SpinSide,
    firstName: string,
    lastName: string,
    phone: string,
    arrivalDate: Date
  ) => {
    await spinAnnouncementService.createAnnouncement(side, firstName, lastName, phone, arrivalDate);
    await refresh();
  };

  const removeAnnouncement = async (id: string) => {
    await spinAnnouncementService.deleteAnnouncement(id);
    await refresh();
  };

  return { announcements, addAnnouncement, removeAnnouncement };
}
