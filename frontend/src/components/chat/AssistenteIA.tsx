"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { apiClient } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  usedRAG?: boolean;
  dataSources?: string[];
  processingTimeMs?: number;
  intent?: string;
  isStreaming?: boolean;
}

interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
}

interface Suggestion {
  category: string;
  questions: string[];
}

interface ChatStatus {
  configured: boolean;
  ragEnabled: boolean;
  provider: string;
  message: string;
  streamingEnabled?: boolean;
}

// Configurações do contexto de histórico
const MAX_HISTORY_MESSAGES = 10; // Número máximo de mensagens no histórico
const CONTEXT_WINDOW_TOKENS = 4000; // Limite aproximado de tokens para contexto

export function AssistenteIA() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [status, setStatus] = useState<ChatStatus | null>(null);
  const [useStreaming, setUseStreaming] = useState(true); // Toggle para streaming
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Carregar sugestões e status ao abrir
  useEffect(() => {
    if (isOpen) {
      if (suggestions.length === 0) {
        loadSuggestions();
      }
      loadStatus();
    }
  }, [isOpen, suggestions.length]);

  const loadSuggestions = async () => {
    try {
      const response = await apiClient.get<{ suggestions?: Suggestion[] }>(
        "/Chat/suggestions"
      );
      if (response.data?.suggestions) {
        setSuggestions(response.data.suggestions);
      }
    } catch (error) {
      console.error("Erro ao carregar sugestões:", error);
    }
  };

  const loadStatus = async () => {
    try {
      const response = await apiClient.get<ChatStatus>("/Chat/status");
      if (response.data) {
        setStatus(response.data);
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    }
  };

  // Prepara o histórico de contexto para enviar ao backend
  const prepareHistoryContext = useCallback((): HistoryMessage[] => {
    // Pega as últimas N mensagens (alternando user/assistant)
    const recentMessages = messages.slice(-MAX_HISTORY_MESSAGES);

    // Calcula tamanho aproximado para não exceder limite de tokens
    let totalChars = 0;
    const history: HistoryMessage[] = [];

    // Processa de trás para frente para manter as mais recentes
    for (let i = recentMessages.length - 1; i >= 0; i--) {
      const msg = recentMessages[i];
      const charCount = msg.content.length;

      // Aproximação: ~4 caracteres = 1 token
      if (totalChars + charCount > CONTEXT_WINDOW_TOKENS * 4) {
        break;
      }

      history.unshift({
        role: msg.role,
        content: msg.content,
      });
      totalChars += charCount;
    }

    return history;
  }, [messages]);

  // Enviar mensagem com streaming
  const sendMessageWithStreaming = useCallback(
    async (messageText: string, history: HistoryMessage[]) => {
      const assistantMessageId = (Date.now() + 1).toString();
      const startTime = Date.now();

      // Adiciona mensagem vazia que será preenchida com streaming
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          isStreaming: true,
        },
      ]);

      setIsStreaming(true);
      setStreamingContent("");

      let fullContent = "";

      await apiClient.stream(
        "/Chat/message/stream",
        {
          message: messageText.trim(),
          history: history.length > 0 ? history : undefined,
          includeContext: true,
        },
        // onChunk - atualiza o conteúdo incrementalmente
        (chunk: string) => {
          fullContent += chunk;
          setStreamingContent(fullContent);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: fullContent }
                : msg
            )
          );
        },
        // onComplete
        (finalContent: string) => {
          const processingTime = Date.now() - startTime;
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content: finalContent || fullContent,
                    isStreaming: false,
                    processingTimeMs: processingTime,
                    usedRAG: true, // Assume RAG se streaming está habilitado
                  }
                : msg
            )
          );
          setIsStreaming(false);
          setStreamingContent("");
        },
        // onError
        (error: Error) => {
          console.error("Erro no streaming:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? {
                    ...msg,
                    content:
                      fullContent ||
                      "❌ Erro durante o streaming. Tentando modo tradicional...",
                    isStreaming: false,
                  }
                : msg
            )
          );
          setIsStreaming(false);

          // Fallback para modo tradicional se streaming falhar
          if (!fullContent) {
            sendMessageTraditional(messageText, history);
          }
        }
      );
    },
    []
  );

  // Enviar mensagem no modo tradicional (sem streaming)
  const sendMessageTraditional = useCallback(
    async (messageText: string, history: HistoryMessage[]) => {
      try {
        const response = await apiClient.post<{
          message?: string;
          usedRAG?: boolean;
          dataSources?: string[];
          processingTimeMs?: number;
          intent?: string;
        }>("/Chat/message", {
          message: messageText.trim(),
          history: history.length > 0 ? history : undefined,
          includeContext: true,
        });

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            response.data?.message ||
            "Desculpe, não consegui processar sua pergunta.",
          timestamp: new Date(),
          usedRAG: response.data?.usedRAG,
          dataSources: response.data?.dataSources,
          processingTimeMs: response.data?.processingTimeMs,
          intent: response.data?.intent,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: unknown) {
        console.error("Erro ao enviar mensagem:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "❌ Erro ao se comunicar com o assistente. Verifique se o Azure OpenAI está configurado.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    },
    []
  );

  const sendMessage = useCallback(
    async (messageText: string) => {
      if (!messageText.trim() || isLoading || isStreaming) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: messageText.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      setShowSuggestions(false);

      // Prepara histórico de contexto
      const history = prepareHistoryContext();

      try {
        // Tenta streaming se habilitado, senão usa modo tradicional
        if (useStreaming && status?.streamingEnabled !== false) {
          await sendMessageWithStreaming(messageText, history);
        } else {
          await sendMessageTraditional(messageText, history);
        }
      } catch (error: unknown) {
        console.error("Erro ao enviar mensagem:", error);
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "❌ Erro ao se comunicar com o assistente. Verifique se o Azure OpenAI está configurado.",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [
      isLoading,
      isStreaming,
      useStreaming,
      status,
      prepareHistoryContext,
      sendMessageWithStreaming,
      sendMessageTraditional,
    ]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleSuggestionClick = (question: string) => {
    sendMessage(question);
  };

  const clearChat = () => {
    // Cancela streaming em andamento
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setMessages([]);
    setShowSuggestions(true);
    setIsStreaming(false);
    setStreamingContent("");
  };

  // Toggle para habilitar/desabilitar streaming
  const toggleStreaming = () => {
    setUseStreaming((prev) => !prev);
  };

  // Formatação do texto com markdown básico
  const formatMessage = (content: string) => {
    return content.split("\n").map((line, i) => {
      // Headers
      if (line.startsWith("## ")) {
        return (
          <h3
            key={i}
            className="text-lg font-semibold mt-3 mb-2 text-neutral-100"
          >
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <h4
            key={i}
            className="text-md font-medium mt-2 mb-1 text-neutral-200"
          >
            {line.replace("### ", "")}
          </h4>
        );
      }
      // Listas numeradas
      const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        return (
          <li key={i} className="ml-4 list-decimal text-neutral-300">
            {numberedMatch[2]}
          </li>
        );
      }
      // Listas com bullet
      if (line.startsWith("- ") || line.startsWith("• ")) {
        return (
          <li key={i} className="ml-4 list-disc text-neutral-300">
            {line.replace(/^[-•]\s+/, "")}
          </li>
        );
      }
      // Listas com indent
      if (line.startsWith("  - ") || line.startsWith("  • ")) {
        return (
          <li key={i} className="ml-8 list-disc text-neutral-400 text-sm">
            {line.replace(/^\s+[-•]\s+/, "")}
          </li>
        );
      }
      // Texto negrito
      const boldText = line.replace(
        /\*\*(.*?)\*\*/g,
        "<strong class='text-white'>$1</strong>"
      );
      if (boldText !== line) {
        return (
          <p
            key={i}
            className="text-neutral-300"
            dangerouslySetInnerHTML={{ __html: boldText }}
          />
        );
      }
      // Linha normal
      return line ? (
        <p key={i} className="text-neutral-300">
          {line}
        </p>
      ) : (
        <br key={i} />
      );
    });
  };

  // Badge de fonte de dados
  const DataSourceBadge = ({
    sources,
    usedRAG,
    processingTime,
  }: {
    sources?: string[];
    usedRAG?: boolean;
    processingTime?: number;
  }) => {
    if (!usedRAG) return null;

    return (
      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-neutral-700/50">
        <div className="flex items-center gap-1">
          <svg
            className="w-3 h-3 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-xs text-green-400">Dados reais</span>
        </div>
        {sources && sources.length > 0 && (
          <span className="text-xs text-neutral-500">
            Fonte: {sources.join(", ")}
          </span>
        )}
        {processingTime && (
          <span className="text-xs text-neutral-600">{processingTime}ms</span>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Botão flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        title="Assistente de IA com RAG"
      >
        {isOpen ? (
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        ) : (
          <svg
            className="w-7 h-7"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          </svg>
        )}
      </button>

      {/* Painel do chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-[28rem] h-[36rem] bg-neutral-900 border border-neutral-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold">Assistente CRM</h3>
                <div className="flex items-center gap-2">
                  <p className="text-white/70 text-xs">I.A. Arrighi</p>
                  {status?.ragEnabled && (
                    <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-[10px] rounded-full">
                      RAG
                    </span>
                  )}
                  {useStreaming && (
                    <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-[10px] rounded-full">
                      Stream
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Toggle Streaming */}
              <button
                onClick={toggleStreaming}
                className={`p-1.5 rounded-lg transition-colors ${
                  useStreaming
                    ? "bg-purple-500/30 text-purple-200"
                    : "bg-white/10 text-white/50"
                }`}
                title={
                  useStreaming ? "Streaming ativado" : "Streaming desativado"
                }
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </button>
              {/* Limpar Chat */}
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white transition-colors p-1.5"
                title="Limpar conversa"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mensagens */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && showSuggestions && (
              <div className="space-y-4">
                <div className="text-center text-neutral-400 mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-500/20 mb-3">
                    <svg
                      className="w-4 h-4 text-blue-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    <span className="text-xs text-blue-300">
                      RAG Habilitado
                    </span>
                  </div>
                  <p className="text-sm">
                    👋 Olá! Posso responder com{" "}
                    <strong className="text-white">dados reais</strong> do
                    sistema!
                  </p>
                  <p className="text-xs mt-1">
                    Pergunte sobre boletos, clientes, faturamento e mais
                  </p>
                </div>

                {suggestions.map((category, idx) => (
                  <div key={idx} className="space-y-2">
                    <p className="text-xs text-neutral-500 font-medium">
                      {category.category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {category.questions.slice(0, 3).map((question, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSuggestionClick(question)}
                          className="text-xs px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors border border-neutral-700/50"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-neutral-800 text-neutral-100 rounded-bl-md"
                  }`}
                >
                  {message.role === "assistant" ? (
                    <>
                      <div className="text-sm space-y-1">
                        {formatMessage(message.content)}
                      </div>
                      <DataSourceBadge
                        sources={message.dataSources}
                        usedRAG={message.usedRAG}
                        processingTime={message.processingTimeMs}
                      />
                    </>
                  ) : (
                    <p className="text-sm">{message.content}</p>
                  )}
                  <p
                    className={`text-xs mt-2 ${
                      message.role === "user"
                        ? "text-blue-200"
                        : "text-neutral-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && !isStreaming && (
              <div className="flex justify-start">
                <div className="bg-neutral-800 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400">
                      {useStreaming
                        ? "Conectando ao stream..."
                        : "Buscando dados..."}
                    </span>
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="bg-neutral-800/50 rounded-2xl rounded-bl-md px-4 py-2 border border-purple-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                    <span className="text-xs text-purple-400">
                      Gerando resposta em tempo real...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-neutral-700"
          >
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isStreaming
                    ? "Aguarde a resposta..."
                    : "Pergunte sobre dados do sistema..."
                }
                className="flex-1 bg-neutral-800 border border-neutral-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-400 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={isLoading || isStreaming}
              />
              <button
                type="submit"
                disabled={isLoading || isStreaming || !input.trim()}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
            {/* Indicador de histórico de contexto */}
            {messages.length > 0 && (
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  💬 {Math.min(messages.length, MAX_HISTORY_MESSAGES)} mensagens
                  no contexto
                </span>
                {useStreaming && (
                  <span className="flex items-center gap-1 text-purple-400">
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Streaming
                  </span>
                )}
              </div>
            )}
          </form>
        </div>
      )}
    </>
  );
}
