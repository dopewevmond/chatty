import { ObjectId } from "mongodb";

export type HandleNewMessageType = {
  type: "send" | "receive";
  senderDisplayName: string;
  senderUserName: string;
  recipientDisplayName: string;
  recipientUserName: string;
  senderId: string;
  recipientId: string;
  message: string;
  timestamp: string;
};

export type TokenPayloadType = {
  id: string;
  username: string;
  displayName: string;
};

export type UserType = {
  _id: ObjectId;
  username: string;
  displayName: string;
  createdAt: string;
};
