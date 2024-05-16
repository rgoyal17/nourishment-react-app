import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { getFirestore, setDoc, doc, collection, getDocs, deleteDoc } from "firebase/firestore";
import { Ingredient } from "./recipesSlice";

export interface GroceryItem extends Ingredient {
  isChecked: boolean;
}

interface GroceriesState {
  loading: boolean;
  groceryItems: GroceryItem[];
}

const initialState: GroceriesState = { loading: false, groceryItems: [] };

export const fetchGroceries = createAsyncThunk(
  "groceries/fetchGroceries",
  async (userId: string) => {
    const db = getFirestore();
    const groceriesCollection = collection(db, `users/${userId}/groceries`);
    const groceries: GroceryItem[] = await getDocs(groceriesCollection)
      .then((result) => result.docs.map((doc) => doc.data() as GroceryItem))
      .catch(() => []);
    return groceries;
  },
);

interface AddNewGroceryItemParams {
  userId: string;
  groceryItem: GroceryItem;
}

export const addNewGroceryItem = createAsyncThunk(
  "groceries/addNewGroceryItem",
  async ({ userId, groceryItem }: AddNewGroceryItemParams) => {
    if (groceryItem.item.trim().length === 0) {
      throw new Error("Item name should not be empty");
    }
    const db = getFirestore();
    const groceryItemDoc = doc(db, `users/${userId}/groceries/${groceryItem.item}`);
    await setDoc(groceryItemDoc, groceryItem);

    return groceryItem;
  },
);

interface DeleteGroceryItemParams {
  userId: string;
  groceryItem: GroceryItem;
}

export const deleteGroceryItem = createAsyncThunk(
  "groceries/deleteGroceryItem",
  async ({ userId, groceryItem }: DeleteGroceryItemParams) => {
    const db = getFirestore();
    const groceryItemDoc = doc(db, `users/${userId}/groceries/${groceryItem.item}`);
    await deleteDoc(groceryItemDoc);

    return groceryItem;
  },
);

const groceriesSlice = createSlice({
  name: "groceries",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchGroceries.pending, () => ({ loading: true, groceryItems: [] }));
    builder.addCase(fetchGroceries.fulfilled, (_, { payload }) => ({
      loading: false,
      groceryItems: payload,
    }));
  },
});

export const selectGroceriesState = (state: RootState) => state.groceriesState;

export const selectGroceryByItem = (item: string) => (state: RootState) =>
  state.groceriesState.groceryItems.find((groceryItem) => groceryItem.item === item);

export const groceriesReducer = groceriesSlice.reducer;
