import { createAsyncThunk, createSelector, createSlice } from "@reduxjs/toolkit";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { RootState } from "./store";
import { uniq } from "lodash";

export enum CalendarView {
  DAY,
  WEEK,
  MONTH,
}

export interface CalendarItemData {
  label?: string;
  recipeIds: string[];
}

export interface CalendarItem {
  date: string;
  recipeData: CalendarItemData[];
}

export interface CalendarState {
  loading: boolean;
  calendarItems: CalendarItem[];
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
  date: string;
  recipeData: CalendarItemData;
}

export const addNewCalendarItem = createAsyncThunk(
  "calendar/addNewCalendarItem",
  async ({ userId, date, recipeData }: AddNewCalendarItemParams) => {
    const db = getFirestore();
    const calendarItemDoc = doc(db, `users/${userId}/calendarItems/${date}`);
    // there can be existing calendar item for this date
    const existingData: CalendarItemData[] | undefined = (await getDoc(calendarItemDoc)).data()
      ?.recipeData;
    // there can be existing recipes for this label on this date.
    const existingLabelData = existingData?.find((data) => data.label === recipeData.label);

    if (existingData == null) {
      await setDoc(calendarItemDoc, { date, recipeData: [recipeData] });
    } else if (existingLabelData == null) {
      await setDoc(calendarItemDoc, {
        date,
        recipeData: [...existingData, recipeData],
      });
    } else {
      const filteredData = existingData.filter((data) => data.label !== recipeData.label);
      const updatedLabelData: CalendarItemData = {
        ...existingLabelData,
        recipeIds: uniq([...existingLabelData.recipeIds, ...recipeData.recipeIds]),
      };
      await setDoc(calendarItemDoc, {
        date,
        recipeData: [...filteredData, updatedLabelData],
      });
    }
  },
);

interface EditCalendarItemParams {
  userId: string;
  date: string;
  prevData: CalendarItemData;
  newData: CalendarItemData;
}

export const editCalendarItem = createAsyncThunk(
  "calendar/editCalendarItem",
  async ({ userId, date, prevData, newData }: EditCalendarItemParams) => {
    const db = getFirestore();
    const calendarItemDoc = doc(db, `users/${userId}/calendarItems/${date}`);
    const existingData = (await getDoc(calendarItemDoc)).data() as CalendarItem;
    const updatedRecipeData = [...existingData.recipeData].map((recipeData) =>
      recipeData.label === prevData.label
        ? newData.label == null
          ? { recipeIds: newData.recipeIds }
          : { label: newData.label, recipeIds: newData.recipeIds }
        : recipeData,
    );
    await setDoc(calendarItemDoc, { date, recipeData: updatedRecipeData });
  },
);

interface DeleteCalendarItemParams {
  userId: string;
  date: string;
  label?: string;
}

export const deleteCalendarItem = createAsyncThunk(
  "calendar/deleteCalendarItem",
  async ({ userId, date, label }: DeleteCalendarItemParams) => {
    const db = getFirestore();
    const calendarItemDoc = doc(db, `users/${userId}/calendarItems/${date}`);
    const existingData = (await getDoc(calendarItemDoc)).data() as CalendarItem;
    if (existingData.recipeData.length === 1 && existingData.recipeData[0].label === label) {
      // this is the only recipe data on the doc, so delete the entire doc.
      await deleteDoc(calendarItemDoc);
    } else {
      await setDoc(calendarItemDoc, {
        date: existingData.date,
        recipeData: [...existingData.recipeData].filter((data) => data.label !== label),
      });
    }
  },
);

const initialState: CalendarState = { loading: false, calendarItems: [] };

const calendarSlice = createSlice({
  name: "calendarItems",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchCalendarItems.pending, ({ calendarItems }) => ({
      loading: true,
      calendarItems,
    }));
    builder.addCase(fetchCalendarItems.fulfilled, (_, { payload }) => ({
      loading: false,
      calendarItems: payload,
    }));
  },
});

export const selectCalendarState = (state: RootState) => state.calendarState;

export const selectAllCalendarItems = (state: RootState) => state.calendarState.calendarItems;

export const selectCalendarItemsByDate = (date: string) => (state: RootState) =>
  state.calendarState.calendarItems.find((item) => item.date === date);

export const selectCalendarItemsByDates = createSelector(
  [selectAllCalendarItems, (_state: RootState, dates: string[]) => dates],
  (calendarItems, dates) => calendarItems.filter((item) => dates.includes(item.date)),
);

export const calendarItemsReducer = calendarSlice.reducer;
