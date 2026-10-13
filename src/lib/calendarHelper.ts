export interface CalendarEventDetails {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // ISO string or 'YYYY-MM-DD' or timestamp
  startTime?: string; // 'HH:mm'
  durationHours?: number; // default 3 hours
}

function parseEventDate(dateStr: string, timeStr?: string): Date {
  if (!dateStr) return new Date();

  // Try parsing direct Date
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime()) && dateStr.includes('T')) {
    return parsed;
  }

  // Handle DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      let hours = 10;
      let minutes = 0;
      if (timeStr && timeStr.includes(':')) {
        const timeParts = timeStr.split(':');
        hours = parseInt(timeParts[0], 10) || 10;
        minutes = parseInt(timeParts[1], 10) || 0;
      }
      return new Date(year, month, day, hours, minutes);
    }
  }

  // Handle YYYY-MM-DD
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      let hours = 10;
      let minutes = 0;
      if (timeStr && timeStr.includes(':')) {
        const timeParts = timeStr.split(':');
        hours = parseInt(timeParts[0], 10) || 10;
        minutes = parseInt(timeParts[1], 10) || 0;
      }
      return new Date(year, month, day, hours, minutes);
    }
  }

  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatUtcForCalendar(d: Date): string {
  return d.toISOString().replace(/-|:|\.\d+/g, '');
}

/**
 * Tạo link thêm vào Google Calendar trực tiếp
 */
export function generateGoogleCalendarUrl(event: CalendarEventDetails): string {
  const start = parseEventDate(event.startDate, event.startTime);
  const end = new Date(start.getTime() + (event.durationHours || 3) * 60 * 60 * 1000);

  const startFormatted = formatUtcForCalendar(start);
  const endFormatted = formatUtcForCalendar(end);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title || 'Lễ Cưới Trọng Đại',
    dates: `${startFormatted}/${endFormatted}`,
    details: event.description || 'Trân trọng kính mời quý khách đến chung vui cùng gia đình chúng tôi!',
    location: event.location || 'Trung tâm tiệc cưới',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Sinh chuỗi iCalendar (.ics) cho Apple Calendar, Outlook
 */
export function generateIcsContent(event: CalendarEventDetails): string {
  const start = parseEventDate(event.startDate, event.startTime);
  const end = new Date(start.getTime() + (event.durationHours || 3) * 60 * 60 * 1000);

  const startFormatted = formatUtcForCalendar(start);
  const endFormatted = formatUtcForCalendar(end);
  const nowFormatted = formatUtcForCalendar(new Date());

  const uid = `zenlove-${Date.now()}-${Math.random().toString(36).substring(2, 8)}@zenlove.me`;

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ZenLove Wedding//Invitation Calendar//VI',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${nowFormatted}`,
    `DTSTART:${startFormatted}`,
    `DTEND:${endFormatted}`,
    `SUMMARY:${event.title || 'Lễ Cưới'}`,
    `DESCRIPTION:${(event.description || 'Lễ cưới thành hôn').replace(/\n/g, '\\n')}`,
    `LOCATION:${event.location || 'Trung tâm tiệc cưới'}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

/**
 * Kích hoạt tải file .ics về máy người dùng
 */
export function downloadIcsFile(event: CalendarEventDetails, fileName: string = 'wedding-invitation.ics'): void {
  if (typeof window === 'undefined') return;

  const icsData = generateIcsContent(event);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
