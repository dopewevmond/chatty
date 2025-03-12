import { NextResponse } from "next/server";
import { connectToDB } from "@/db";
import { createUser, findUserByUsername } from "@/db/User";
import { cookies } from "next/headers";
import {
  uniqueNamesGenerator,
  animals,
  adjectives,
} from "unique-names-generator";
import * as jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { TokenPayloadType } from "@/lib/types";

declare global {
  // eslint-disable-next-line no-var
  var io: Server | undefined;
}

export async function POST() {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (tokenValue != null) {
      try {
        const payload = jwt.verify(tokenValue, process.env.SECRET_KEY!) as jwt.JwtPayload & TokenPayloadType;
        return Response.json({
          id: payload.id,
          username: payload.username,
          displayName: payload.displayName
        });
      } catch (e) {
        console.log(e);
      }
    }

    const username = cookieStore.get("username")?.value;
    const { db } = await connectToDB();

    let user = await findUserByUsername(db, username ?? "");
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
      user = await findUserByUsername(db, generatedUserName);
    }

    if (user == null) throw new Error("An error occurred while logging you in");

    const tokenPayload = {
      id: user?._id.toString(),
      username: user?.username,
      displayName: user?.displayName,
    } as TokenPayloadType;

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

    return Response.json(user);
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
