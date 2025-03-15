import { AxiosError } from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import { connectToDB } from "@/db";
import * as jwt from 'jsonwebtoken'
import { getAIMessages } from "@/db/AIMessage";

const endpoint = "https://models.inference.ai.azure.com";
const modelName = "Phi-4";

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
    const messages = await getAIMessages(db, id);
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

    const { messages } = await req.json();

    const { question, user_answer, correct_answer, challenge_name } =
      await req.json();

    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(process.env.GITHUB_TOKEN!)
    );

    const response = await client
      .path("/chat/completions")
      .post({
        body: {
          messages: [
            {
              role: "system",
              content: `You're a helpful tutor for ${challenge_name}. A user has submitted an answer (which seems to be incorrect) to a question and needs you to explain why it's not correct, and why the correct answer is.`,
            },
            {
              role: "user",
              content: `${question}. I selected ${user_answer} but the correct answer seems to be ${correct_answer}. Can you tell me why?`,
            },
          ],
          model: modelName,
          stream: true,
        },
      })
      .asNodeStream();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (isUnexpected(response as any)) {
      throw new AxiosError(
        "An unexpected error occurred while fetching the response",
        "500"
      );
    }

    const stream = response.body as unknown as ReadableStream<
      Uint8Array<ArrayBufferLike>
    >;
    if (!stream) {
      throw new Error("The response stream is undefined");
    }

    const sseStream = createSseStream(stream);

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const event of sseStream) {
          if (event.data === "[DONE]") {
            break;
          }

          const parsedData = JSON.parse(event.data);
          for (const choice of parsedData.choices) {
            const text = choice.delta?.content ?? "";
            controller.enqueue(text);
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("[error]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
