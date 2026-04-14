"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ChatMessage } from "./ChatMessage";
import { Button } from "@/components/ui/Button";
import { extractJsonFromMessage } from "@/lib/utils";
import { Send, Loader2, Check, RotateCcw, SkipForward } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/types";

export function ChatWindow() {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const hasInitialized = useRef(false);

  // Persist a single message to Supabase (fire-and-forget)
  function persistMessage(role: "user" | "assistant", content: string) {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from("onboarding_messages").insert({
        user_id: user.id,
        role,
        content,
      }).then(({ error }) => {
        if (error) console.error("Failed to persist message:", error);
      });
    });
  }

  // Load existing messages or start fresh
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    async function init() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from("onboarding_messages")
          .select("role, content")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (data && data.length > 0) {
          const restored = data as ChatMessageType[];
          setMessages(restored);

          // Re-extract profileData from the last assistant message
          const lastAssistant = [...restored].reverse().find(m => m.role === "assistant");
          if (lastAssistant) {
            const extracted = extractJsonFromMessage(lastAssistant.content);
            if (extracted && extracted.cooking_skill) {
              setProfileData(extracted);
            }
          }

          setIsInitializing(false);
          return;
        }
      }

      // No existing messages — start fresh
      setIsInitializing(false);
      sendMessage("Hi! I'm ready to set up my meal prep profile.", true);
    }

    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Refocus input after streaming completes
  useEffect(() => {
    if (!isStreaming && !isInitializing && !profileData) {
      inputRef.current?.focus();
    }
  }, [isStreaming, isInitializing, profileData]);

  async function sendMessage(text: string, isInitial = false) {
    const userMessage: ChatMessageType = { role: "user", content: text };
    const newMessages = isInitial ? [userMessage] : [...messages, userMessage];

    if (!isInitial) {
      setMessages((prev) => [...prev, userMessage]);
    } else {
      setMessages([userMessage]);
    }
    setInput("");
    setIsStreaming(true);

    // Persist user message
    persistMessage("user", text);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: AbortSignal.timeout(60_000),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Chat failed (${response.status}): ${errBody}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      // Add empty assistant message for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = {
              role: "assistant",
              content: assistantContent,
            };
            return updated;
          });
        }
      }

      // Persist completed assistant message
      persistMessage("assistant", assistantContent);

      // Check if the response contains a JSON profile
      const extracted = extractJsonFromMessage(assistantContent);
      if (extracted && extracted.cooking_skill) {
        setProfileData(extracted);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errMsg = error instanceof Error ? error.message : "Unknown error";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, something went wrong: ${errMsg}`,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSaveProfile() {
    if (!profileData) return;
    setIsSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          dietary_restrictions: profileData.dietary_restrictions || [],
          cuisine_preferences: profileData.cuisine_preferences || [],
          cooking_skill: profileData.cooking_skill || "beginner",
          household_size: profileData.household_size || 1,
          weekly_budget: profileData.weekly_budget || 100,
          available_equipment: profileData.available_equipment || [],
          max_prep_time: profileData.max_prep_time || 60,
          location: profileData.location || null,
          preferred_stores: profileData.preferred_stores || [],
          additional_notes: profileData.additional_notes || null,
          onboarding_complete: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Clean up onboarding messages
      await supabase
        .from("onboarding_messages")
        .delete()
        .eq("user_id", user.id);

      // Trigger initial recipe generation in the background
      fetch("/api/recipes/generate", { method: "POST" }).catch(() => {});

      router.push("/app");
      router.refresh();
    } catch (error) {
      console.error("Save profile error:", error);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSkip() {
    setIsSkipping(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ onboarding_complete: true })
        .eq("id", user.id);

      if (error) throw error;

      await supabase
        .from("onboarding_messages")
        .delete()
        .eq("user_id", user.id);

      fetch("/api/recipes/generate", { method: "POST" }).catch(() => {});

      router.push("/app");
      router.refresh();
    } catch (error) {
      console.error("Skip onboarding error:", error);
      setIsSkipping(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input.trim());
  }

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-2xl mx-auto">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {messages
          .filter((m) => !(m.role === "user" && messages.indexOf(m) === 0))
          .filter((m) => !(m.role === "assistant" && m.content === ""))
          .map((message, idx) => (
            <ChatMessage key={idx} message={message} />
          ))}

        {isStreaming && (messages[messages.length - 1]?.role === "user" || messages[messages.length - 1]?.content === "") && (
          <div className="flex gap-3 px-4 py-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-emerald-600 animate-spin" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.1s]" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Profile confirmation */}
      {profileData && (
        <div className="mx-4 mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <p className="text-sm font-medium text-emerald-800 mb-3">
            Your profile is ready! Does this look right?
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs text-emerald-700 mb-4">
            {"cooking_skill" in profileData && (
              <div>
                <span className="font-medium">Skill:</span>{" "}
                {String(profileData.cooking_skill)}
              </div>
            )}
            {"household_size" in profileData && (
              <div>
                <span className="font-medium">Household:</span>{" "}
                {String(profileData.household_size)}
              </div>
            )}
            {"weekly_budget" in profileData && (
              <div>
                <span className="font-medium">Budget:</span> $
                {String(profileData.weekly_budget)}/week
              </div>
            )}
            {"max_prep_time" in profileData && (
              <div>
                <span className="font-medium">Max prep:</span>{" "}
                {String(profileData.max_prep_time)} min
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveProfile} loading={isSaving} size="sm">
              <Check className="h-4 w-4 mr-1" />
              Looks good!
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setProfileData(null);
                sendMessage(
                  "I'd like to adjust some things about my profile."
                );
              }}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Let me adjust
            </Button>
          </div>
        </div>
      )}

      {/* Input */}
      {!profileData && (
        <div className="border-t border-gray-200 bg-white">
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 p-4 pb-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your response..."
              className="flex-1 rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              disabled={isStreaming}
            />
            <Button type="submit" disabled={!input.trim() || isStreaming}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="flex justify-end px-4 pb-3">
            <button
              type="button"
              onClick={handleSkip}
              disabled={isSkipping}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            >
              {isSkipping ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <SkipForward className="h-3.5 w-3.5" />
              )}
              Skip this step
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
