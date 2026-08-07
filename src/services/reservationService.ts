import type { Reservation, ReservationFormValues } from '../types';
import {
  addRemoteReservation,
  deleteRemoteReservation,
  fetchRemoteReservations,
  hasRemoteBackend,
  markRemoteReservationCompleted,
  updateRemoteReservation
} from './supabaseClient';

const storageKey = 'srd-posusje-reservations';

const sampleReservations: Reservation[] = [
  {
    id: 'r1',
    positionId: 3,
    firstName: 'Ivan',
    lastName: 'Horvat',
    phone: '+385912345678',
    arriveDate: '2026-08-15',
    leaveDate: '2026-08-18',
    persons: 2,
    notes: 'Preferira mirnu obalu.',
    completed: false
  },
  {
    id: 'r2',
    positionId: 10,
    firstName: 'Ana',
    lastName: 'Kovač',
    phone: '+385912223344',
    arriveDate: '2026-08-20',
    leaveDate: '2026-08-23',
    persons: 1,
    notes: 'Dođe s obitelji.',
    completed: false
  }
];

function normalizeDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function loadLocalReservations(): Reservation[] {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) {
      window.localStorage.setItem(storageKey, JSON.stringify(sampleReservations));
      return sampleReservations;
    }

    const parsed = JSON.parse(stored) as Reservation[];
    return Array.isArray(parsed) ? parsed : sampleReservations;
  } catch {
    return sampleReservations;
  }
}

function saveLocalReservations(reservations: Reservation[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(reservations));
}

export const reservationService = {
  async loadReservations(): Promise<Reservation[]> {
    if (hasRemoteBackend) {
      try {
        return await fetchRemoteReservations();
      } catch {
        return loadLocalReservations();
      }
    }

    return loadLocalReservations();
  },

  async getReservationByPosition(positionId: number): Promise<Reservation | null> {
    const reservations = await this.loadReservations();
    return reservations.find((reservation) => reservation.positionId === positionId && !reservation.completed) ?? null;
  },

  async isConflict(positionId: number, arrive: Date, leave: Date, excludeId?: string): Promise<boolean> {
    const newStart = normalizeDate(arrive);
    const newEnd = normalizeDate(leave);
    const reservations = await this.loadReservations();

    return reservations.some((reservation) => {
      if (reservation.completed || reservation.positionId !== positionId || reservation.id === excludeId) {
        return false;
      }
      const existingStart = reservation.arriveDate;
      const existingEnd = reservation.leaveDate;
      return newStart <= existingEnd && existingStart <= newEnd;
    });
  },

  async createReservation(positionId: number, values: ReservationFormValues): Promise<Reservation> {
    const reservation: Reservation = {
      id: `r${Date.now()}`,
      positionId,
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      phone: values.phone.trim(),
      arriveDate: normalizeDate(values.arriveDate as Date),
      leaveDate: normalizeDate(values.leaveDate as Date),
      persons: values.persons,
      notes: values.notes?.trim() ?? '',
      completed: false
    };

    if (hasRemoteBackend) {
      return await addRemoteReservation(reservation);
    }

    const reservations = loadLocalReservations();
    const next = [...reservations, reservation];
    saveLocalReservations(next);
    return reservation;
  },

  async updateReservation(id: string, values: ReservationFormValues): Promise<Reservation> {
    const reservations = await this.loadReservations();
    const updatedReservations = reservations.map((reservation) =>
      reservation.id === id
        ? {
            ...reservation,
            firstName: values.firstName.trim(),
            lastName: values.lastName.trim(),
            phone: values.phone.trim(),
            arriveDate: normalizeDate(values.arriveDate as Date),
            leaveDate: normalizeDate(values.leaveDate as Date),
            persons: values.persons,
            notes: values.notes?.trim() ?? ''
          }
        : reservation
    );
    const updated = updatedReservations.find((reservation) => reservation.id === id);
    if (!updated) {
      throw new Error('Rezervacija nije pronađena.');
    }

    if (hasRemoteBackend) {
      return await updateRemoteReservation(updated);
    }

    saveLocalReservations(updatedReservations);
    return updated;
  },

  async deleteReservation(id: string): Promise<void> {
    if (hasRemoteBackend) {
      await deleteRemoteReservation(id);
      return;
    }

    const reservations = loadLocalReservations();
    const next = reservations.filter((reservation) => reservation.id !== id);
    saveLocalReservations(next);
  },

  async markCompleted(id: string): Promise<void> {
    if (hasRemoteBackend) {
      await markRemoteReservationCompleted(id);
      return;
    }

    const reservations = loadLocalReservations();
    const next = reservations.map((reservation) =>
      reservation.id === id ? { ...reservation, completed: true } : reservation
    );
    saveLocalReservations(next);
  }
};
