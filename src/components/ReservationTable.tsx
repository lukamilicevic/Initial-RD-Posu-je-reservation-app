import { useMemo, useState } from 'react';
import { getTodayLocalDateString } from '../utils/date';
import type { Reservation } from '../types';

interface ReservationTableProps {
  reservations: Reservation[];
  isAdmin: boolean;
  onEdit: (reservationId: string) => void;
  onDelete: (reservationId: string) => void;
  onComplete: (reservationId: string) => void;
}

type SortKey = 'position' | 'arriveDate';

export function ReservationTable({ reservations, isAdmin, onEdit, onDelete, onComplete }: ReservationTableProps) {
  const [searchText, setSearchText] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('arriveDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const today = getTodayLocalDateString();

  const filtered = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    return reservations
      .filter((reservation) => {
        const isExpired = reservation.leaveDate < today;
        if (isExpired) {
          return false;
        }

        if (!query) {
          return true;
        }

        const positionText = `${reservation.positionId}`;
        const nameText = `${reservation.firstName} ${reservation.lastName}`.toLowerCase();
        const dateText = `${reservation.arriveDate} ${reservation.leaveDate}`;
        return positionText.includes(query) || nameText.includes(query) || dateText.includes(query) || reservation.phone.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const dir = sortDirection === 'asc' ? 1 : -1;
        if (sortKey === 'position') {
          return dir * (a.positionId - b.positionId);
        }
        return dir * a.arriveDate.localeCompare(b.arriveDate);
      });
  }, [reservations, searchText, sortKey, sortDirection, today]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection('asc');
  };

  return (
    <div className="rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-slate-200 min-w-0">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Popis rezervacija</h2>
          <p className="text-sm text-slate-500">Javni pregled svih rezervacija. Sortirajte po poziciji ili datumu dolaska.</p>
        </div>
        <div className="w-full max-w-sm">
          <label className="block text-sm font-medium text-slate-700">
            Pretraži
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
              placeholder="Pozicija, ime ili datum"
            />
          </label>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        <button
          type="button"
          onClick={() => toggleSort('position')}
          className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 transition hover:border-deep-green hover:text-deep-green"
        >
          Sortiraj po poziciji {sortKey === 'position' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
          type="button"
          onClick={() => toggleSort('arriveDate')}
          className="rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2 transition hover:border-deep-green hover:text-deep-green"
        >
          Sortiraj po datumu {sortKey === 'arriveDate' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Pozicija</th>
              <th className="px-4 py-3 font-medium text-slate-600">Ime i prezime</th>
              <th className="px-4 py-3 font-medium text-slate-600">Datum dolaska</th>
              <th className="px-4 py-3 font-medium text-slate-600">Datum odlaska</th>
              <th className="px-4 py-3 font-medium text-slate-600">Status</th>
              {isAdmin ? <th className="px-4 py-3 font-medium text-slate-600">Akcije</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={isAdmin ? 6 : 5}>
                  Nema rezervacija koje odgovaraju pretraživanju.
                </td>
              </tr>
            ) : (
              filtered.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-slate-50">
                  <td className="px-4 py-4 font-semibold text-slate-900">{reservation.positionId}</td>
                  <td className="px-4 py-4 text-slate-700">{reservation.firstName} {reservation.lastName}</td>
                  <td className="px-4 py-4 text-slate-700">{new Date(reservation.arriveDate).toLocaleDateString('hr-HR')}</td>
                  <td className="px-4 py-4 text-slate-700">{new Date(reservation.leaveDate).toLocaleDateString('hr-HR')}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${reservation.completed ? 'bg-slate-100 text-slate-700' : 'bg-red-100 text-red-700'}`}>
                      {reservation.completed ? 'Završena' : 'Aktivna'}
                    </span>
                  </td>
                  {isAdmin ? (
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => onEdit(reservation.id)}
                          className="rounded-2xl bg-deep-green px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-900"
                        >
                          Uredi
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(reservation.id)}
                          className="rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700"
                        >
                          Obriši
                        </button>
                        {!reservation.completed ? (
                          <button
                            type="button"
                            onClick={() => onComplete(reservation.id)}
                            className="rounded-2xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-200"
                          >
                            Završeno
                          </button>
                        ) : null}
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
