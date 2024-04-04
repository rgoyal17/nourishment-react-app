import { uniq } from "lodash";
import {
  CalendarView,
  selectCalendarItemsByDate,
  selectCalendarItemsByDates,
} from "../redux/calendarSlice";
import { useAppSelector } from "../redux/hooks";
import { Ingredient, selectRecipesByIds } from "../redux/recipesSlice";
import { getFutureDates, getLocalDateString } from "../common/date";

export function useIngredientsByDate(date: string, calendarView: CalendarView): Ingredient[] {
  const dateObj = new Date(date + "T00:00:00");
  const calendarItemsByDay = useAppSelector(selectCalendarItemsByDate(date));
  const recipeIdsByDay = uniq(
    calendarItemsByDay?.recipeData.flatMap((data) => data.recipeIds) ?? [],
  );
  const recipesByDay = useAppSelector((state) => selectRecipesByIds(state, recipeIdsByDay));
  const ingredientsByDay = recipesByDay.flatMap((recipe) => recipe.ingredientsParsed);

  const { weekDateObj, monthDateObj } = getFutureDates(dateObj);

  const calendarItemsByWeek = useAppSelector((state) =>
    selectCalendarItemsByDates(state, getDatesInRange(dateObj, weekDateObj)),
  );
  const recipeIdsByWeek = uniq(
    calendarItemsByWeek.flatMap((item) => item.recipeData.flatMap((data) => data.recipeIds) ?? []),
  );
  const recipesByWeek = useAppSelector((state) => selectRecipesByIds(state, recipeIdsByWeek));
  const ingredientsByWeek = recipesByWeek.flatMap((recipe) => recipe.ingredientsParsed);

  const calendarItemsByMonth = useAppSelector((state) =>
    selectCalendarItemsByDates(state, getDatesInRange(dateObj, monthDateObj)),
  );
  const recipeIdsByMonth = uniq(
    calendarItemsByMonth.flatMap((item) => item.recipeData.flatMap((data) => data.recipeIds) ?? []),
  );
  const recipesByMonth = useAppSelector((state) => selectRecipesByIds(state, recipeIdsByMonth));
  const ingredientsByMonth = recipesByMonth.flatMap((recipe) => recipe.ingredientsParsed);

  switch (calendarView) {
    case CalendarView.DAY:
      return ingredientsByDay;
    case CalendarView.WEEK:
      return ingredientsByWeek;
    case CalendarView.MONTH:
      return ingredientsByMonth;
    default:
      return [];
  }
}

function getDatesInRange(startDate: Date, stopDate: Date) {
  const dateArray = [];
  const currentDate = new Date(startDate);
  while (currentDate <= stopDate) {
    dateArray.push(getLocalDateString(new Date(currentDate)));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dateArray;
}
