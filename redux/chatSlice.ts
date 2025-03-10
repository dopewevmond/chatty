import {
  createAsyncThunk,
  createSlice,
  isAnyOf,
  PayloadAction,
} from "@reduxjs/toolkit";
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
  isSendingMessage: boolean;
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
      otherUserDisplayName: string;
      otherUserUserName: string;
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
  isSendingMessage: false,
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
      .addCase(sendMessage.pending, (state) => {
        state.isSendingMessage = true;
      })
      .addCase(searchUser.rejected, (state) => {
        state.isLoadingSearch = false;
      })
      .addCase(sendMessage.rejected, (state) => {
        state.isSendingMessage = false;
      })
      .addCase(searchUser.fulfilled, (state, { payload }) => {
        state.isLoadingSearch = false;
        state.searchResults = [...payload];
      })
      .addCase(sendMessage.fulfilled, (state, { payload }) => {
        state.isSendingMessage = false;
        // add optimistically
      })
      .addMatcher(
        isAnyOf(getRecentChats.fulfilled),
        (
          state,
          {
            payload,
          }: PayloadAction<
            {
              otherUserDetails: {
                _id: string;
                username: string;
                displayName: string;
              };
              messages: {
                _id: string;
                senderId: string;
                recipientId: string;
                message: string;
                timestamp: string;
              }[];
            }[]
          >
        ) => {
          for (let i = payload.length - 1; i >= 0; i--) {
            if (state.recents.has(payload[i].otherUserDetails._id)) {
              state.recents.delete(payload[i].otherUserDetails._id);
            }
            state.recents.set(payload[i].otherUserDetails._id, {
              ...payload[i].messages[0],
              otherUserDisplayName: payload[i].otherUserDetails.displayName,
              otherUserUserName: payload[i].otherUserDetails.username
            });

            if (state.chats.hasOwnProperty(payload[i].otherUserDetails._id)) {
              state.chats[payload[i].otherUserDetails._id].messages.concat(
                [...payload[i].messages].reverse()
              );
            } else {
              state.chats[payload[i].otherUserDetails._id] = {
                details: {
                  _id: payload[i].otherUserDetails._id,
                  username: payload[i].otherUserDetails.username,
                  displayName: payload[i].otherUserDetails.displayName,
                },
                messages: [...payload[i].messages].reverse(),
              };
            }
          }
        }
      );
  },
});

export const searchUser = createAsyncThunk(
  `${chatSlice.name}/search-user`,
  async (query: string) => {
    const { data } = await axios.post<
      {
        _id: string;
        username: string;
        displayName: string;
      }[]
    >("/api/user/search", { query });
    return data;
  }
);

type SendMessageType = {
  recipientId: string;
  message: string;
};

export const sendMessage = createAsyncThunk(
  `${chatSlice.name}/send-message`,
  async (payload: SendMessageType) => {
    const { data } = await axios.post("/api/chat", payload);
    return data;
  }
);

export const getRecentChats = createAsyncThunk(
  `${chatSlice.name}/get-recent-messages`,
  async () => {
    const { data } = await axios.get("/api/chat");
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
