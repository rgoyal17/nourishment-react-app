export function getLocalDateString(dateObj: Date) {
  const [month, date, year] = dateObj.toLocaleDateString().split("/");
  const twoDigitMonth = month.length === 1 ? `0${month}` : month;
  const twoDigitDate = date.length === 1 ? `0${date}` : date;

  return `${year}-${twoDigitMonth}-${twoDigitDate}`;
}

export function getMonthDateString(dateObj: Date) {
  return `${dateObj.toLocaleString("default", { month: "short" })} ${dateObj.getDate()}`;
}

export function getDatesInRange(startDate: Date, stopDate: Date) {
  const dateArray = [];
  const currentDate = new Date(startDate);
  while (currentDate <= stopDate) {
    dateArray.push(getLocalDateString(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateArray;
}
