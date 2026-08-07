import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { SpinSide } from '../types';

interface SpinAnnouncementPanelProps {
  side: SpinSide;
  onClose: () => void;
  onCreate: (firstName: string, lastName: string, phone: string, arrivalDate: Date) => Promise<void>;
}

interface FormValues {
  firstName: string;
  lastName: string;
  phone: string;
  arrivalDate: Date | null;
}

const sideLabels: Record<SpinSide, string> = {
  upper: 'Gornja strana',
  lower: 'Donja strana'
};

export function SpinAnnouncementPanel({ side, onClose, onCreate }: SpinAnnouncementPanelProps) {
  const [error, setError] = useState('');
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: { firstName: '', lastName: '', phone: '', arrivalDate: new Date() }
  });

  useEffect(() => {
    reset({ firstName: '', lastName: '', phone: '', arrivalDate: new Date() });
    setError('');
  }, [side, reset]);

  const handleSave = async (values: FormValues) => {
    if (!values.arrivalDate) {
      setError('Odaberite datum dolaska.');
      return;
    }

    try {
      await onCreate(values.firstName, values.lastName, values.phone, values.arrivalDate);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Spremanje najave nije uspjelo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-xl rounded-[2rem] bg-slate-50 p-6 shadow-soft ring-1 ring-slate-200 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Najava spinanja</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{sideLabels[side]}</h2>
            <p className="mt-2 text-slate-600">Upišite podatke kako bi drugi znali da ste danas na vodi.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">
            Zatvori
          </button>
        </div>

        <form onSubmit={handleSubmit(handleSave)} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Ime</span>
            <Controller name="firstName" control={control} rules={{ required: 'Unesite ime.' }} render={({ field }) => (
              <input {...field} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-deep-green focus:ring-2 focus:ring-deep-green/20" />
            )} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Prezime</span>
            <Controller name="lastName" control={control} rules={{ required: 'Unesite prezime.' }} render={({ field }) => (
              <input {...field} className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-deep-green focus:ring-2 focus:ring-deep-green/20" />
            )} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Broj telefona</span>
            <Controller name="phone" control={control} rules={{ required: 'Unesite broj telefona.' }} render={({ field }) => (
              <input {...field} type="tel" className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-deep-green focus:ring-2 focus:ring-deep-green/20" />
            )} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Datum dolaska</span>
            <Controller name="arrivalDate" control={control} rules={{ required: true }} render={({ field }) => (
              <DatePicker selected={field.value} onChange={field.onChange} minDate={new Date()} dateFormat="dd.MM.yyyy" className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-deep-green focus:ring-2 focus:ring-deep-green/20" />
            )} />
          </label>
          {error ? <p className="sm:col-span-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <div className="flex justify-end gap-3 sm:col-span-2">
            <button type="button" onClick={onClose} className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100">Odustani</button>
            <button type="submit" className="rounded-2xl bg-deep-green px-5 py-3 font-semibold text-white hover:bg-slate-900">Objavi najavu</button>
          </div>
        </form>
      </div>
    </div>
  );
}
