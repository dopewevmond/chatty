"use client"
import React from "react";
import { store } from "@/redux/store";
import { Provider } from "react-redux";
import ChattyApp from "@/components/chat-interface";

const StoreProvider = () => {
  return (
    <Provider store={store}>
      <ChattyApp />
    </Provider>
  );
};

export default StoreProvider;
