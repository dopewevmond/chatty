import {
  createAsyncThunk,
  createSlice,
  isAnyOf,
  PayloadAction,
} from "@reduxjs/toolkit";
import axios from "axios";
import { HandleNewMessageType } from "@/lib/types";

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

type RecentsType = {
  [otherUserId: string]: {
    otherUserDisplayName: string;
    otherUserUserName: string;
    message: string;
    senderId: string;
    recipientId: string;
    timestamp: string;
  };
};

type ChatSlice = {
  error: string | null;
  isOnline: boolean;
  chats: Chat;
  open: {
    _id: string;
    username: string;
    displayName: string;
  } | null;
  isLoadingSearch: boolean;
  isLoadingChats: boolean;
  searchResults:
    | {
        _id: string;
        username: string;
        displayName: string;
      }[]
    | null;
  recents: RecentsType;
};

const initialState: ChatSlice = {
  error: null,
  isOnline: false,
  chats: {},
  open: null,
  isLoadingSearch: false,
  isLoadingChats: true,
  searchResults: null,
  recents: {},
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    connectSocketSuccessfully: (state) => {
      state.error = null;
      state.isOnline = true;
    },
    connectError: (state, { payload }: PayloadAction<string>) => {
      state.error = payload;
      state.isOnline = false;
    },
    removeSocket: (state) => {
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
    handleNewMessage: (
      state,
      { payload }: PayloadAction<HandleNewMessageType>
    ) => {
      const {
        senderDisplayName,
        senderUserName,
        recipientDisplayName,
        recipientUserName,
        recipientId,
        senderId,
        ...messageDetails
      } = payload;

      const otherUserId = payload.type === "send" ? recipientId : senderId;

      state.recents[otherUserId] = {
        ...messageDetails,
        recipientId,
        otherUserDisplayName:
          payload.type === "send" ? recipientDisplayName : senderDisplayName,
        otherUserUserName:
          payload.type === "send" ? recipientUserName : recipientUserName,
        senderId,
      };

      if (state.chats.hasOwnProperty(otherUserId)) {
        state.chats[otherUserId].messages.push({
          ...messageDetails,
          recipientId,
          senderId,
        });
      } else {
        state.chats[otherUserId] = {
          details: {
            _id: otherUserId,
            displayName:
              payload.type === "send"
                ? recipientDisplayName
                : senderDisplayName,
            username:
              payload.type === "send" ? recipientUserName : senderUserName,
          },
          messages: [{ ...messageDetails, recipientId, senderId }],
        };
      }
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
      .addCase(searchUser.fulfilled, (state, { payload }) => {
        state.isLoadingSearch = false;
        state.searchResults = [...payload];
      })
      .addMatcher(
        isAnyOf(getRecentChats.pending, getChatsWhileOffline.pending),
        (state) => {
          state.isLoadingChats = true;
        }
      )
      .addMatcher(
        isAnyOf(getRecentChats.rejected, getChatsWhileOffline.rejected),
        (state) => {
          state.isLoadingChats = false;
        }
      )
      .addMatcher(
        isAnyOf(getRecentChats.fulfilled, getChatsWhileOffline.fulfilled),
        (state, { payload }) => {
          state.isLoadingChats = false;
          payload.forEach((chat) => {
            state.recents[chat.otherUserDetails._id] = {
              ...chat.messages[0],
              otherUserDisplayName: chat.otherUserDetails.displayName,
              otherUserUserName: chat.otherUserDetails.username,
            };

            if (state.chats.hasOwnProperty(chat.otherUserDetails._id)) {
              state.chats[chat.otherUserDetails._id].messages.push(
                ...chat.messages.reverse()
              );
            } else {
              state.chats[chat.otherUserDetails._id] = {
                details: {
                  ...chat.otherUserDetails,
                },
                messages: [...chat.messages].reverse(),
              };
            }
          });
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

type GetRecentChatsType = {
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
}[];

export const getRecentChats = createAsyncThunk(
  `${chatSlice.name}/get-recent-messages`,
  async () => {
    const { data } = await axios.get<GetRecentChatsType>("/api/chat");
    return data;
  }
);

type GetOfflineChatRequestQueryType = {
  timestamp: string;
};
export const getChatsWhileOffline = createAsyncThunk(
  `${chatSlice.name}/get-offline-messages`,
  async (payload: GetOfflineChatRequestQueryType) => {
    const params = new URLSearchParams();
    params.set("timestamp", payload.timestamp);
    const { data } = await axios.get<GetRecentChatsType>(
      `/api/chat/offline?${params.toString()}`
    );
    return data;
  }
);

export const {
  connectSocketSuccessfully,
  removeSocket,
  connectError,
  openChat,
  closeChat,
  closeSearch,
  handleNewMessage,
} = chatSlice.actions;

export default chatSlice.reducer;
