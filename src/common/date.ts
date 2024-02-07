export function getLocalDateString(date: Date) {
  const [month, localDate, year] = date.toLocaleDateString().split("/");
  return `${year}-${month}-${localDate}`;
}
