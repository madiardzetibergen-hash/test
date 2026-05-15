import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import pg from "pg";
import OpenAI from "openai";

dotenv.config();

const app = express();
const { Pool } = pg;

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "*";
const USE_MOCK_AI = process.env.USE_MOCK_AI === "true";

let pool = null;
let databaseReady = false;

function getDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_POSTGRES_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL
  );
}

function getPool() {
  const databaseUrl = getDatabaseUrl();

  if (!databaseUrl) {
    throw new Error(
      "Database URL is missing. Add DATABASE_URL or DATABASE_URL_POSTGRES_URL in Vercel Environment Variables."
    );
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return pool;
}

async function initDatabase() {
  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      role VARCHAR(20) NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function ensureDatabase() {
  if (!databaseReady) {
    await initDatabase();
    databaseReady = true;
  }
}

async function saveMessage(role, text) {
  const db = getPool();

  const result = await db.query(
    `
    INSERT INTO messages (role, text)
    VALUES ($1, $2)
    RETURNING id, role, text, created_at;
    `,
    [role, text]
  );

  return result.rows[0];
}

async function getMessages() {
  const db = getPool();

  const result = await db.query(`
    SELECT id, role, text, created_at
    FROM messages
    ORDER BY created_at ASC;
  `);

  return result.rows;
}

async function clearMessages() {
  const db = getPool();

  await db.query("DELETE FROM messages");
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

function hasDatabaseUrl() {
  return Boolean(
    process.env.DATABASE_URL ||
      process.env.DATABASE_URL_POSTGRES_URL ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.POSTGRES_URL
  );
}

function getAllowedOrigins() {
  if (!CLIENT_URL || CLIENT_URL === "*") {
    return "*";
  }

  return CLIENT_URL.split(",").map((url) => url.trim());
}

app.use(
  cors({
    origin: getAllowedOrigins(),
    methods: ["GET", "POST", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

function createMockAnswer(message) {
  const cleanedMessage = message.trim().toLowerCase();

  if (cleanedMessage.includes("react") || cleanedMessage.includes("реакт")) {
    return `React — это JavaScript-библиотека для создания пользовательских интерфейсов.

В этом проекте React отвечает за:
• интерфейс чата;
• поле ввода;
• отображение сообщений;
• loading-состояние;
• голосовой ввод;
• переключение темы.

Frontend отправляет сообщение на backend через fetch-запрос, а backend возвращает ответ обратно в интерфейс.`;
  }

  if (
    cleanedMessage.includes("backend") ||
    cleanedMessage.includes("бэк") ||
    cleanedMessage.includes("сервер") ||
    cleanedMessage.includes("express")
  ) {
    return `Backend в этом проекте работает как API-прослойка.

Архитектура:

React frontend → Express backend → Mock AI / OpenAI → Neon PostgreSQL

Backend делает несколько вещей:
• принимает POST-запрос;
• проверяет сообщение;
• создает AI-ответ;
• сохраняет user/assistant сообщения в Neon;
• возвращает результат на frontend.`;
  }

  if (
    cleanedMessage.includes("neon") ||
    cleanedMessage.includes("postgres") ||
    cleanedMessage.includes("postgresql") ||
    cleanedMessage.includes("база")
  ) {
    return `Neon — это serverless PostgreSQL.

В этом проекте Neon используется для хранения истории сообщений.

Таблица messages содержит:
• id — уникальный номер сообщения;
• role — user или assistant;
• text — текст сообщения;
• created_at — дата создания.

Так проект выглядит как полноценное fullstack-приложение, а не просто frontend-форма.`;
  }

  if (
    cleanedMessage.includes("vercel") ||
    cleanedMessage.includes("деплой") ||
    cleanedMessage.includes("deploy")
  ) {
    return `Vercel используется для деплоя проекта.

Frontend можно задеплоить как Vite-приложение.

Backend можно задеплоить как serverless Express API.

Важные переменные окружения для backend:
• CLIENT_URL
• USE_MOCK_AI
• DATABASE_URL

Для frontend:
• VITE_API_URL`;
  }

  if (
    cleanedMessage.includes("голос") ||
    cleanedMessage.includes("микрофон") ||
    cleanedMessage.includes("voice")
  ) {
    return `Голосовой ввод реализуется через Web Speech API.

Как работает:
1. Пользователь нажимает кнопку микрофона.
2. Браузер запрашивает доступ к микрофону.
3. Речь преобразуется в текст.
4. Текст подставляется в поле ввода.
5. Пользователь отправляет сообщение на backend.

Лучше всего Web Speech API работает в Google Chrome.`;
  }

  return `Mock AI ответ:

Вы отправили:
"${message.trim()}"

Сейчас проект работает без платного OpenAI API.

Но fullstack-логика уже работает:

1. React отправляет сообщение на backend.
2. Express принимает запрос.
3. Backend создает mock AI ответ.
4. Сообщения сохраняются в Neon PostgreSQL.
5. Frontend отображает ответ в интерфейсе.

Чтобы подключить настоящий OpenAI API:
• добавьте OPENAI_API_KEY;
• поставьте USE_MOCK_AI=false;
• подключите billing/credits в OpenAI Platform.`;
}

app.get("/", (req, res) => {
  return res.json({
    status: "success",
    message: "AI Assistant backend is running",
    mode: USE_MOCK_AI ? "mock" : "openai",
    hasDatabaseUrl: hasDatabaseUrl(),
    hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await ensureDatabase();

    const db = getPool();
    await db.query("SELECT 1");

    return res.json({
      status: "success",
      message: "Backend is healthy",
      mode: USE_MOCK_AI ? "mock" : "openai",
      database: "connected",
      hasDatabaseUrl: hasDatabaseUrl(),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (error) {
    console.error("Health check error:", error);

    return res.status(500).json({
      status: "error",
      message: "Backend is running, but database connection failed",
      database: "disconnected",
      hasDatabaseUrl: hasDatabaseUrl(),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
      error: error.message,
    });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    await ensureDatabase();

    const messages = await getMessages();

    return res.json({
      messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      error: "Не удалось получить историю сообщений",
      details: error.message,
    });
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    await ensureDatabase();

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

    const cleanedMessage = message.trim();

    const userMessage = await saveMessage("user", cleanedMessage);

    let answer;

    if (USE_MOCK_AI) {
      answer = createMockAnswer(cleanedMessage);
    } else {
      const openai = getOpenAIClient();

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
            content: cleanedMessage,
          },
        ],
      });

      answer = response.output_text || "AI не вернул ответ.";
    }

    const assistantMessage = await saveMessage("assistant", answer);

    return res.status(200).json({
      answer,
      mode: USE_MOCK_AI ? "mock" : "openai",
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      error: "Не удалось получить ответ от сервера.",
      details: error.message,
    });
  }
});

app.delete("/api/messages", async (req, res) => {
  try {
    await ensureDatabase();

    await clearMessages();

    return res.json({
      message: "История сообщений очищена",
    });
  } catch (error) {
    console.error("Delete messages error:", error);

    return res.status(500).json({
      error: "Не удалось очистить историю сообщений",
      details: error.message,
    });
  }
});

app.use((req, res) => {
  return res.status(404).json({
    error: "Маршрут не найден",
  });
});

if (process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Client URL: ${CLIENT_URL}`);
    console.log(`AI mode: ${USE_MOCK_AI ? "MOCK" : "OPENAI"}`);
    console.log(`DATABASE_URL loaded: ${hasDatabaseUrl()}`);
    console.log(`OPENAI_API_KEY loaded: ${Boolean(process.env.OPENAI_API_KEY)}`);
  });
}

export default app;