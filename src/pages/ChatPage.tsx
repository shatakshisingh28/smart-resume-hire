import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Send, Loader2, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("chat-candidates", {
        body: { messages: allMessages },
      });
      if (error) throw error;
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Brain className="w-6 h-6 text-accent" />
          AI Recruiter Chat
        </h1>
        <p className="text-muted-foreground">Ask questions about your candidates</p>
      </div>

      <Card className="flex-1 flex flex-col shadow-card border-border overflow-hidden">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Brain className="w-16 h-16 mx-auto mb-4 text-muted-foreground/20" />
                <p className="text-muted-foreground">Ask me about your candidates!</p>
                <div className="mt-3 space-y-1 text-sm text-primary">
                  <p>"Who is the best fit for the frontend role?"</p>
                  <p>"Compare the top 3 candidates"</p>
                  <p>"What skills are most candidates missing?"</p>
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="bg-muted rounded-xl px-4 py-3">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </CardContent>

        <div className="p-4 border-t border-border">
          <div className="flex gap-2">
            <Input
              placeholder="Ask about candidates..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <Button onClick={send} disabled={loading || !input.trim()} className="gradient-primary text-primary-foreground">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
