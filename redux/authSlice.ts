import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

type AuthSlice = {
  id: string | null;
  username: string | null;
  isLoggedIn: boolean;
  errorMessage: string | null;
};

const initialState: AuthSlice = {
  id: null,
  username: null,
  isLoggedIn: false,
  errorMessage: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(
        anonymousLogin.fulfilled,
        (
          state,
          { payload }: PayloadAction<{ id: string; username: string }>
        ) => {
          state.id = payload.id;
          state.username = payload.username;
          state.isLoggedIn = true;
        }
      )
      .addCase(anonymousLogin.rejected, (state) => {
        state.id = null;
        state.isLoggedIn = false;
        state.username = null;
        state.errorMessage = "An error occurred while logging in";
      });
  },
});

export const anonymousLogin = createAsyncThunk(
  `${authSlice.name}/anonymous-login`,
  async () => {
    const { data } = await axios.post("/api/anonymous-login");
    return data;
  }
);

export default authSlice.reducer;
