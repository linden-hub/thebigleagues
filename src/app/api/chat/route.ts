import { geminiModel, geminiModelFallback } from "@/lib/gemini";
import { ONBOARDING_SYSTEM_PROMPT } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

function isServiceUnavailable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("503") || msg.includes("Service Unavailable") || msg.includes("overloaded");
}

export async function POST(req: NextRequest) {
  try {
    // Verify auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages } = (await req.json()) as {
      messages: { role: string; content: string }[];
    };

    // Build chat history for Gemini
    // Put prior messages (minus the last one) into history
    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1];

    let result;
    try {
      const chat = geminiModel.startChat({
        history,
        systemInstruction: {
          role: "user",
          parts: [{ text: ONBOARDING_SYSTEM_PROMPT }],
        },
      });
      result = await chat.sendMessageStream(lastMessage.content);
    } catch (error) {
      if (isServiceUnavailable(error)) {
        console.warn("Primary model unavailable, falling back to gemini-2.5-flash");
        const chat = geminiModelFallback.startChat({
          history,
          systemInstruction: {
            role: "user",
            parts: [{ text: ONBOARDING_SYSTEM_PROMPT }],
          },
        });
        result = await chat.sendMessageStream(lastMessage.content);
      } else {
        throw error;
      }
    }

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
        } catch (streamError) {
          console.error("Stream error:", streamError);
          const errMsg = streamError instanceof Error ? streamError.message : "Stream failed";
          controller.enqueue(encoder.encode(`\n\n[Error: ${errMsg}]`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
