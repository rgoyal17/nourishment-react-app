import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Recipe } from "./recipesSlice";
import { collection, doc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { RootState } from "./store";

export interface CalendarItem {
  date: Date;
  recipes: { label?: string; recipe: Recipe }[];
}

export const fetchCalendarItems = createAsyncThunk(
  "calendar/fetchItems",
  async (userId: string) => {
    const db = getFirestore();
    const calendarItemsCollection = collection(db, `users/${userId}/calendarItems`);
    const calendarItems: CalendarItem[] = await getDocs(calendarItemsCollection)
      .then((result) => result.docs.map((doc) => doc.data() as CalendarItem))
      .catch(() => []);
    return calendarItems;
  },
);

interface AddNewCalendarItemParams {
  userId: string;
  calendarItem: CalendarItem;
}

export const addNewCalendarItem = createAsyncThunk(
  "recipes/addNewRecipe",
  async ({ userId, calendarItem }: AddNewCalendarItemParams) => {
    const id = uuidv4();
    const db = getFirestore();
    const calendarItemDoc = doc(db, `users/${userId}/recipes/${id}`);
    await setDoc(calendarItemDoc, calendarItem);

    return calendarItem;
  },
);

const initialState: CalendarItem[] = [];

const calendarSlice = createSlice({
  name: "calendarItems",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchCalendarItems.fulfilled, (_, action) => action.payload);
  },
});

export const selectAllCalendarItems = (state: RootState) => state.calendarItems;

export const calendarItemsReducer = calendarSlice.reducer;
