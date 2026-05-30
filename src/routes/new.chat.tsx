import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { BrandMark, ChunkyButton, Frame, Icons, TOKENS } from "@/components/new-confetti/shell";
import { useNewAuth } from "@/hooks/useNewAuth";
import { supabase } from "@/integrations/supabase/client";
import { getSelectedCity } from "@/lib/cities";

// Slim port — design/new-confetti/project/extras.jsx (ChatScreen, line 589)
export const Route = createFileRoute("/new/chat")({
  component: ChatPage,
});

interface Msg {
  who: "you" | "confetti";
  text: string;
}

function ChatPage() {
  const { ready, user } = useNewAuth();
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState<Msg[]>([
    { who: "confetti", text: "hey! tell me a vibe and i'll build your night." },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [msgs]);

  async function send() {
    const t = input.trim();
    if (!t || streaming) return;
    setInput("");

    const userMsg: Msg = { who: "you", text: t };
    const nextMsgs = [...msgs, userMsg];
    setMsgs(nextMsgs);
    setStreaming(true);

    try {
      // Get auth token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMsgs((m) => [...m, { who: "confetti", text: "session expired — sign in again." }]);
        setStreaming(false);
        return;
      }

      // Resolve city
      const selectedCity = getSelectedCity();
      const city = selectedCity
        ? { slug: selectedCity.slug, name: selectedCity.name, region: selectedCity.region }
        : null;

      // Build chat messages for the API
      const apiMessages = nextMsgs.map((m) => ({
        role: m.who === "you" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }));

      // Call /api/chat with streaming
      const controller = new AbortController();
      abortRef.current = controller;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          messages: apiMessages,
          city,
          now: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Chat failed (${res.status})`);
      }

      // Stream the response
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let accumulated = "";

      // Add placeholder message for streaming
      setMsgs((m) => [...m, { who: "confetti", text: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;

        // Update the last confetti message with accumulated text
        setMsgs((m) => {
          const updated = [...m];
          updated[updated.length - 1] = { who: "confetti", text: accumulated };
          return updated;
        });
      }

      // If the response mentions "printing" or "pass" or plan is ready, navigate
      const lower = accumulated.toLowerCase();
      if (lower.includes("printing your pass") || lower.includes("here's your plan")) {
        setTimeout(() => navigate({ to: "/new/printing" }), 1200);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        setMsgs((m) => [
          ...m,
          { who: "confetti", text: `something went wrong — ${err.message ?? "try again"}` },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  if (!ready) {
    return (
      <Frame>
        <div
          style={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: TOKENS.bg,
            fontFamily: TOKENS.display,
            fontSize: 24,
            fontWeight: 900,
            color: TOKENS.inkMuted,
          }}
        >
          loading...
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      <div
        style={{
          position: "relative",
          height: "100%",
          background: TOKENS.bg,
          display: "flex",
          flexDirection: "column",
          padding: "56px 18px 18px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <button onClick={() => navigate({ to: "/new/hub" })} style={backBtn()}>
            ←
          </button>
          <BrandMark size={17} />
          <span style={{ width: 36 }} />
        </div>

        <div
          ref={scrollRef}
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginRight: -18,
            paddingRight: 18,
            scrollbarWidth: "none",
          }}
        >
          {msgs.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.who === "you" ? "flex-end" : "flex-start",
                maxWidth: "80%",
                padding: "10px 14px",
                border: `2.5px solid ${TOKENS.ink}`,
                borderRadius: 18,
                background: m.who === "you" ? TOKENS.ink : TOKENS.paper,
                color: m.who === "you" ? TOKENS.paper : TOKENS.ink,
                boxShadow: `3px 3px 0 ${TOKENS.ink}`,
                fontFamily: TOKENS.ui,
                fontSize: 14,
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              {m.text}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, paddingTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="say a vibe…"
            style={{
              flex: 1,
              appearance: "none",
              padding: "14px 16px",
              border: `2.5px solid ${TOKENS.ink}`,
              borderRadius: 14,
              background: TOKENS.paper,
              outline: "none",
              fontFamily: TOKENS.ui,
              fontSize: 15,
              fontWeight: 700,
              color: TOKENS.ink,
              boxShadow: `3px 3px 0 ${TOKENS.ink}`,
            }}
          />
          <ChunkyButton
            variant="accent"
            onClick={send}
            full={false}
            icon={Icons.arrow}
            disabled={streaming}
          >
            {streaming ? "…" : "send"}
          </ChunkyButton>
        </div>
      </div>
    </Frame>
  );
}

function backBtn(): React.CSSProperties {
  return {
    appearance: "none",
    cursor: "pointer",
    width: 36,
    height: 36,
    borderRadius: 999,
    border: `2.5px solid ${TOKENS.ink}`,
    background: TOKENS.paper,
    fontSize: 14,
    fontWeight: 900,
    boxShadow: `3px 3px 0 ${TOKENS.ink}`,
  };
}
