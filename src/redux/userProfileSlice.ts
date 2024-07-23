import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "./store";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email?: string | null;
  name?: string | null;
  photo?: string | null;
}

interface UserProfileState {
  loading: boolean;
  userProfile: UserProfile;
}

const initialState: UserProfileState = { loading: true, userProfile: { uid: "" } };

export const fetchUserProfile = createAsyncThunk(
  "userProfile/fetchUserProfile",
  async (userId: string) => {
    const db = getFirestore();
    const userDoc = getDoc(doc(db, `users/${userId}`));
    const userProfile = (await userDoc).data()?.profile as UserProfile;
    return userProfile;
  },
);

interface UpdateUserProfileParams {
  userId: string;
  existingUserProfile: UserProfile;
  updatedUserProfile: Partial<UserProfile>;
}

export const updateUserProfile = createAsyncThunk(
  "userProfile/updateUserProfile",
  async ({ userId, existingUserProfile, updatedUserProfile }: UpdateUserProfileParams) => {
    const db = getFirestore();
    const userDoc = doc(db, `users/${userId}`);
    const profile = { ...existingUserProfile, ...updatedUserProfile };
    await updateDoc(userDoc, { profile });
    return profile;
  },
);

const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(fetchUserProfile.pending, ({ userProfile }) => ({
      loading: true,
      userProfile,
    }));
    builder.addCase(fetchUserProfile.fulfilled, (_, { payload }) => ({
      loading: false,
      userProfile: payload,
    }));
  },
});

export const selectUserProfileState = (state: RootState) => state.userProfileState;

export const userProfileReducer = userProfileSlice.reducer;
