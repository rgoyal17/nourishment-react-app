import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { ref, getDownloadURL, getStorage, uploadBytesResumable } from "firebase/storage";
import { getFirestore, setDoc, doc, query, collection, getDocs, orderBy } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

export interface Recipe {
  id: string;
  title: string;
  image: string;
  autoGenerate: boolean;
  servings: string;
  ingredients: string[];
  instructions: string[];
  cookTime: string;
  prepTime: string;
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

export interface AddNewRecipeParams {
  userId: string;
  recipe: Recipe;
}

export const addNewRecipe = createAsyncThunk(
  "recipes/addNewRecipe",
  async (params: AddNewRecipeParams) => {
    const { userId, recipe } = params;
    const id = uuidv4();

    let image = "";
    if (recipe.image.trim() !== "") {
      image = await uploadToFirebase(recipe.image, `${userId}/${id}/image.jpg`);
    }

    const db = getFirestore();
    const recipeDoc = doc(db, `users/${userId}/recipes/${id}`);
    const updatedRecipe = { ...recipe, id, image };
    await setDoc(recipeDoc, { ...updatedRecipe });

    return recipe;
  },
);

const recipesSlice = createSlice({
  name: "recipes",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchRecipes.fulfilled, (_, action) => action.payload);
    builder.addCase(addNewRecipe.fulfilled, (state, action) => [...state, action.payload]);
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

export const selectRecipeByName = (state: RootState, name: string) =>
  state.recipes.find((recipe) => recipe.title === name);

export const recipesReducer = recipesSlice.reducer;
