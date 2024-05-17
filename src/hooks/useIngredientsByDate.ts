import { selectCalendarItemsByDates } from "../redux/calendarSlice";
import { useAppSelector } from "../redux/hooks";
import { Ingredient, selectAllRecipes } from "../redux/recipesSlice";
import { getLocalDateString } from "../common/date";
import { compact } from "lodash";
import { combineIngredients } from "../common/combineIngredients";

export function useIngredientsByDate(startDate: Date, endDate: Date): Ingredient[] {
  const dates = getDatesInRange(startDate, endDate);
  const calendarItems = useAppSelector((state) => selectCalendarItemsByDates(state, dates));
  const allRecipes = useAppSelector(selectAllRecipes);
  const recipeIds = calendarItems.flatMap(
    (item) => item.recipeData.flatMap((data) => data.recipeIds) ?? [],
  );
  const recipes = compact(recipeIds.map((id) => allRecipes.find((recipe) => recipe.id === id)));
  const allIngredients = recipes.flatMap((recipe) => recipe.ingredientsParsed);
  return combineIngredients(allIngredients);
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
