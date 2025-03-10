import { NextResponse } from "next/server";
import { connectToDB } from "@/db";
import { createUser, findUser } from "@/db/User";
import { cookies } from "next/headers";
import {
  uniqueNamesGenerator,
  animals,
  adjectives,
} from "unique-names-generator";
import * as jwt from "jsonwebtoken";
import { Server } from "socket.io";

declare global {
  // eslint-disable-next-line no-var
  var io: Server | undefined
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (!global.io) {
      console.log("socket not initialized");
    } else {
      console.log("socket accessible!")
    }

    if (tokenValue != null) {
      try {
        const payload = jwt.verify(tokenValue, process.env.SECRET_KEY!) as {
          id: string;
          username: string;
        };
        return Response.json({
          id: payload.id,
          username: payload.username,
        });
      } catch (e) {
        console.log(e);
      }
    }

    const username = cookieStore.get("username")?.value;
    const { db } = await connectToDB();

    let user = await findUser(db, username ?? "");
    if (user == null) {
      const generatedUserName = uniqueNamesGenerator({
        dictionaries: [adjectives, animals],
        length: 2,
        separator: "_",
      });
      await createUser(
        db,
        generatedUserName,
        generatedUserName.replace("_", " ")
      );
      user = await findUser(db, generatedUserName);
    }

    const tokenPayload = { id: user?._id.toString(), username: user?.username };

    const expires = Date.now() + Number(3600 * 24 * 7) * 1000;

    const token = jwt.sign(tokenPayload, process.env.SECRET_KEY!, {
      expiresIn: "7d",
    });

    (await cookies()).set({
      name: "username",
      value: user?.username,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires,
    });

    (await cookies()).set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires,
    });

    return Response.json({});
  } catch (e) {
    if (process.env.NODE_ENV === "development") console.log(e);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create anonymous session",
      },
      { status: 500 }
    );
  }
}
