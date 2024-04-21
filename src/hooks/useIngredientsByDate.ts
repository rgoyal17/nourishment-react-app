import { uniq } from "lodash";
import { selectCalendarItemsByDates } from "../redux/calendarSlice";
import { useAppSelector } from "../redux/hooks";
import { Ingredient, selectRecipesByIds } from "../redux/recipesSlice";
import { getLocalDateString } from "../common/date";

export function useIngredientsByDate(startDate: Date, endDate: Date): Ingredient[] {
  const calendarItems = useAppSelector((state) =>
    selectCalendarItemsByDates(state, getDatesInRange(startDate, endDate)),
  );
  const recipeIds = uniq(
    calendarItems.flatMap((item) => item.recipeData.flatMap((data) => data.recipeIds) ?? []),
  );
  const recipes = useAppSelector((state) => selectRecipesByIds(state, recipeIds));
  return recipes.flatMap((recipe) => recipe.ingredientsParsed);
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
