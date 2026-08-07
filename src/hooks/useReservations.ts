import { useEffect, useState } from 'react';
import { reservationService } from '../services/reservationService';
import type { Reservation, ReservationFormValues } from '../types';

export function useReservations() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reservationService
      .loadReservations()
      .then(setReservations)
      .finally(() => setLoading(false));
  }, []);

  const refresh = async () => {
    const latest = await reservationService.loadReservations();
    setReservations(latest);
  };

  const addReservation = async (positionId: number, values: ReservationFormValues) => {
    const reservation = await reservationService.createReservation(positionId, values);
    setReservations((current) => [...current, reservation]);
  };

  const editReservation = async (id: string, values: ReservationFormValues) => {
    const updated = await reservationService.updateReservation(id, values);
    setReservations((current) => current.map((reservation) => (reservation.id === id ? updated : reservation)));
  };

  const removeReservation = async (id: string) => {
    await reservationService.deleteReservation(id);
    setReservations((current) => current.filter((reservation) => reservation.id !== id));
  };

  const completeReservation = async (id: string) => {
    await reservationService.markCompleted(id);
    setReservations((current) => current.map((reservation) => (reservation.id === id ? { ...reservation, completed: true } : reservation)));
  };

  const hasConflict = async (positionId: number, arrive: Date, leave: Date, excludeId?: string) =>
    reservationService.isConflict(positionId, arrive, leave, excludeId);

  return {
    reservations,
    loading,
    addReservation,
    editReservation,
    removeReservation,
    completeReservation,
    hasConflict,
    refresh
  };
}
