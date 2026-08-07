import { useMemo, useState } from 'react';
import { positions } from '../data/positions';
import { MapViewer } from '../components/MapViewer';
import { ReservationPanel } from '../components/ReservationPanel';
import { ReservationTable } from '../components/ReservationTable';
import { AdminLogin } from '../components/AdminLogin';
import { StatusStats } from '../components/StatusStats';
import { useReservations } from '../hooks/useReservations';
import { authService } from '../services/authService';
import type { Position, ReservationFormValues, Reservation } from '../types';

export function HomePage() {
  const { reservations, addReservation, editReservation, removeReservation, completeReservation, hasConflict } = useReservations();
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const activeReservedIds = useMemo(
    () =>
      new Set(
        reservations
          .filter((reservation) => !reservation.completed && reservation.arriveDate <= today && today <= reservation.leaveDate)
          .map((reservation) => reservation.positionId)
      ),
    [reservations, today]
  );

  const reserveCount = activeReservedIds.size;
  const freeCount = Math.max(positions.length - reserveCount, 0);

  const handlePinSelect = (position: Position) => {
    const reservation = reservations
      .filter((item) => item.positionId === position.id && !item.completed)
      .sort((a, b) => a.arriveDate.localeCompare(b.arriveDate))[0] ?? null;
    setSelectedPosition(position);
    setSelectedReservation(reservation);
  };

  const handleReservationSelect = (reservationId: string) => {
    const reservation = reservations.find((item) => item.id === reservationId) ?? null;
    if (!reservation) {
      return;
    }
    const position = positions.find((item) => item.id === reservation.positionId) ?? null;
    if (!position) {
      return;
    }
    setSelectedPosition(position);
    setSelectedReservation(reservation);
  };

  const handleAdminLogin = (password: string) => {
    if (authService.validateAdmin(password)) {
      setIsAdmin(true);
      setAdminError('');
      return true;
    }
    setAdminError('Lozinka nije ispravna. Pokušajte ponovo.');
    return false;
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminError('');
  };

  const clearSelection = () => {
    setSelectedPosition(null);
    setSelectedReservation(null);
  };

  const handleCreateReservation = async (positionId: number, values: ReservationFormValues) => {
    await addReservation(positionId, values);
  };

  const handleUpdateReservation = async (id: string, values: ReservationFormValues) => {
    await editReservation(id, values);
  };

  const handleDeleteReservation = async (id: string) => {
    await removeReservation(id);
    if (selectedReservation?.id === id) {
      clearSelection();
    }
  };

  const handleMarkCompleted = async (id: string) => {
    await completeReservation(id);
    if (selectedReservation?.id === id) {
      clearSelection();
    }
  };

  const sortedReservations = useMemo(() => [...reservations].sort((a, b) => a.arriveDate.localeCompare(b.arriveDate)), [reservations]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="rounded-[2rem] bg-white p-8 shadow-soft ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 text-center sm:text-left">
            <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">ŠRD Posušje</p>
            <h1 className="text-4xl font-semibold text-deep-green sm:text-5xl">Rezervacija ribolovnih pozicija</h1>
            <p className="max-w-2xl text-base text-slate-600 sm:text-lg">
              Jednostavno rezervirajte mjesto na jezeru i provjerite dostupnost svih pozicija.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-6">
            <MapViewer positions={positions} reservations={reservations} onSelect={handlePinSelect} selectedPositionId={selectedPosition?.id ?? null} />
            <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
              <StatusStats reservations={reservations} totalPositions={positions.length} />
            </div>
            <ReservationTable
              reservations={sortedReservations}
              isAdmin={isAdmin}
              onEdit={handleReservationSelect}
              onDelete={handleDeleteReservation}
              onComplete={handleMarkCompleted}
            />
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Status lokacije</h2>
              <p className="mt-3 text-slate-600">Kliknite pin na karti i otvorite detalje pozicije.</p>
              <div className="mt-6 grid gap-4">
                <div className="rounded-3xl bg-emerald-50 p-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-emerald-700">Slobodna pozicija</p>
                  <p className="mt-2 text-lg text-emerald-900">Zelena oznaka</p>
                </div>
                <div className="rounded-3xl bg-red-50 p-4">
                  <p className="text-sm uppercase tracking-[0.24em] text-red-700">Zauzeta pozicija</p>
                  <p className="mt-2 text-lg text-red-900">Crvena oznaka</p>
                </div>
              </div>
            </div>
            {isAdmin ? (
              <div className="rounded-[2rem] bg-white p-6 shadow-soft ring-1 ring-slate-200">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Administrator</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Uspješno ste prijavljeni.</p>
                  </div>
                  <button
                    onClick={handleAdminLogout}
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  >
                    Odjava
                  </button>
                </div>
              </div>
            ) : (
              <AdminLogin onLogin={handleAdminLogin} error={adminError} onClearError={() => setAdminError('')} />
            )}
          </aside>
        </section>
      </div>

      {selectedPosition ? (
        <ReservationPanel
          position={selectedPosition}
          reservation={selectedReservation}
          isAdmin={isAdmin}
          onClose={clearSelection}
          onCreate={handleCreateReservation}
          onUpdate={handleUpdateReservation}
          onDelete={handleDeleteReservation}
          onMarkCompleted={handleMarkCompleted}
          hasConflict={hasConflict}
        />
      ) : null}
    </div>
  );
}
