import path from "path";
import dotenv from "dotenv";

const envPath = path.resolve(process.cwd(), ".env");

dotenv.config({
  path: envPath,
});

import express from "express";
import cors from "cors";
import { openai } from "./openai.js";
import { pool, initDatabase } from "./db.js";

const app = express();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const USE_MOCK_AI = process.env.USE_MOCK_AI === "true";

app.use(
  cors({
    origin: CLIENT_URL,
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
• поле ввода;
• отображение сообщений;
• loading;
• голосовой ввод;
• переключение темы.`;
  }

  if (cleanedMessage.includes("backend") || cleanedMessage.includes("сервер")) {
    return `Backend здесь работает как прослойка между frontend и AI-сервисом.

Архитектура:
React → Express → AI Service / Mock AI → Express → React

Также backend сохраняет историю сообщений в PostgreSQL через Neon.`;
  }

  if (cleanedMessage.includes("neon") || cleanedMessage.includes("база")) {
    return `Neon — это serverless PostgreSQL.

В этом проекте Neon используется для хранения истории сообщений:
• role — кто написал сообщение;
• text — текст сообщения;
• created_at — дата создания.`;
  }

  return `Mock AI ответ:

Вы отправили:
"${message.trim()}"

Приложение работает без платного OpenAI API.

Сейчас работает вся fullstack-логика:
1. React отправляет запрос.
2. Express принимает сообщение.
3. Backend создает mock AI ответ.
4. Сообщения сохраняются в Neon PostgreSQL.
5. Frontend отображает ответ.`;
}

async function saveMessage(role, text) {
  const result = await pool.query(
    `
    INSERT INTO messages (role, text)
    VALUES ($1, $2)
    RETURNING id, role, text, created_at;
    `,
    [role, text]
  );

  return result.rows[0];
}

app.get("/", (req, res) => {
  res.json({
    status: "success",
    message: "AI Assistant backend is running",
    mode: USE_MOCK_AI ? "mock" : "openai",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "success",
      message: "Backend is healthy",
      mode: USE_MOCK_AI ? "mock" : "openai",
      database: "connected",
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Database connection failed",
    });
  }
});

app.get("/api/messages", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, role, text, created_at
      FROM messages
      ORDER BY created_at ASC;
    `);

    res.json({
      messages: result.rows,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    res.status(500).json({
      error: "Не удалось получить историю сообщений",
    });
  }
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

    const userMessage = await saveMessage("user", message.trim());

    let answer;

    if (USE_MOCK_AI) {
      answer = createMockAnswer(message);
    } else {
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

      answer = response.output_text || "AI не вернул ответ.";
    }

    const assistantMessage = await saveMessage("assistant", answer);

    res.status(200).json({
      answer,
      mode: USE_MOCK_AI ? "mock" : "openai",
      userMessage,
      assistantMessage,
    });
  } catch (error) {
    console.error("AI API error:", error);

    res.status(500).json({
      error: "Не удалось получить ответ от сервера.",
    });
  }
});

app.delete("/api/messages", async (req, res) => {
  try {
    await pool.query("DELETE FROM messages");

    res.json({
      message: "История сообщений очищена",
    });
  } catch (error) {
    console.error("Delete messages error:", error);

    res.status(500).json({
      error: "Не удалось очистить историю сообщений",
    });
  }
});

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Client URL: ${CLIENT_URL}`);
      console.log(`AI mode: ${USE_MOCK_AI ? "MOCK" : "OPENAI"}`);
      console.log(`Database: initialized`);
    });
  })
  .catch((error) => {
    console.error("Database initialization failed:", error);
    process.exit(1);
  });