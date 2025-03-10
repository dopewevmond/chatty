import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { Socket } from "socket.io-client";
import { RootStateType } from "./store";
import axios from "axios";

type Chat = {
  [recipientUserId: string]: {
    details: {
      _id: string;
      username: string;
      displayName: string;
    };
    messages: {
      message: string;
      senderId: string;
      recipientId: string;
      timestamp: string;
    }[];
  };
};

type ChatSlice = {
  initializedSocket: boolean;
  socket: Socket | null;
  error: string | null;
  isOnline: boolean;
  chats: Chat;
  open: {
    _id: string;
    username: string;
    displayName: string;
  } | null;
  isLoadingSearch: boolean;
  searchResults:
    | {
        _id: string;
        username: string;
        displayName: string;
      }[]
    | null;
  recents: Map<
    string,
    {
      message: string;
      senderId: string;
      recipientId: string;
      timestamp: string;
    }
  >;
};

const initialState: ChatSlice = {
  initializedSocket: false,
  socket: null,
  error: null,
  isOnline: false,
  chats: {},
  open: null,
  isLoadingSearch: false,
  searchResults: null,
  recents: new Map(),
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    connectSocketSuccessfully: (state) => {
      state.error = null;
      state.isOnline = true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    initializeSocket: (state, { payload }: PayloadAction<any>) => {
      state.socket = payload;
      state.initializedSocket = true;
    },
    connectError: (state, { payload }: PayloadAction<string>) => {
      state.error = payload;
      state.isOnline = false;
    },
    removeSocket: (state) => {
      state.socket = null;
      state.initializedSocket = false;
      state.isOnline = false;
    },
    openChat: (
      state,
      {
        payload,
      }: PayloadAction<{ _id: string; username: string; displayName: string }>
    ) => {
      state.open = { ...payload };
    },
    closeChat: (state) => {
      state.open = null;
    },
    closeSearch: (state) => {
      state.searchResults = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(searchUser.pending, (state) => {
        state.isLoadingSearch = true;
      })
      .addCase(searchUser.rejected, (state) => {
        state.isLoadingSearch = false;
      })
      .addCase(
        searchUser.fulfilled,
        (
          state,
          {
            payload,
          }: PayloadAction<
            {
              _id: string;
              username: string;
              displayName: string;
            }[]
          >
        ) => {
          state.isLoadingSearch = false;
          state.searchResults = [...payload];
        }
      );
  },
});

export const searchUser = createAsyncThunk(
  `${chatSlice.name}/search-user`,
  async (query: string) => {
    const { data } = await axios.post("/api/user/search", { query });
    return data;
  }
);

export const {
  connectSocketSuccessfully,
  initializeSocket,
  removeSocket,
  connectError,
  openChat,
  closeChat,
  closeSearch,
} = chatSlice.actions;

export const selectSocket = (state: RootStateType) => state.chat.socket;

export default chatSlice.reducer;
