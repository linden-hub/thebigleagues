import { geminiModel } from "@/lib/gemini";
import { ONBOARDING_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  // Verify auth
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = (await req.json()) as {
    messages: { role: string; content: string }[];
  };

  // Build chat history for Gemini
  const chat = geminiModel.startChat({
    history: [
      {
        role: "user",
        parts: [{ text: "Start the onboarding conversation." }],
      },
      {
        role: "model",
        parts: [{ text: ONBOARDING_SYSTEM_PROMPT }],
      },
      ...messages.slice(0, -1).map((msg) => ({
        role: msg.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: msg.content }],
      })),
    ],
    systemInstruction: ONBOARDING_SYSTEM_PROMPT,
  });

  const lastMessage = messages[messages.length - 1];
  const result = await chat.sendMessageStream(lastMessage.content);

  // Stream the response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
