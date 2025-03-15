import {
  connectError,
  connectSocketSuccessfully,
  getAIMessages,
  getChatsWhileOffline,
  getRecentChats,
  handleNewMessage,
} from "@/redux/chatSlice";
import { useAppDispatch, useAppSelector } from "@/redux/store";
import { useEffect, useRef } from "react";
import { HandleNewMessageType } from "./types";
import { socket } from "./socket-client";

export default function useSocket(enabled: boolean) {
  const dispatch = useAppDispatch();
  const recents = useAppSelector((state) => state.chat.recents);
  const recentsRef = useRef(recents);

  useEffect(() => {
    recentsRef.current = recents;
  }, [recents]);

  useEffect(() => {
    if (!enabled) return;

    console.log("Socket should start connecting now...");
    socket.connect();

    socket.on("connect", () => {
      dispatch(connectSocketSuccessfully());

      const recentEntries = Object.entries(recentsRef.current).toSorted(
        (a, b) =>
          new Date(b[1].timestamp).getTime() -
          new Date(a[1].timestamp).getTime()
      );

      if (recentEntries?.length === 0) {
        dispatch(getRecentChats());
        dispatch(getAIMessages());
      } else {
        dispatch(
          getChatsWhileOffline({ timestamp: recentEntries[0][1].timestamp })
        );
      }
    });

    socket.io.on("reconnect", () => {
      console.log("Reconnected");
    });

    socket.on("connect_error", (err) => {
      dispatch(connectError(err.message));
    });

    socket.on("disconnect", () => {
      dispatch(connectError("Socket disconnected"));
    });

    socket.on("receiveMessage", (payload: HandleNewMessageType) => {
      dispatch(handleNewMessage(payload));
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [dispatch, enabled]);
}
