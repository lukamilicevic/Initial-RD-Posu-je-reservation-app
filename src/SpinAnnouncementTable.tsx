import type { SpinAnnouncement, SpinSide } from '../types';

interface SpinAnnouncementTableProps {
  announcements: SpinAnnouncement[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

const labels: Record<SpinSide, string> = { upper: 'Gornja strana', lower: 'Donja strana' };

export function SpinAnnouncementTable({ announcements, isAdmin, onDelete }: SpinAnnouncementTableProps) {
  return (
    <div className="rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-slate-200 min-w-0">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-900">Najave spinanja</h2>
        <p className="text-sm text-slate-500">Ovo su informativne najave i ne predstavljaju rezervaciju pozicije.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 font-medium text-slate-600">Strana</th>
              <th className="px-4 py-3 font-medium text-slate-600">Ime i prezime</th>
              <th className="px-4 py-3 font-medium text-slate-600">Datum dolaska</th>
              <th className="px-4 py-3 font-medium text-slate-600">Telefon</th>
              {isAdmin ? <th className="px-4 py-3 font-medium text-slate-600">Akcije</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {announcements.length === 0 ? (
              <tr><td colSpan={isAdmin ? 5 : 4} className="px-4 py-6 text-slate-500">Nema aktivnih najava spinanja.</td></tr>
            ) : announcements.map((announcement) => (
              <tr key={announcement.id} className="hover:bg-slate-50">
                <td className="px-4 py-4 font-semibold text-deep-green">{labels[announcement.side]}</td>
                <td className="px-4 py-4 text-slate-700">{announcement.firstName} {announcement.lastName}</td>
                <td className="px-4 py-4 text-slate-700">{new Date(announcement.arrivalDate).toLocaleDateString('hr-HR')}</td>
                <td className="px-4 py-4 text-slate-700">{announcement.phone}</td>
                {isAdmin ? <td className="px-4 py-4"><button type="button" onClick={() => onDelete(announcement.id)} className="rounded-2xl bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700">Obriši</button></td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
