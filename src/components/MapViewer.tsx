import { useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { Position, Reservation } from '../types';
import { getTodayLocalDateString } from '../utils/date';
import lakeMap from '../assets/lake-photo.png';

interface MapViewerProps {
  positions: Position[];
  reservations: Reservation[];
  onSelect: (position: Position) => void;
  selectedPositionId?: number | null;
}

export function MapViewer({ positions, reservations, onSelect, selectedPositionId }: MapViewerProps) {
  const [scale, setScale] = useState(1);
  const today = getTodayLocalDateString();
  const reservedIds = new Set(
    reservations
      .filter((reservation) => !reservation.completed && reservation.arriveDate <= today && today <= reservation.leaveDate)
      .map((reservation) => reservation.positionId)
  );

  const pinScale = Math.min(1, 1 / Math.max(scale, 1));

  const imageAspectRatio = '885 / 768';

  return (
    <div className="rounded-[2rem] bg-white p-4 shadow-soft ring-1 ring-slate-200 min-w-0">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Interaktivna karta</h2>
          <p className="text-sm text-slate-500">Pritisnite pin kako biste rezervirali ili pogledali detalje.</p>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-50">
        <TransformWrapper
          initialScale={1}
          minScale={0.8}
          maxScale={3}
          wheel={{ step: 0.15 }}
          pinch={{ step: 5 }}
          doubleClick={{ disabled: true }}
          onTransformed={(_, state) => setScale(state.scale)}
        >
          <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
            <div
              className="relative inline-block w-full"
              style={{ width: '100%', aspectRatio: `${imageAspectRatio}`, maxWidth: '100%' }}
            >
              <img src={lakeMap} alt="Karta jezera" className="h-full w-full object-cover" />
              {positions.map((pin) => {
                const isReserved = reservedIds.has(pin.id);
                const isSelected = selectedPositionId === pin.id;
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => onSelect(pin)}
                      className={`absolute flex h-9 w-9 items-center justify-center rounded-full border-2 bg-white text-[0.72rem] font-semibold shadow-lg transition focus:outline-none ${
                      isReserved ? 'border-red-500 text-red-600' : 'border-emerald-500 text-emerald-700'
                      } ${isSelected ? 'ring-4 ring-deep-green/30' : 'hover:shadow-2xl'}`}
                      style={{
                        left: `${pin.x}%`,
                        top: `${pin.y}%`,
                        transform: `translate(-50%, -50%) scale(${pinScale})`
                      }}
                      aria-label={`Pozicija ${pin.id}`}
                    >
                      {pin.id}
                    </button>
                );
              })}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
    </div>
  );
}
