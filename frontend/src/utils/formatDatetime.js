export function formatDatetime(dateString) {
  if (!dateString) {
    return;
  }
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}
