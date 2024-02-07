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
  title: string;
  data: CalendarItemData[];
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
  calendarItemData: CalendarItemData;
}

export const addNewCalendarItem = createAsyncThunk(
  "calendar/addNewCalendarItem",
  async ({ userId, date, calendarItemData }: AddNewCalendarItemParams) => {
    const db = getFirestore();
    const title = getLocalDateString(date);
    const calendarItemDoc = doc(db, `users/${userId}/calendarItems/${title}`);
    // there can be existing calendar item for this date
    try {
      const existingData: CalendarItemData[] | undefined = (await getDoc(calendarItemDoc)).data()
        ?.data;
      // there can be existing recipes for this label on this date.
      const existingLabelData = existingData?.find((data) => data.label === calendarItemData.label);

      if (existingData == null) {
        await setDoc(calendarItemDoc, { title, data: [calendarItemData] });
      } else if (existingLabelData == null) {
        await setDoc(calendarItemDoc, { title, data: [...existingData, calendarItemData] });
      } else {
        const filteredData = existingData.filter((data) => data.label !== calendarItemData.label);
        const updatedLabelData: CalendarItemData = {
          ...existingLabelData,
          recipeIds: uniq([...existingLabelData.recipeIds, ...calendarItemData.recipeIds]),
        };
        await setDoc(calendarItemDoc, { title, data: [...filteredData, updatedLabelData] });
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
