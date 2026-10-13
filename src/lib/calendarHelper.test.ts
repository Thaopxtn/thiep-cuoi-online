import { describe, it, expect } from 'vitest';
import { generateGoogleCalendarUrl, generateIcsContent } from './calendarHelper';

describe('calendarHelper', () => {
  const mockEvent = {
    title: 'Lễ Thành Hôn Hoàng Long & Mỹ Linh',
    description: 'Trân trọng kính mời bạn đến chung vui!',
    location: 'Khách sạn JW Marriott, Hà Nội',
    startDate: '2026-11-20',
    startTime: '18:00',
    durationHours: 3,
  };

  it('tạo link Google Calendar hợp lệ chứa đúng thông tin', () => {
    const urlString = generateGoogleCalendarUrl(mockEvent);
    expect(urlString).toContain('https://calendar.google.com/calendar/render?');
    const url = new URL(urlString);
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe(mockEvent.title);
    expect(url.searchParams.get('location')).toBe(mockEvent.location);
  });

  it('sinh nội dung iCalendar .ics chuẩn RFC 5545', () => {
    const ics = generateIcsContent(mockEvent);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain(`SUMMARY:${mockEvent.title}`);
    expect(ics).toContain(`LOCATION:${mockEvent.location}`);
    expect(ics).toContain('END:VEVENT');
    expect(ics).toContain('END:VCALENDAR');
  });

  it('xử lý được định dạng ngày DD/MM/YYYY của Việt Nam', () => {
    const vnEvent = {
      ...mockEvent,
      startDate: '25/12/2026',
    };
    const urlString = generateGoogleCalendarUrl(vnEvent);
    const url = new URL(urlString);
    expect(url.searchParams.get('dates')).toContain('20261225');
  });
});
