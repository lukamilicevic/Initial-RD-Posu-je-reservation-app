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

export async function fetchRemoteReservations(): Promise<Reservation[]> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  const { data, error } = await supabaseClient
    .from('reservations')
    .select('*')
    .order('arriveDate', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function addRemoteReservation(reservation: Reservation): Promise<Reservation> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  const { data, error } = await supabaseClient
    .from('reservations')
    .insert(reservation)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateRemoteReservation(reservation: Reservation): Promise<Reservation> {
  if (!supabaseClient) {
    throw new Error('Supabase nije konfiguriran.');
  }

  const { data, error } = await supabaseClient
    .from('reservations')
    .update(reservation)
    .eq('id', reservation.id)
    .single();

  if (error) {
    throw error;
  }

  return data;
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
