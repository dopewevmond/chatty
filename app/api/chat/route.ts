import { NextResponse } from "next/server";
import { connectToDB } from "@/db";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import {
  getRecentChatsGroupedByUser,
  saveMessage,
} from "@/db/Message";

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
    console.log(messages);
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
    const { id } = jwt.verify(
      tokenValue,
      process.env.SECRET_KEY!
    ) as jwt.JwtPayload & { id: string };

    const { recipientId, message } = await req.json();
    const { db } = await connectToDB();
    const response = await saveMessage(db, id, recipientId, message);
    // emit socket event here
    return NextResponse.json(response);
  } catch (error) {
    console.error("[error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
