import { useMemo, useRef, useState } from "react";
import {
  Bot,
  Mic,
  Send,
  Loader2,
  Plus,
  Trash2,
  MessageCircle,
  Moon,
  Sun,
  Paperclip,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const initialChats = [
  { id: 1, title: "Что такое React?", time: "14:32" },
  { id: 2, title: "Объясни квантовые вычисления", time: "Вчера" },
  { id: 3, title: "Как приготовить пасту?", time: "Вчера" },
  { id: 4, title: "Советы по изучению английского", time: "2 дня назад" },
  { id: 5, title: "Идеи для стартапа", time: "3 дня назад" },
];

function getCurrentTime() {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()}`;
}

export default function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: createId(),
      role: "user",
      text: "Расскажи, что такое React и для чего его используют?",
      time: "14:32",
    },
    {
      id: createId(),
      role: "assistant",
      text:
        "React — это JavaScript-библиотека для создания пользовательских интерфейсов. Она помогает строить быстрые, интерактивные и масштабируемые веб-приложения.\n\nОсновные особенности React:\n• компонентный подход\n• виртуальный DOM\n• однонаправленный поток данных\n• большое сообщество и экосистема\n\nReact часто используют вместе с React Router, Redux, Next.js и другими инструментами.",
      time: "14:33",
    },
  ]);

  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const textareaRef = useRef(null);

  const activeChatTitle = useMemo(() => {
    return chats.find((chat) => chat.id === activeChatId)?.title || "Новый чат";
  }, [chats, activeChatId]);

  async function handleSubmit() {
    try {
      setError("");

      const cleanedMessage = message.trim();

      if (!cleanedMessage) {
        setError("Введите сообщение перед отправкой");
        return;
      }

      const userMessage = {
        id: createId(),
        role: "user",
        text: cleanedMessage,
        time: getCurrentTime(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setMessage("");
      setLoading(true);

      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: cleanedMessage }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка сервера");
      }

      const assistantMessage = {
        id: createId(),
        role: "assistant",
        text: data.answer,
        time: getCurrentTime(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                title:
                  cleanedMessage.length > 32
                    ? `${cleanedMessage.slice(0, 32)}...`
                    : cleanedMessage,
                time: getCurrentTime(),
              }
            : chat
        )
      );
    } catch (err) {
      setError(err.message || "Что-то пошло не так");

      setMessages((prev) => [
        ...prev,
        {
          id: createId(),
          role: "assistant",
          text:
            "Не удалось получить ответ. Проверьте backend, API key или подключение к интернету.",
          time: getCurrentTime(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  function handleNewChat() {
    const newChat = {
      id: Date.now(),
      title: "Новый чат",
      time: "Сейчас",
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
    setMessages([]);
    setMessage("");
    setError("");
  }

  function handleClearChat() {
    setMessages([]);
    setMessage("");
    setError("");
  }

  function handleVoiceInput() {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError(
        "Ваш браузер не поддерживает Web Speech API. Попробуйте Google Chrome."
      );
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setListening(true);
      setError("");
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;

      setMessage((prev) => {
        if (!prev.trim()) return text;
        return `${prev} ${text}`;
      });
    };

    recognition.onerror = () => {
      setError("Не удалось распознать речь");
    };

    recognition.onend = () => {
      setListening(false);
      textareaRef.current?.focus();
    };

    recognition.start();
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!loading) handleSubmit();
    }
  }

  return (
    <div
      className={
        darkMode
          ? "min-h-screen bg-[#050816] text-white"
          : "min-h-screen bg-slate-100 text-slate-950"
      }
    >
      <div className="min-h-screen p-4 lg:p-6">
        <div className="mx-auto grid h-[calc(100vh-32px)] max-w-[1500px] grid-cols-1 gap-5 lg:grid-cols-[380px_1fr]">
          <aside
            className={
              darkMode
                ? "hidden overflow-hidden rounded-[28px] border border-white/10 bg-[#090d1a]/90 shadow-[0_20px_80px_rgba(0,0,0,0.35)] lg:flex lg:flex-col"
                : "hidden overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.18)] lg:flex lg:flex-col"
            }
          >
            <div className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700 shadow-lg">
                  <Bot className="h-8 w-8 text-white" />
                </div>

                <div>
                  <h1 className="text-2xl font-bold tracking-tight">AI Assistant</h1>
                  <p className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                    Ваш персональный помощник
                  </p>
                </div>
              </div>

              <button
                onClick={handleNewChat}
                className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-4 font-semibold text-white transition hover:scale-[1.01] hover:from-indigo-400 hover:to-violet-500"
              >
                <Plus className="h-5 w-5" />
                Новый чат
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-5">
              <p className={darkMode ? "mb-4 px-2 text-sm text-slate-400" : "mb-4 px-2 text-sm text-slate-500"}>
                История чатов
              </p>

              <div className="space-y-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={
                      activeChatId === chat.id
                        ? "flex w-full items-center gap-3 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-4 py-4 text-left"
                        : darkMode
                          ? "flex w-full items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-4 text-left transition hover:bg-white/[0.06]"
                          : "flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:bg-slate-100"
                    }
                  >
                    <MessageCircle className="h-5 w-5 shrink-0 text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{chat.title}</p>
                    </div>
                    <span className={darkMode ? "text-xs text-slate-400" : "text-xs text-slate-500"}>
                      {chat.time}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-5">
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className={
                  darkMode
                    ? "flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 transition hover:bg-white/[0.06]"
                    : "flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 transition hover:bg-slate-100"
                }
              >
                <span className="flex items-center gap-3">
                  {darkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  {darkMode ? "Тёмная тема" : "Светлая тема"}
                </span>
                <span className={darkMode ? "flex h-8 w-8 items-center justify-center rounded-full bg-white/5" : "flex h-8 w-8 items-center justify-center rounded-full bg-slate-200"}>
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </span>
              </button>
            </div>
          </aside>

          <main
            className={
              darkMode
                ? "flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#090d1a]/90 shadow-[0_20px_80px_rgba(0,0,0,0.35)]"
                : "flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.18)]"
            }
          >
            <header className={darkMode ? "flex items-center justify-between border-b border-white/10 px-5 py-5 lg:px-8" : "flex items-center justify-between border-b border-slate-200 px-5 py-5 lg:px-8"}>
              <div>
                <h2 className="text-lg font-semibold lg:text-xl">{activeChatTitle}</h2>
                <p className={darkMode ? "text-sm text-slate-400" : "text-sm text-slate-500"}>
                  Fullstack AI test task
                </p>
              </div>

              <button
                onClick={handleClearChat}
                className={
                  darkMode
                    ? "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] transition hover:bg-red-500/15 hover:text-red-300"
                    : "flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 transition hover:bg-red-50 hover:text-red-500"
                }
                title="Очистить чат"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </header>

            <section className="flex-1 overflow-y-auto px-5 py-6 lg:px-8">
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <div className="max-w-md text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-700">
                      <Bot className="h-9 w-9 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold">Начните новый диалог</h3>
                    <p className={darkMode ? "mt-3 text-slate-400" : "mt-3 text-slate-500"}>
                      Напишите вопрос или нажмите на микрофон, чтобы использовать голосовой ввод.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((item) => {
                    const isUser = item.role === "user";

                    return (
                      <div
                        key={item.id}
                        className={isUser ? "flex items-start justify-end gap-4" : "flex items-start justify-start gap-4"}
                      >
                        {!isUser && (
                          <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700">
                            <Bot className="h-7 w-7 text-white" />
                          </div>
                        )}

                        <div
                          className={
                            isUser
                              ? "max-w-[760px] rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-700 px-6 py-4 text-white shadow-lg"
                              : item.isError
                                ? "max-w-[760px] rounded-3xl border border-red-500/30 bg-red-950/30 px-6 py-4 text-red-200"
                                : darkMode
                                  ? "max-w-[760px] rounded-3xl border border-white/10 bg-white/[0.07] px-6 py-4 text-slate-100"
                                  : "max-w-[760px] rounded-3xl border border-slate-200 bg-slate-100 px-6 py-4 text-slate-800"
                          }
                        >
                          <p className="whitespace-pre-wrap text-[15px] leading-7 lg:text-base">
                            {item.text}
                          </p>
                          <p className={isUser ? "mt-3 text-right text-xs text-white/70" : darkMode ? "mt-3 text-xs text-slate-400" : "mt-3 text-xs text-slate-500"}>
                            {item.time}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {loading && (
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-700">
                        <Bot className="h-7 w-7 text-white" />
                      </div>
                      <div className={darkMode ? "rounded-3xl border border-white/10 bg-white/[0.07] px-6 py-4" : "rounded-3xl border border-slate-200 bg-slate-100 px-6 py-4"}>
                        <div className="flex items-center gap-3">
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
                          <span className={darkMode ? "text-slate-300" : "text-slate-600"}>AI думает...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <footer className={darkMode ? "border-t border-white/10 px-5 py-5 lg:px-8" : "border-t border-slate-200 px-5 py-5 lg:px-8"}>
              {error && (
                <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}

              <div className={darkMode ? "rounded-3xl border border-white/10 bg-white/[0.05] p-4" : "rounded-3xl border border-slate-200 bg-slate-50 p-4"}>
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Введите ваше сообщение..."
                  className={
                    darkMode
                      ? "h-20 w-full resize-none bg-transparent px-1 text-white outline-none placeholder:text-slate-500"
                      : "h-20 w-full resize-none bg-transparent px-1 text-slate-950 outline-none placeholder:text-slate-400"
                  }
                />

                <div className="mt-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className={darkMode ? "flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] transition hover:bg-white/[0.08]" : "flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-white transition hover:bg-slate-100"}
                      title="Файл"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      disabled={loading || listening}
                      className={
                        listening
                          ? "flex h-12 w-12 items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/20 text-red-300"
                          : darkMode
                            ? "flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-500/40 bg-indigo-500/10 text-indigo-300 transition hover:bg-indigo-500/20 disabled:opacity-50"
                            : "flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-200 bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 disabled:opacity-50"
                      }
                      title="Голосовой ввод"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !message.trim()}
                    className="flex min-w-[170px] items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 px-6 py-3 font-semibold text-white transition hover:scale-[1.01] hover:from-indigo-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Отправка
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Отправить
                      </>
                    )}
                  </button>
                </div>
              </div>

              <p className={darkMode ? "mt-3 text-center text-xs text-slate-500" : "mt-3 text-center text-xs text-slate-400"}>
                Нажмите Enter для отправки, Shift + Enter для новой строки
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
