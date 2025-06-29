import { parse, isValid, format } from 'date-fns';

const SUPPORTED_FORMATS = [
  'yyyy-MM-dd',
  'MM/dd/yyyy',
  'dd/MM/yyyy',
  'M/d/yyyy',
  'yyyy.MM.dd',
  'dd-MM-yyyy',
  'yyyy/MM/dd',
];

export const parseDateString = (dateString: string | undefined | null): string | undefined => {
  if (!dateString) {
    return undefined;
  }

  for (const fmt of SUPPORTED_FORMATS) {
    const parsedDate = parse(dateString, fmt, new Date());
    if (isValid(parsedDate)) {
      return format(parsedDate, 'yyyy-MM-dd');
    }
  }

  const fallbackDate = new Date(dateString);
  if (isValid(fallbackDate)) {
    return format(fallbackDate, 'yyyy-MM-dd');
  }

  return undefined;
};