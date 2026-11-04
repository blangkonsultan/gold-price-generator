import { InputError } from '../domain/pricing.ts';

const MONTHS = ['januari', 'februari', 'maret', 'april', 'mei', 'juni', 'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
const formatter = new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'UTC' });

function calendarDate(iso: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso) || Number(iso.slice(0, 4)) < 1) return null;
  const date = new Date(iso + 'T12:00:00.000Z');
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === iso ? date : null;
}

export function isValidISODate(iso: string): boolean {
  return calendarDate(iso) !== null;
}

export function parseIndonesianDate(text: string): string | null {
  const match = /^(\d{1,2})\s*([a-z]+)\s*(\d{4})$/i.exec(text.trim());
  if (!match) return null;
  const month = MONTHS.indexOf(match[2]!.toLowerCase()) + 1;
  if (!month) return null;
  const iso = `${match[3]}-${String(month).padStart(2, '0')}-${match[1]!.padStart(2, '0')}`;
  return isValidISODate(iso) ? iso : null;
}

export function formatIndonesianDate(iso: string): string {
  const date = calendarDate(iso);
  if (!date) throw new InputError('Pilih tanggal yang valid sebelum mengunduh.');
  let text = '';
  for (const part of formatter.formatToParts(date)) text += part.type === 'year' ? iso.slice(0, 4) : part.value;
  return text;
}
