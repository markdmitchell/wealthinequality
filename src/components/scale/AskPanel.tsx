import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { Orbit, RotateCcw, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";

const STORAGE_KEY = "wealth-scale-ask";
const SUGGESTIONS = [
  "How many median households fit in the richest person?",
  "Why does the Sun look only ~100× wider than Earth?",
  "Where would $1 billion sit on this scale?",
];

function loadMessages(): UIMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(parsed) ? (parsed as UIMessage[]) : [];
  } catch {
    return [];
  }
}

export function AskPanel({ onClose }: { onClose: () => void }) {
  // Panel is only mounted client-side (route has ssr: false), so reading storage here is safe.
  const initial = useMemo(() => loadMessages(), []);
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { messages, sendMessage, status, stop, error, setMessages } = useChat({
    id: "wealth-scale-ask",
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/ask" }),
  });
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (status === "ready" || status === "error") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
      } catch {
        /* storage full or blocked */
      }
    }
  }, [messages, status]);

  useEffect(() => {
    if (!busy) textareaRef.current?.focus();
  }, [busy]);

  const ask = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed || busy) return;
    void sendMessage({ text: trimmed });
    setText("");
  };

  const reset = () => {
    setMessages([]);
    window.localStorage.removeItem(STORAGE_KEY);
    textareaRef.current?.focus();
  };

  return (
    <section
      aria-label="Ask about the numbers"
      className="flex h-full flex-col rounded-2xl border border-border bg-surface/95 backdrop-blur-xl"
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex size-8 items-center justify-center rounded-full border border-border text-primary">
            <Orbit className="size-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-bold text-foreground">Ask the scale</h2>
            <p className="text-[0.68rem] text-muted-foreground">AI-powered · uses this page's figures</p>
          </div>
        </div>
        <div className="flex gap-1">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={reset}
              aria-label="New conversation"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
              <RotateCcw className="size-4" aria-hidden />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </header>

      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 px-4 py-4">
          {messages.length === 0 ? (
            <ConversationEmptyState>
              <div className="mt-2 flex w-full flex-col gap-2">
                <p className="text-sm font-semibold text-foreground">Ask about any comparison</p>
                <p className="text-xs text-muted-foreground">
                  Answers use the figures and volume scale in this visualization.
                </p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-xl border border-border px-3 py-2 text-left text-xs text-foreground transition-colors hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent
                  className={
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-foreground"
                  }
                >
                  {m.parts.map((p, i) =>
                    p.type === "text" ? (
                      m.role === "assistant" ? (
                        <MessageResponse key={i}>{p.text}</MessageResponse>
                      ) : (
                        <p key={i} className="whitespace-pre-wrap text-sm">
                          {p.text}
                        </p>
                      )
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Shimmer className="text-sm">Working out the scale…</Shimmer>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error.message || "Something went wrong. Please try again."}
            </p>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput onSubmit={({ text: t }) => ask(t)}>
          <PromptInputTextarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. How many homes equal all US billionaires?"
            autoFocus
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={status}
              disabled={!busy && !text.trim()}
              onStop={stop}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
