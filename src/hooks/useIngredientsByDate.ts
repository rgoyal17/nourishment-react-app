import { selectCalendarItemsByDates } from "../redux/calendarSlice";
import { useAppSelector } from "../redux/hooks";
import { Ingredient, selectAllRecipes } from "../redux/recipesSlice";
import { getLocalDateString } from "../common/date";
import { convert } from "../common/unitConversions";
import { compact } from "lodash";

export function useIngredientsByDate(startDate: Date, endDate: Date): Ingredient[] {
  const calendarItems = useAppSelector((state) =>
    selectCalendarItemsByDates(state, getDatesInRange(startDate, endDate)),
  );
  const allRecipes = useAppSelector(selectAllRecipes);
  const recipeIds = calendarItems.flatMap(
    (item) => item.recipeData.flatMap((data) => data.recipeIds) ?? [],
  );
  const recipes = compact(recipeIds.map((id) => allRecipes.find((recipe) => recipe.id === id)));
  const allIngredients = recipes.flatMap((recipe) => recipe.ingredientsParsed);

  let finalIngredients: Ingredient[] = [];
  allIngredients.forEach((ingredient) => {
    const existingIngredientIndex = finalIngredients.findIndex((i) => i.item === ingredient.item);
    const existingIngredient = finalIngredients[existingIngredientIndex];
    if (existingIngredientIndex === -1) {
      // ingredient does not already exist, add it as it is.
      finalIngredients.push(ingredient);
    } else {
      const convertedQuantity = convert(
        ingredient.quantity,
        ingredient.unit,
        existingIngredient.unit,
      );
      if (convertedQuantity == null || existingIngredient.quantity === "") {
        // ingredient exists already but couldn't add/convert quantities, so remove quantity and unit.
        const updatedIngredient: Ingredient = {
          ...existingIngredient,
          quantity: "",
          unit: "",
          error: convertedQuantity == null,
        };
        finalIngredients = finalIngredients.map((item, index) =>
          index === existingIngredientIndex ? updatedIngredient : item,
        );
      } else {
        // ingredient exists already, quantity should be updated.
        const updatedQuantity = (
          Math.round((+existingIngredient.quantity + +convertedQuantity) * 100) / 100
        ).toString();
        const updatedIngredient: Ingredient = { ...existingIngredient, quantity: updatedQuantity };
        finalIngredients = finalIngredients.map((item, index) =>
          index === existingIngredientIndex ? updatedIngredient : item,
        );
      }
    }
  });

  return finalIngredients;
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
