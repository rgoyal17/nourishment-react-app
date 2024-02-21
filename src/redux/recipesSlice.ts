import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
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

export interface Ingredient {
  item: string;
  quantity: string;
  unit: string;
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
  websiteUrl?: string;
}

const initialState: Recipe[] = [];

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
    const updatedRecipe = { ...recipe, id, image };
    await setDoc(recipeDoc, { ...updatedRecipe });

    return recipe;
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
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchRecipes.fulfilled, (_, action) => action.payload);
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

export const selectAllRecipes = (state: RootState) => state.recipes;

export const selectRecipeById = (id: string) => (state: RootState) =>
  state.recipes.find((recipe) => recipe.id === id);

export const selectRecipesByIds = createSelector(
  [selectAllRecipes, (_state: RootState, recipeIds: string[]) => recipeIds],
  (recipes, recipeIds) => recipes.filter((recipe) => recipeIds.includes(recipe.id)),
);

export const recipesReducer = recipesSlice.reducer;
