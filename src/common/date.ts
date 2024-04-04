export function getLocalDateString(dateObj: Date) {
  const [month, date, year] = dateObj.toLocaleDateString().split("/");
  const twoDigitMonth = month.length === 1 ? `0${month}` : month;
  const twoDigitDate = date.length === 1 ? `0${date}` : date;

  return `${year}-${twoDigitMonth}-${twoDigitDate}`;
}

export function getMonthDateString(dateObj: Date) {
  return `${dateObj.toLocaleString("default", { month: "short" })} ${dateObj.getDate()}`;
}

export function getFutureDates(dateObj: Date) {
  const weekDateObj = new Date(dateObj);
  weekDateObj.setDate(weekDateObj.getDate() + 6);

  const monthDateObj = new Date(dateObj);
  monthDateObj.setMonth(dateObj.getMonth() + 1);

  return { weekDateObj, monthDateObj };
}
