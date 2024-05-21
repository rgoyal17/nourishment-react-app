import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { RootState } from "./store";

export enum SortOption {
  Name = "Name",
  Newest = "Newest",
  Oldest = "Oldest",
}

export const fetchRecipeSortOption = createAsyncThunk("sortOption/get", async (userId: string) => {
  const db = getFirestore();
  const userDoc = getDoc(doc(db, `users/${userId}`));
  const sortOption = (await userDoc).data()?.recipeSortOption as SortOption | undefined;
  return sortOption ?? SortOption.Name;
});

interface UpdateRecipeSortOptionParams {
  userId: string;
  sortOption: SortOption;
}

export const updateRecipeSortOption = createAsyncThunk(
  "sortOption/update",
  async ({ userId, sortOption }: UpdateRecipeSortOptionParams) => {
    const db = getFirestore();
    const userDoc = doc(db, `users/${userId}`);
    await updateDoc(userDoc, { recipeSortOption: sortOption });
    return sortOption;
  },
);

const recipeSortOptionSlice = createSlice({
  name: "recipesSortOption",
  initialState: SortOption.Name,
  reducers: {
    updateRecipeSortState(_state: SortOption, { payload }: PayloadAction<SortOption>) {
      return payload;
    },
  },
  extraReducers(builder) {
    builder.addCase(fetchRecipeSortOption.fulfilled, (_, action) => action.payload);
  },
});

export const { updateRecipeSortState } = recipeSortOptionSlice.actions;

export const getRecipeSortOption = (state: RootState) => state.recipeSortOption;

export const recipeSortOptionReducer = recipeSortOptionSlice.reducer;
