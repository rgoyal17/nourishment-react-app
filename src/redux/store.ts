import { configureStore } from "@reduxjs/toolkit";
import { recipesReducer } from "./recipesSlice";
import { calendarItemsReducer } from "./calendarSlice";
import { recipeSortOptionReducer } from "./recipeSortSlice";

export const store = configureStore({
  reducer: {
    recipes: recipesReducer,
    recipeSortOption: recipeSortOptionReducer,
    calendarItems: calendarItemsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
