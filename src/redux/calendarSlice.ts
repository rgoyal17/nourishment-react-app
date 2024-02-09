import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { collection, doc, getDoc, getDocs, getFirestore, setDoc } from "firebase/firestore";
import { RootState } from "./store";
import { uniq } from "lodash";
import * as Sentry from "@sentry/react-native";
import { getLocalDateString } from "../common/date";

export interface CalendarItemData {
  label?: string;
  recipeIds: string[];
}

export interface CalendarItem {
  date: string;
  recipeData: CalendarItemData[];
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
  date: Date;
  recipeData: CalendarItemData;
}

export const addNewCalendarItem = createAsyncThunk(
  "calendar/addNewCalendarItem",
  async ({ userId, date, recipeData }: AddNewCalendarItemParams) => {
    const db = getFirestore();
    const dateId = getLocalDateString(date);
    const calendarItemDoc = doc(db, `users/${userId}/calendarItems/${dateId}`);
    // there can be existing calendar item for this date
    try {
      const existingData: CalendarItemData[] | undefined = (await getDoc(calendarItemDoc)).data()
        ?.recipeData;
      // there can be existing recipes for this label on this date.
      const existingLabelData = existingData?.find((data) => data.label === recipeData.label);

      if (existingData == null) {
        await setDoc(calendarItemDoc, { date: dateId, recipeData: [recipeData] });
      } else if (existingLabelData == null) {
        await setDoc(calendarItemDoc, {
          date: dateId,
          recipeData: [...existingData, recipeData],
        });
      } else {
        const filteredData = existingData.filter((data) => data.label !== recipeData.label);
        const updatedLabelData: CalendarItemData = {
          ...existingLabelData,
          recipeIds: uniq([...existingLabelData.recipeIds, ...recipeData.recipeIds]),
        };
        await setDoc(calendarItemDoc, {
          date: dateId,
          recipeData: [...filteredData, updatedLabelData],
        });
      }
    } catch (e) {
      Sentry.captureException(e);
    }
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
