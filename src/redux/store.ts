import { configureStore } from "@reduxjs/toolkit";
import { recipesReducer } from "./recipesSlice";
import { calendarItemsReducer } from "./calendarSlice";

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    calendarItems: calendarItemsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
