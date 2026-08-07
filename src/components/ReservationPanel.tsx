import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addDays, toLocalDateString } from '../utils/date';
import type { Position, Reservation, ReservationFormValues } from '../types';

interface ReservationPanelProps {
  position: Position;
  reservation: Reservation | null;
  upcomingReservation: Reservation | null;
  isAdmin: boolean;
  onClose: () => void;
  onCreate: (positionId: number, values: ReservationFormValues) => Promise<Reservation | void>;
  onUpdate: (id: string, values: ReservationFormValues) => Promise<Reservation | void>;
  onDelete: (id: string) => Promise<void>;
  onMarkCompleted: (id: string) => Promise<void>;
  hasConflict: (positionId: number, arrive: Date, leave: Date, excludeId?: string) => Promise<boolean>;
}

const formatDate = (value: string) => new Date(value).toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function ReservationPanel({
  position,
  reservation,
  upcomingReservation,
  isAdmin,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
  onMarkCompleted,
  hasConflict
}: ReservationPanelProps) {
  const [error, setError] = useState('');

  const { control, handleSubmit, reset, watch } = useForm<ReservationFormValues>({
    defaultValues: {
      firstName: reservation?.firstName ?? '',
      lastName: reservation?.lastName ?? '',
      phone: reservation?.phone ?? '',
      arriveDate: reservation ? new Date(reservation.arriveDate) : null,
      leaveDate: reservation ? new Date(reservation.leaveDate) : null,
      persons: reservation?.persons ?? 1,
      notes: reservation?.notes ?? ''
    }
  });

  useEffect(() => {
    reset({
      firstName: reservation?.firstName ?? '',
      lastName: reservation?.lastName ?? '',
      phone: reservation?.phone ?? '',
      arriveDate: reservation ? new Date(reservation.arriveDate) : null,
      leaveDate: reservation ? new Date(reservation.leaveDate) : null,
      persons: reservation?.persons ?? 1,
      notes: reservation?.notes ?? ''
    });
    setError('');
  }, [reservation, reset]);

  const reservationMessage = useMemo(() => {
    if (reservation) {
      return `Pozicija je rezervirana od ${formatDate(reservation.arriveDate)} do ${formatDate(reservation.leaveDate)}.`;
    }
    if (upcomingReservation) {
      return `Pozicija je trenutno slobodna. Sljedeća rezervacija počinje ${formatDate(upcomingReservation.arriveDate)}.`;
    }
    return 'Ovaj položaj je slobodan. Unesite podatke za rezervaciju.';
  }, [reservation, upcomingReservation]);

  const maxArrivalDate = addDays(new Date(), 3);
  const watchArriveDate = watch('arriveDate');
  const maxLeaveDate = watchArriveDate ? addDays(watchArriveDate, 3) : addDays(new Date(), 3);

  const handleSave = async (values: ReservationFormValues) => {
    if (!values.arriveDate || !values.leaveDate) {
      setError('Unesite oba datuma dolaska i odlaska.');
      return;
    }

    if (values.arriveDate > values.leaveDate) {
      setError('Datum dolaska mora biti prije ili jednak datumu odlaska.');
      return;
    }

    if (values.arriveDate > maxArrivalDate) {
      setError(`Datum dolaska mora biti najkasnije ${toLocalDateString(maxArrivalDate)}.`);
      return;
    }

    if (values.leaveDate > addDays(values.arriveDate, 3)) {
      setError('Rezervacija može trajati najviše 4 dana. Odaberite raniji datum odlaska.');
      return;
    }

    const conflict = await hasConflict(position.id, values.arriveDate, values.leaveDate, reservation?.id);
    if (conflict) {
      setError('Ova pozicija je već rezervirana za odabrani period.');
      return;
    }

    try {
      setError('');
      if (reservation) {
        await onUpdate(reservation.id, values);
      } else {
        await onCreate(position.id, values);
      }
      onClose();
    } catch (error) {
      let message = 'Pokušajte ponovo.';
      if (error instanceof Error) {
        message = error.message;
      } else if (error && typeof error === 'object') {
        if ('message' in error && typeof (error as any).message === 'string') {
          message = (error as any).message;
        } else {
          message = JSON.stringify(error);
        }
      }
      setError(`Spremanje nije uspjelo. ${message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 rounded-[2rem] bg-slate-50 p-6 shadow-soft ring-1 ring-slate-200 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Detalji pozicije</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Pozicija {position.id}</h2>
            <p className="mt-1 text-slate-600">{reservationMessage}</p>
          </div>
          <button onClick={onClose} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-100">
            Zatvori
          </button>
        </div>

        {reservation && !isAdmin ? (
          <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-200 sm:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Ime i prezime</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{reservation.firstName} {reservation.lastName}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Telefon</p>
              <p className="mt-2 text-lg text-slate-900">{reservation.phone}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Period</p>
              <p className="mt-2 text-lg text-slate-900">{formatDate(reservation.arriveDate)} – {formatDate(reservation.leaveDate)}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Osoba</p>
              <p className="mt-2 text-lg text-slate-900">{reservation.persons}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Napomena</p>
              <p className="mt-2 text-slate-700">{reservation.notes || 'Nema dodatnih napomena.'}</p>
            </div>
          </div>
        ) : null}

        {upcomingReservation && !reservation ? (
          <div className="grid gap-4 rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-200 sm:grid-cols-2">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Sljedeća rezervacija</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatDate(upcomingReservation.arriveDate)} – {formatDate(upcomingReservation.leaveDate)}</p>
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Ime i prezime</p>
              <p className="mt-2 text-lg text-slate-900">{upcomingReservation.firstName} {upcomingReservation.lastName}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Napomena</p>
              <p className="mt-2 text-slate-700">{upcomingReservation.notes || 'Nema dodatnih napomena.'}</p>
            </div>
          </div>
        ) : null}

        <div className="rounded-3xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xl font-semibold text-slate-900">
              {reservation ? (isAdmin ? 'Uredi rezervaciju' : 'Detalji rezervacije') : 'Nova rezervacija'}
            </h3>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${reservation ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {reservation ? 'Rezervirana' : 'Slobodna'}
              </span>
              {reservation?.completed ? <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">Završeno</span> : null}
            </div>
          </div>
          {(!reservation || isAdmin) ? (
            <form onSubmit={handleSubmit(handleSave)} className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Ime</span>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                      placeholder="Ivan"
                    />
                  )}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Prezime</span>
                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                      placeholder="Horvat"
                    />
                  )}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Telefon</span>
                <Controller
                  name="phone"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                      placeholder="095 123 4567"
                    />
                  )}
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Datum dolaska</span>
                  <Controller
                    name="arriveDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                          minDate={new Date()}
                          maxDate={maxArrivalDate}
                          placeholderText="Odaberite datum"
                          dateFormat="dd.MM.yyyy"
                        />
                        <p className="mt-2 text-xs text-slate-500">Najkasnije možete rezervirati dolazak do {toLocalDateString(maxArrivalDate)}.</p>
                      </>
                    )}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Datum odlaska</span>
                  <Controller
                    name="leaveDate"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <>
                        <DatePicker
                          selected={field.value}
                          onChange={(date) => field.onChange(date)}
                          className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                          minDate={watchArriveDate ?? new Date()}
                          maxDate={maxLeaveDate}
                          placeholderText="Odaberite datum"
                          dateFormat="dd.MM.yyyy"
                        />
                        <p className="mt-2 text-xs text-slate-500">Najdulje trajanje rezervacije je 4 dana.</p>
                      </>
                    )}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Broj osoba</span>
                <Controller
                  name="persons"
                  control={control}
                  rules={{ required: true, min: 1 }}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      min={1}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                    />
                  )}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Napomena</span>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none transition focus:border-deep-green focus:ring-2 focus:ring-deep-green/20"
                      rows={4}
                      placeholder="Dodatne napomene (nije obavezno)"
                    />
                  )}
                />
              </label>
              {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
              <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:justify-between">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-deep-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-900 sm:w-auto"
                >
                  {reservation ? 'Spremi promjene' : 'Rezerviraj'}
                </button>
                {reservation && isAdmin ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => onMarkCompleted(reservation.id)}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200 sm:w-auto"
                    >
                      Označi kao završeno
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(reservation.id)}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 sm:w-auto"
                    >
                      Obriši rezervaciju
                    </button>
                  </div>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-slate-600">
              Samo administrator može urediti ovu rezervaciju.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
