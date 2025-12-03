'use client';

interface FormattedDateProps {
  date: string | Date | null | undefined;
  fallback?: string;
}

export default function FormattedDate({ date, fallback = '-' }: FormattedDateProps) {
  if (!date) return <>{fallback}</>;
  
  return <>{new Date(date).toLocaleString('vi-VN')}</>;
}
