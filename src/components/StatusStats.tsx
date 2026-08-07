import type { Reservation } from '../types';

interface StatusStatsProps {
  reservations: Reservation[];
  totalPositions: number;
}

const formatDate = (date: Date) => new Intl.DateTimeFormat('hr-HR', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);

export function StatusStats({ reservations, totalPositions }: StatusStatsProps) {
  const today = new Date().toISOString().slice(0, 10);
  const activeReserved = new Set(
    reservations
      .filter((reservation) => !reservation.completed && reservation.arriveDate <= today && today <= reservation.leaveDate)
      .map((reservation) => reservation.positionId)
  );
  const reservedCount = activeReserved.size;
  const freeCount = Math.max(totalPositions - reservedCount, 0);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Danas</p>
        <p className="mt-3 text-2xl font-semibold text-deep-green">{formatDate(new Date())}</p>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Slobodnih pozicija</p>
        <p className="mt-3 text-3xl font-semibold text-emerald-600">{freeCount}</p>
      </div>
      <div className="rounded-3xl bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Rezerviranih pozicija</p>
        <p className="mt-3 text-3xl font-semibold text-red-600">{reservedCount}</p>
      </div>
    </div>
  );
}
