import { format, parseISO, isValid } from 'date-fns';

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatCurrency = (amount) => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
  return inrFormatter.format(num);
};

export const formatDate = (dateValue, formatString = 'dd MMM yyyy') => {
  if (!dateValue) return '—';
  try {
    const date = typeof dateValue === 'string' ? parseISO(dateValue) : new Date(dateValue);
    if (!isValid(date)) return '—';
    return format(date, formatString);
  } catch {
    return '—';
  }
};

export const formatDateTime = (dateValue, formatString = 'dd MMM yyyy, hh:mm a') => {
  return formatDate(dateValue, formatString);
};

export const formatTime = (timeString) => {
  if (!timeString) return '—';
  try {
    const parts = timeString.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parts[1];
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      return `${formattedHours}:${minutes} ${ampm}`;
    }
    return timeString;
  } catch {
    return timeString;
  }
};
