/**
 * Check if a deal is currently active based on dates
 * @param startDate - Deal start date
 * @param endDate - Deal end date
 * @returns true if current time is between start and end
 */
export function isDealActive(startDate: Date, endDate: Date): boolean {
  const now = new Date();
  return startDate <= now && now <= endDate;
}

/**
 * Check if a deal has expired
 * @param endDate - Deal end date
 * @returns true if current time is past end date
 */
export function isDealExpired(endDate: Date): boolean {
  return new Date() > endDate;
}

/**
 * Format date for Vietnamese display
 * @param date - Date to format
 * @returns Formatted date string (e.g., "03/12/2025")
 */
export function formatDateVi(date: Date): string {
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Format date range for Vietnamese display
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted range (e.g., "03/12 - 10/12/2025")
 */
export function formatDateRangeVi(startDate: Date, endDate: Date): string {
  const start = startDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  });
  const end = endDate.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return `${start} - ${end}`;
}

/**
 * Format relative time for Vietnamese display
 * @param date - Date to compare
 * @returns Relative time string (e.g., "2 giờ trước", "Còn 3 ngày")
 */
export function formatRelativeTimeVi(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    // Past
    const absDays = Math.abs(diffDays);
    const absHours = Math.abs(diffHours);

    if (absHours < 24) return `${absHours} giờ trước`;
    if (absDays === 1) return 'Hôm qua';
    return `${absDays} ngày trước`;
  } else {
    // Future
    if (diffHours < 24) return `Còn ${diffHours} giờ`;
    if (diffDays === 1) return 'Còn 1 ngày';
    return `Còn ${diffDays} ngày`;
  }
}

/**
 * Get current calendar week number (German style)
 * @param date - Date to check (defaults to now)
 * @returns Week number (e.g., 49 for "KW49")
 */
export function getCalendarWeek(date: Date = new Date()): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Format calendar week reference
 * @param date - Date to format
 * @returns Week reference (e.g., "KW49")
 */
export function formatCalendarWeek(date: Date = new Date()): string {
  return `KW${getCalendarWeek(date)}`;
}

/**
 * Check if data is stale (older than threshold)
 * @param lastUpdated - Last update timestamp
 * @param thresholdHours - Hours threshold (default: 24)
 * @returns true if data is stale
 */
export function isDataStale(lastUpdated: Date | null, thresholdHours: number = 24): boolean {
  if (!lastUpdated) return true;
  const now = new Date();
  const diffMs = now.getTime() - lastUpdated.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours > thresholdHours;
}

/**
 * Format last updated time for Vietnamese display
 * @param lastUpdated - Last update timestamp
 * @returns Formatted string (e.g., "Cập nhật lần cuối: 03/12/2025 06:00")
 */
export function formatLastUpdatedVi(lastUpdated: Date | null): string {
  if (!lastUpdated) return 'Chưa cập nhật';

  const dateStr = lastUpdated.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeStr = lastUpdated.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `Cập nhật lần cuối: ${dateStr} ${timeStr}`;
}

/**
 * Parse German date format
 * @param dateStr - Date string (e.g., "03.12.2025", "03.12.")
 * @param defaultYear - Default year if not provided
 * @returns Parsed Date or null
 */
export function parseGermanDate(dateStr: string, defaultYear?: number): Date | null {
  if (!dateStr) return null;

  const parts = dateStr.trim().replace(/\.$/, '').split('.');
  if (parts.length < 2) return null;

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parts[2] ? parseInt(parts[2], 10) : defaultYear || new Date().getFullYear();

  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;

  return new Date(year, month, day);
}
