"use client";

import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  // Strip JSON code blocks from assistant messages (profile data is shown in the confirmation card)
  const displayContent = !isUser
    ? message.content.replace(/```json[\s\S]*?```/g, "").trim()
    : message.content;

  if (!isUser && !displayContent) return null;

  return (
    <div
      className={cn("flex gap-3 px-4 py-3", isUser ? "justify-end" : "")}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
          <Bot className="h-4 w-4 text-emerald-600" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-white border border-gray-200 text-gray-700"
        )}
      >
        <p className="whitespace-pre-wrap">{displayContent}</p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}
