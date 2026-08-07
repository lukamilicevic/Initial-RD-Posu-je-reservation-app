import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Reservation } from '../types';

function normalizeSupabaseUrl(value: string): string {
  const trimmed = value.trim();
  const withoutTrailingSlash = trimmed.replace(/\/+$/, '');
  const withoutRest = withoutTrailingSlash.replace(/\/(?:rest\/v1|auth\/v1)$/i, '');
  if (withoutRest !== withoutTrailingSlash) {
    console.warn(
      'Supabase URL contains an extra path segment like /rest/v1 or /auth/v1. Using the base project URL instead.'
    );
  }
  return withoutRest;
}

const rawSupabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  import.meta.env.SUPABASE_URL ??
  '';
const SUPABASE_URL = rawSupabaseUrl ? normalizeSupabaseUrl(rawSupabaseUrl) : '';

const rawSupabaseKeys = [
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  import.meta.env.SUPABASE_ANON_KEY,
  import.meta.env.SUPABASE_PUBLISHABLE_KEY
].filter(Boolean) as string[];

function isSecretSupabaseKey(key: string) {
  return key.startsWith('sb_secret_') || key.toLowerCase().includes('service_role');
}

const SUPABASE_ANON_KEY = rawSupabaseKeys.find((key) => !isSecretSupabaseKey(key));
const SECRET_SUPABASE_KEY = rawSupabaseKeys.find((key) => isSecretSupabaseKey(key));

if (!SUPABASE_URL) {
  console.warn(
    'Supabase URL nije konfiguriran. Provjerite VITE_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_URL ili SUPABASE_URL.'
  );
}
if (!SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase anon key nije konfiguriran. Provjerite VITE_SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY ili SUPABASE_ANON_KEY.'
  );
}

if (!SUPABASE_ANON_KEY && SECRET_SUPABASE_KEY) {
  console.warn(
    'Supabase frontend has a secret API key configured. Use a browser-safe anon key instead: VITE_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

const supabaseClient: SupabaseClient | null =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

export const hasRemoteBackend = Boolean(supabaseClient);

function toCamelCaseReservation(row: any): Reservation {
  if (!row) {
    throw new Error('Supabase response is empty. Provjerite shemu tablice i vraćanje podataka.');
  }

  return {
    id: row.id,
    positionId: row.positionId ?? row.position_id,
    firstName: row.firstName ?? row.first_name,
    lastName: row.lastName ?? row.last_name,
    phone: row.phone,
    arriveDate: row.arriveDate ?? row.arrive_date,
    leaveDate: row.leaveDate ?? row.leave_date,
    persons: row.persons ?? row.persons,
    notes: row.notes,
    completed: row.completed
  };
}

function toSnakeCaseReservation(reservation: Reservation) {
  return {
    id: reservation.id,
    position_id: reservation.positionId,
    first_name: reservation.firstName,
    last_name: reservation.lastName,
    phone: reservation.phone,
    arrive_date: reservation.arriveDate,
    leave_date: reservation.leaveDate,
    persons: reservation.persons,
    notes: reservation.notes,
    completed: reservation.completed
  };
}

async function fetchReservationById(id: string): Promise<Reservation> {
  const { data, error } = await supabaseClient!
    .from('reservations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return toCamelCaseReservation(data);
}

async function tryInsertReservation(reservation: Reservation): Promise<Reservation> {
  const { data, error } = await supabaseClient!
    .from('reservations')
    .insert(reservation)
    .single();

  if (!error) {
    if (data) {
      return toCamelCaseReservation(data);
    }
    return await fetchReservationById(reservation.id);
  }

  if (/arrivedate|leaveDate|positionId|firstName|lastName|unknown column/i.test(error.message)) {
    const { data: snakeData, error: snakeError } = await supabaseClient!
      .from('reservations')
      .insert(toSnakeCaseReservation(reservation))
      .single();

    if (snakeError) {
      throw snakeError;
    }

    if (snakeData) {
      return toCamelCaseReservation(snakeData);
    }
    return await fetchReservationById(reservation.id);
  }

  throw error;
}

async function tryUpdateReservation(reservation: Reservation): Promise<Reservation> {
  const { data, error } = await supabaseClient!
    .from('reservations')
    .update(reservation)
    .eq('id', reservation.id)
    .single();

  if (!error) {
    if (data) {
      return toCamelCaseReservation(data);
    }
    return await fetchReservationById(reservation.id);
  }

  if (/arrivedate|leaveDate|positionId|firstName|lastName|unknown column/i.test(error.message)) {
    const { data: snakeData, error: snakeError } = await supabaseClient!
      .from('reservations')
      .update(toSnakeCaseReservation(reservation))
      .eq('id', reservation.id)
      .single();

    if (snakeError) {
      throw snakeError;
    }

    if (snakeData) {
      return toCamelCaseReservation(snakeData);
    }
    return await fetchReservationById(reservation.id);
  }

  throw error;
}

async function trySelectReservations(): Promise<Reservation[]> {
  const { data, error } = await supabaseClient!.from('reservations').select('*');
  if (error) {
    throw error;
  }

  const reservations = (data ?? []).map((row) => toCamelCaseReservation(row));
  return reservations.sort((a, b) => a.arriveDate.localeCompare(b.arriveDate));
}

export async function fetchRemoteReservations(): Promise<Reservation[]> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  return await trySelectReservations();
}

export async function addRemoteReservation(reservation: Reservation): Promise<Reservation> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  return await tryInsertReservation(reservation);
}

export async function updateRemoteReservation(reservation: Reservation): Promise<Reservation> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  return await tryUpdateReservation(reservation);
}

export async function deleteRemoteReservation(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  const { error } = await supabaseClient.from('reservations').delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export async function markRemoteReservationCompleted(id: string): Promise<void> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  const { error } = await supabaseClient
    .from('reservations')
    .update({ completed: true })
    .eq('id', id);

  if (error) {
    throw error;
  }
}
