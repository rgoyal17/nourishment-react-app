import { Ingredient } from "../redux/recipesSlice";
import { convert } from "./unitConversions";

export function combineIngredients(allIngredients: Ingredient[]) {
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
