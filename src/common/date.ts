export function getLocalDateString(dateObj: Date) {
  const [month, date, year] = dateObj.toLocaleDateString().split("/");
  const twoDigitMonth = month.length === 1 ? `0${month}` : month;
  const twoDigitDate = date.length === 1 ? `0${date}` : date;

  return `${year}-${twoDigitMonth}-${twoDigitDate}`;
}
