import { PayloadAction, createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { ref, getDownloadURL, getStorage, uploadBytesResumable } from "firebase/storage";
import {
  getFirestore,
  setDoc,
  doc,
  query,
  collection,
  getDocs,
  orderBy,
  deleteDoc,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { CalendarItem } from "./calendarSlice";

export interface Ingredient {
  category: string;
  item: string;
  quantity: string;
  notes: string;
  unit: string;
  /** true when ingredient could not be parsed */
  error?: boolean;
}

export interface Recipe {
  id: string;
  title: string;
  image: string;
  servings: string;
  ingredientsParsed: Ingredient[];
  ingredientsRaw: string[];
  instructions: string[];
  cookTime: string;
  prepTime: string;
  isoDate: string;
  isParsing: boolean;
  websiteUrl?: string;
}

export interface RecipesState {
  loading: boolean;
  recipes: Recipe[];
}

const initialState: RecipesState = { loading: false, recipes: [] };

export const fetchRecipes = createAsyncThunk("recipes/fetchRecipes", async (userId: string) => {
  const db = getFirestore();
  const recipesCollection = collection(db, `users/${userId}/recipes`);
  const recipes: Recipe[] = await getDocs(query(recipesCollection, orderBy("title")))
    .then((result) => result.docs.map((doc) => doc.data() as Recipe))
    .catch(() => []);
  return recipes;
});

interface AddNewRecipeParams {
  userId: string;
  recipe: Recipe;
}

export const addNewRecipe = createAsyncThunk(
  "recipes/addNewRecipe",
  async ({ userId, recipe }: AddNewRecipeParams) => {
    const id = uuidv4();

    let image = "";
    if (recipe.image !== "") {
      image = await uploadToFirebase(recipe.image, `${userId}/${id}/image.jpg`);
    }

    const db = getFirestore();
    const recipeDoc = doc(db, `users/${userId}/recipes/${id}`);
    const updatedRecipe = { ...recipe, id, image, isoDate: new Date().toISOString() };
    await setDoc(recipeDoc, { ...updatedRecipe, isParsing: true });

    return updatedRecipe;
  },
);

interface DeleteRecipeParams {
  userId: string;
  recipeId: string;
}

export const deleteRecipe = createAsyncThunk(
  "recipes/deleteRecipe",
  async ({ userId, recipeId }: DeleteRecipeParams) => {
    const db = getFirestore();
    const recipeDoc = doc(db, `users/${userId}/recipes/${recipeId}`);
    await deleteDoc(recipeDoc);

    // delete the recipe from calendar
    const calendarItemsCollection = collection(db, `users/${userId}/calendarItems`);
    const calendarItems: CalendarItem[] = await getDocs(calendarItemsCollection)
      .then((result) => result.docs.map((doc) => doc.data() as CalendarItem))
      .catch(() => []);
    calendarItems.forEach((item) => {
      const calendarItemDoc = doc(db, `users/${userId}/calendarItems/${item.date}`);
      const recipeData = item.recipeData;
      recipeData.forEach(async (data, index) => {
        const recipeIds = data.recipeIds;
        if (recipeIds.includes(recipeId)) {
          if (recipeIds.length === 1) {
            if (recipeData.length === 1) {
              // this is the only `data` in `recipeData`, so delete the entire calendarItem
              await deleteDoc(calendarItemDoc);
            } else {
              // this is the only recipe in `data`, so delete this `data` in `recipeData`
              const newRecipeData = [...recipeData];
              newRecipeData.splice(index, 1);
              await setDoc(calendarItemDoc, { ...item, recipeData: newRecipeData });
            }
          } else {
            const filteredRecipeIds = recipeIds.filter((id) => id !== recipeId);
            const newRecipeData = [...recipeData];
            newRecipeData[index] = { ...recipeData[index], recipeIds: filteredRecipeIds };
            await setDoc(calendarItemDoc, { ...item, recipeData: newRecipeData });
          }
        }
      });
    });

    return recipeId;
  },
);

interface EditRecipeParams {
  userId: string;
  recipe: Recipe;
}

export const editRecipe = createAsyncThunk(
  "recipes/editRecipe",
  async ({ userId, recipe }: EditRecipeParams) => {
    const db = getFirestore();
    const recipeDoc = doc(db, `users/${userId}/recipes/${recipe.id}`);
    await setDoc(recipeDoc, { ...recipe });
    return recipe;
  },
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {
    updateRecipe(state: RecipesState, { payload }: PayloadAction<Recipe>) {
      state.recipes = [...state.recipes].map((recipe) =>
        recipe.id === payload.id ? payload : recipe,
      );
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchRecipes.pending, ({ recipes }) => ({
      loading: true,
      recipes,
    }));
    builder.addCase(fetchRecipes.fulfilled, (_, { payload }) => ({
      loading: false,
      recipes: payload,
    }));
  },
});

const uploadToFirebase = async (imageUri: string, storagePath: string): Promise<string> => {
  const fetchResponse = await fetch(imageUri);
  const blob = await fetchResponse.blob();

  const imageRef = ref(getStorage(), storagePath);
  const uploadTask = await uploadBytesResumable(imageRef, blob);

  const downloadUrl = await getDownloadURL(uploadTask.ref);
  return downloadUrl;
};

export const { updateRecipe } = recipesSlice.actions;

export const selectRecipesState = (state: RootState) => state.recipesState;

export const selectAllRecipes = (state: RootState) => state.recipesState.recipes;

export const selectRecipeById = (id: string) => (state: RootState) =>
  state.recipesState.recipes.find((recipe) => recipe.id === id);

export const selectRecipesByIds = createSelector(
  [selectAllRecipes, (_state: RootState, recipeIds: string[]) => recipeIds],
  (recipes, recipeIds) => recipes.filter((recipe) => recipeIds.includes(recipe.id)),
);

export const recipesReducer = recipesSlice.reducer;
