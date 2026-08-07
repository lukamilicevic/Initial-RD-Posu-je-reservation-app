import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Reservation } from '../types';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ??
  import.meta.env.SUPABASE_URL;
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.SUPABASE_ANON_KEY ??
  import.meta.env.SUPABASE_PUBLISHABLE_KEY;

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
