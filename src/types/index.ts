export interface Position {
  id: number;
  x: number;
  y: number;
}

export interface Reservation {
  id: string;
  positionId: number;
  firstName: string;
  lastName: string;
  phone: string;
  arriveDate: string;
  leaveDate: string;
  persons: number;
  notes?: string;
  completed: boolean;
}

export interface ReservationFormValues {
  firstName: string;
  lastName: string;
  phone: string;
  arriveDate: Date | null;
  leaveDate: Date | null;
  persons: number;
  notes?: string;
}
