import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { Ingredient } from "./recipesSlice";
import { combineIngredients } from "../common/combineIngredients";

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
    const userDoc = getDoc(doc(db, `users/${userId}`));
    const groceries: GroceryItem[] = ((await userDoc).data()?.groceries as GroceryItem[]) ?? [];
    return groceries;
  },
);

interface AddGroceryItemsParams {
  userId: string;
  existingGroceryItems: GroceryItem[];
  groceryItems: GroceryItem[];
}

export const addGroceryItems = createAsyncThunk(
  "groceries/addGroceryItem",
  async ({ userId, existingGroceryItems, groceryItems }: AddGroceryItemsParams) => {
    const db = getFirestore();
    const userDoc = doc(db, `users/${userId}`);
    await updateDoc(userDoc, {
      groceries: combineIngredients([...existingGroceryItems, ...groceryItems]),
    });
    return groceryItems;
  },
);

interface SetGroceryItemsParams {
  userId: string;
  groceryItems: GroceryItem[];
}

export const setGroceryItems = createAsyncThunk(
  "groceries/setGroceryItems",
  async ({ userId, groceryItems }: SetGroceryItemsParams) => {
    const db = getFirestore();
    const userDoc = doc(db, `users/${userId}`);
    await updateDoc(userDoc, { groceries: groceryItems });
    return groceryItems;
  },
);

interface DeleteGroceryItemParams {
  userId: string;
  existingGroceryItems: GroceryItem[];
  groceryItem: GroceryItem;
}

export const deleteGroceryItem = createAsyncThunk(
  "groceries/deleteGroceryItem",
  async ({ userId, existingGroceryItems, groceryItem }: DeleteGroceryItemParams) => {
    const db = getFirestore();
    const userDoc = doc(db, `users/${userId}`);
    const updatedItems = existingGroceryItems.filter((item) => item.item !== groceryItem.item);
    await updateDoc(userDoc, { groceries: [...updatedItems] });
    return groceryItem;
  },
);

const groceriesSlice = createSlice({
  name: "groceries",
  initialState,
  reducers: {
    updateGroceryItems(state: GroceriesState, action: PayloadAction<GroceryItem[]>) {
      state.groceryItems = action.payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchGroceries.pending, ({ groceryItems }) => ({
      loading: true,
      groceryItems,
    }));
    builder.addCase(fetchGroceries.fulfilled, (_, { payload }) => ({
      loading: false,
      groceryItems: payload,
    }));
  },
});

export const { updateGroceryItems } = groceriesSlice.actions;

export const selectGroceriesState = (state: RootState) => state.groceriesState;

export const selectGroceryByItem = (item: string) => (state: RootState) =>
  state.groceriesState.groceryItems.find((groceryItem) => groceryItem.item === item);

export const groceriesReducer = groceriesSlice.reducer;
