import { NextResponse } from 'next/server'
import { connectToDB } from '@/db'
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken'
import { searchUserByUsernameDisplayNameOrId } from '@/db/User';

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const tokenValue = cookieStore.get("token")?.value;

    if (tokenValue == null) throw new Error("Authentication error")
    const { id } = jwt.verify(tokenValue, process.env.SECRET_KEY!) as jwt.JwtPayload & { id: string; }

    const { query } = await req.json()
    const { db } = await connectToDB();
    const results = await searchUserByUsernameDisplayNameOrId(db, query, id);
    return NextResponse.json(results)
  } catch (error) {
    console.error('[SEARCH_ERROR]', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}