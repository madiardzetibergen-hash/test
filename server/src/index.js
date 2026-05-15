import path from "path";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import { openai } from "./openai.js";

const envPath = path.resolve(process.cwd(), ".env");

dotenv.config({
  path: envPath,
});

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const USE_MOCK_AI = process.env.USE_MOCK_AI === "true";

app.use(
  cors({
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

function createMockAnswer(message) {
  const cleanedMessage = message.trim().toLowerCase();

  if (
    cleanedMessage.includes("react") ||
    cleanedMessage.includes("реакт")
  ) {
    return `React — это JavaScript-библиотека для создания пользовательских интерфейсов.

Простыми словами: React помогает разбивать интерфейс на отдельные компоненты.

Например:
• Header
• Sidebar
• ChatWindow
• MessageInput
• Button

Главная идея React — не писать весь интерфейс одним большим файлом, а собирать приложение из маленьких переиспользуемых частей.

В этом проекте React отвечает за:
• поле ввода;
• кнопку отправки;
• отображение сообщений;
• loading-состояние;
• голосовой ввод;
• переключение темы.`;
  }

  if (
    cleanedMessage.includes("javascript") ||
    cleanedMessage.includes("js")
  ) {
    return `JavaScript — это язык программирования, который чаще всего используют для создания интерактивных веб-приложений.

В этом проекте JavaScript используется и на frontend, и на backend:

Frontend:
• React-компоненты;
• работа с состоянием;
• отправка fetch-запросов;
• обработка событий.

Backend:
• Express-сервер;
• API endpoint /api/chat;
• обработка request/response;
• валидация данных.`;
  }

  if (
    cleanedMessage.includes("backend") ||
    cleanedMessage.includes("бэк") ||
    cleanedMessage.includes("сервер")
  ) {
    return `Backend в этом проекте работает как прослойка между frontend и AI-сервисом.

Зачем он нужен:
• скрывает API key;
• принимает запросы от клиента;
• валидирует сообщение;
• отправляет запрос к AI;
• возвращает ответ обратно на frontend.

Даже если сейчас включен mock-режим, архитектура остается правильной:

React → Express → AI Service → Express → React`;
  }

  if (
    cleanedMessage.includes("голос") ||
    cleanedMessage.includes("микрофон") ||
    cleanedMessage.includes("voice")
  ) {
    return `Голосовой ввод реализуется через Web Speech API.

Как это работает:
1. Пользователь нажимает кнопку микрофона.
2. Браузер запрашивает доступ к микрофону.
3. Речь преобразуется в текст.
4. Полученный текст подставляется в поле ввода.
5. Пользователь отправляет его как обычное сообщение.

Важно: Web Speech API лучше всего работает в Google Chrome.`;
  }

  return `Mock AI ответ:

Вы отправили сообщение:
"${message.trim()}"

Сейчас приложение работает в mock-режиме, потому что OpenAI API отключен.

Но fullstack-логика уже работает полностью:

1. Frontend отправляет сообщение через fetch.
2. Backend принимает POST-запрос на /api/chat.
3. Backend валидирует данные.
4. Backend возвращает ответ.
5. Frontend отображает ответ в интерфейсе чата.

Чтобы подключить настоящий OpenAI API, нужно:
• добавить OPENAI_API_KEY в server/.env;
• поставить USE_MOCK_AI=false;
• иметь активный billing/credits на OpenAI Platform.`;
}

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AI Assistant backend is running",
    mode: USE_MOCK_AI ? "mock" : "openai",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "success",
    message: "Backend is healthy",
    mode: USE_MOCK_AI ? "mock" : "openai",
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Введите сообщение перед отправкой",
      });
    }

    if (message.length > 4000) {
      return res.status(400).json({
        error: "Сообщение слишком длинное. Максимум 4000 символов.",
      });
    }

    if (USE_MOCK_AI) {
      return res.status(200).json({
        answer: createMockAnswer(message),
        mode: "mock",
      });
    }

    if (!openai) {
      return res.status(500).json({
        error:
          "OpenAI API key не найден. Добавьте OPENAI_API_KEY или включите USE_MOCK_AI=true.",
      });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are a helpful AI assistant. Answer clearly, briefly and practically.",
        },
        {
          role: "user",
          content: message.trim(),
        },
      ],
    });

    return res.status(200).json({
      answer: response.output_text || "AI не вернул ответ.",
      mode: "openai",
    });
  } catch (error) {
    console.error("AI API error:", error);

    if (
      error.status === 429 ||
      error.code === "insufficient_quota" ||
      error.type === "insufficient_quota"
    ) {
      return res.status(200).json({
        answer:
          "OpenAI API недоступен из-за отсутствия квоты или billing. Сейчас можно включить USE_MOCK_AI=true в server/.env, чтобы приложение работало в демо-режиме.",
        mode: "quota_error",
      });
    }

    if (error.status === 401) {
      return res.status(401).json({
        error: "Неверный OpenAI API key. Проверьте ключ в server/.env.",
      });
    }

    return res.status(500).json({
      error: "Не удалось получить ответ от AI-сервиса.",
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "Маршрут не найден",
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Client URL: ${CLIENT_URL}`);
  console.log(`AI mode: ${USE_MOCK_AI ? "MOCK" : "OPENAI"}`);
  console.log(`OpenAI API key loaded: ${Boolean(process.env.OPENAI_API_KEY)}`);
});