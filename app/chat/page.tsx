"use client";

import { BackgroundBeams } from "@/components/ui/background-beams";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Bot, User } from "lucide-react";
import { Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: number;
  role: "user" | "bot";
  content: string;
  similar_chunks?: {
    text: string;
    similarity: number;
  }[];
}

interface AnswerResponse {
  question: string;
  answer: string;
  similar_chunks: {
    text: string;
    similarity: number;
  }[];
}

function Citation({ chunk, index }: { chunk: { text: string; similarity: number }; index: number }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 hover:bg-violet-200 text-violet-600 text-xs font-medium mx-1 transition-colors">
            {index + 1}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="w-96 h-72 bg-white border border-zinc-200 shadow-lg">
          <div className="max-h-full overflow-y-auto custom-scrollbar">
            <div className="p-2 space-y-2">
              <div className="flex justify-between items-center sticky top-0 bg-white border-b border-zinc-100 pb-2">
                <span className="text-xs font-medium text-zinc-900">Source {index + 1}</span>
                <span className="text-xs text-zinc-500">Similarity: {(chunk.similarity * 100).toFixed(1)}%</span>
              </div>
              <p className="text-sm text-zinc-700 whitespace-pre-wrap">{chunk.text}</p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MessageContent({
  content,
  similar_chunks,
}: {
  content: string;
  similar_chunks?: { text: string; similarity: number }[];
}) {
  const paragraphs = content.split("\n\n");

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, index) => (
        <div key={index} className="flex items-start">
          <ReactMarkdown className="text-base leading-relaxed prose">{paragraph}</ReactMarkdown>
          {similar_chunks && similar_chunks[index] && <Citation chunk={similar_chunks[index]} index={index} />}
        </div>
      ))}
    </div>
  );
}

export default function ChatBot() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatBotContent />
    </Suspense>
  );
}

function ChatBotContent() {
  const backendUrl = "http://localhost:8001";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendUserMessage = async (message: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), role: "user", content: message }]);

    try {
      setIsLoading(true);
      const response = await axios.post<AnswerResponse>(
        `${backendUrl}/answer`,
        {
          question: message,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "bot",
          content: response.data.answer,
          similar_chunks: response.data.similar_chunks,
        },
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          role: "bot",
          content: "Sorry, there was an error processing your message.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendUserMessage(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-screen bg-white text-zinc-900">
      <ScrollArea className="z-10 h-screen flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-4xl bg-gradient-to-r p-2 rounded-xl mx-auto space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn("flex items-start space-x-2 mb-4", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role !== "user" && (
                <div className="w-8 h-8 rounded-full border border-zinc-200 text-zinc-800 flex items-center justify-center">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 border backdrop-blur-sm",
                  m.role === "user"
                    ? "border-violet-100 bg-gradient-to-br from-violet-50 to-violet-100"
                    : "border-zinc-100 bg-gradient-to-br from-zinc-50 to-zinc-100"
                )}
              >
                {m.role === "bot" ? (
                  <MessageContent content={m.content} similar_chunks={m.similar_chunks} />
                ) : (
                  <ReactMarkdown className="text-base leading-relaxed prose">{m.content}</ReactMarkdown>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full border border-zinc-200 text-zinc-800 flex items-center justify-center">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start space-x-2 mb-4 justify-start">
              <div className="w-8 h-8 rounded-full border border-zinc-200 text-zinc-800 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="max-w-[80%] rounded-2xl px-4 py-2 border backdrop-blur-sm border-zinc-100 bg-gradient-to-br from-zinc-50 to-zinc-100">
                <div className="flex items-center space-x-2">
                  <p className="text-zinc-600">Checking if information is complete or not</p>
                  <div className="flex space-x-1">
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.2s]"></span>
                    <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.1s]"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="z-10 w-full">
        <form onSubmit={onSubmit} className="max-w-2xl mx-auto p-4 w-full">
          <div className="relative rounded-full overflow-hidden bg-zinc-50 border border-zinc-200 shadow-lg">
            <input
              className="input bg-transparent outline-none border-none pl-4 pr-8 py-3 w-full font-sans text-md text-zinc-900 placeholder-zinc-500"
              type="text"
              value={input}
              onChange={handleInputChange}
              placeholder="Type a message..."
            />
            <div className="absolute right-1 top-[0.2em]">
              <button
                type="submit"
                className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 group shadow-xl flex items-center justify-center relative overflow-hidden"
              >
                <svg
                  className="relative z-10"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 64 64"
                  height="35"
                  width="35"
                >
                  <path
                    fill-opacity="0.01"
                    fill="white"
                    d="M63.6689 29.0491L34.6198 63.6685L0.00043872 34.6194L29.0496 1.67708e-05L63.6689 29.0491Z"
                  ></path>
                  <path
                    stroke-linejoin="round"
                    stroke-linecap="round"
                    stroke-width="3.76603"
                    stroke="white"
                    d="M42.8496 18.7067L21.0628 44.6712"
                  ></path>
                  <path
                    stroke-linejoin="round"
                    stroke-linecap="round"
                    stroke-width="3.76603"
                    stroke="white"
                    d="M26.9329 20.0992L42.85 18.7067L44.2426 34.6238"
                  ></path>
                </svg>
                <div className="w-full h-full rotate-45 absolute left-[32%] top-[32%] bg-black group-hover:-left-[100%] group-hover:-top-[100%] duration-1000"></div>
                <div className="w-full h-full -rotate-45 absolute -left-[32%] -top-[32%] group-hover:left-[100%] group-hover:top-[100%] bg-black duration-1000"></div>
              </button>
            </div>
          </div>
        </form>
      </div>
      <BackgroundBeams />
    </div>
  );
}

// Add this CSS to your global.css file or create a style block in your layout
const styles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #e4e4e7 transparent;
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: #e4e4e7;
    border-radius: 3px;
  }
`;
