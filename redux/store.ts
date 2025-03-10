import { configureStore } from "@reduxjs/toolkit";
import chatSlice from "./chatSlice";
import authSlice from "./authSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { enableMapSet } from 'immer';

enableMapSet();

export const store = configureStore({
  reducer: {
    chat: chatSlice,
    auth: authSlice,
  },
});

export type RootStateType = ReturnType<typeof store.getState>;
export type AppDispatchType = typeof store.dispatch;

export const useAppDispatch: () => AppDispatchType = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootStateType> = useSelector;
