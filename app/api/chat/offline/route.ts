import { NextResponse } from "next/server";
import { connectToDB } from "@/db";
import { cookies } from "next/headers";
import * as jwt from "jsonwebtoken";
import { getChatsAfterTimestamp } from "@/db/Message";

export async function GET(req: Request) {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;
    if (tokenValue == null) throw new Error("Authentication error");
    
    const { id } = jwt.verify(
      tokenValue,
      process.env.SECRET_KEY!
    ) as jwt.JwtPayload & { id: string };

    const { searchParams } = new URL(req.url);
    const timestamp = searchParams.get("timestamp");

    if (timestamp == null) throw new Error("Authentication error");

    const { db } = await connectToDB();
    const messages = await getChatsAfterTimestamp(db, id, timestamp);
    return Response.json(messages);
  } catch (e) {
    console.error("[error]", e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}