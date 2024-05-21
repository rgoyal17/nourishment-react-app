import { configureStore } from "@reduxjs/toolkit";
import { recipesReducer } from "./recipesSlice";
import { calendarItemsReducer } from "./calendarSlice";
import { recipeSortOptionReducer } from "./recipeSortSlice";
import { groceriesReducer } from "./groceriesSlice";

export const store = configureStore({
  reducer: {
    recipesState: recipesReducer,
    recipeSortOption: recipeSortOptionReducer,
    calendarState: calendarItemsReducer,
    groceriesState: groceriesReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
