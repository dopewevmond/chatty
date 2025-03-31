import { NextResponse } from "next/server";
import { connectToDB } from "@/db";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { getRecentChatsGroupedByUser, saveMessage } from "@/db/Message";
import { HandleNewMessageType, TokenPayloadType } from "@/lib/types";
import { findUserById } from "@/db/User";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (tokenValue == null) throw new Error("Authentication error");

    const { id } = jwt.verify(
      tokenValue,
      process.env.SECRET_KEY!
    ) as jwt.JwtPayload & { id: string };

    const { db } = await connectToDB();
    const messages = await getRecentChatsGroupedByUser(db, id);
    return Response.json(messages);
  } catch (e) {
    console.error("[error]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (tokenValue == null) throw new Error("Authentication error");
    const {
      id: senderId,
      displayName: senderDisplayName,
      username: senderUserName,
    } = jwt.verify(tokenValue, process.env.SECRET_KEY!) as jwt.JwtPayload &
      TokenPayloadType;

    const { recipientId, message } = await req.json();

    const { db } = await connectToDB();

    await saveMessage(db, senderId, recipientId, message);

    const recipientDetails = await findUserById(db, recipientId);
    if (recipientDetails == null)
      throw new Error("Unable to deliver message as recipient does not exist");

    const { displayName: recipientDisplayName, username: recipientUserName } =
      recipientDetails;

    const socketPayload: HandleNewMessageType = {
      type: "receive",
      message,
      timestamp: new Date().toISOString(),
      senderId,
      senderUserName,
      senderDisplayName,
      recipientId,
      recipientDisplayName,
      recipientUserName,
    };

    if (global.io) {
      global.io.to(recipientId).emit("receiveMessage", socketPayload);
    }

    return NextResponse.json(socketPayload, { status: 201 });
  } catch (error) {
    console.error("[error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
