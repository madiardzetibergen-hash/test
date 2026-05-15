# AI Assistant Fullstack Test Task

Готовое fullstack-приложение для тестовой задачи: React + Vite + Tailwind CSS v4 на frontend и Express + OpenAI API на backend.

## Что реализовано

- Минималистичный AI chat interface
- Поле ввода текста
- Отправка текста на backend
- Запрос к OpenAI API
- Отображение ответа на экране
- Голосовой ввод через Web Speech API
- Loading state
- Обработка ошибок
- Очистка чата
- Dark / Light mode
- Адаптивная основа под desktop/mobile

## Стек

### Frontend

- React
- Vite
- Tailwind CSS v4
- @tailwindcss/vite
- lucide-react

### Backend

- Node.js
- Express
- OpenAI SDK
- dotenv
- cors

## Установка

### 1. Backend

```bash
cd server
npm install
```

Создай файл `.env` на основе `.env.example`:

```env
PORT=5000
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key_here
```

Запуск backend:

```bash
npm run dev
```

Backend будет работать на:

```txt
http://localhost:5000
```

### 2. Frontend

В новом терминале:

```bash
cd client
npm install
```

Создай файл `.env` на основе `.env.example`:

```env
VITE_API_URL=http://localhost:5000
```

Запуск frontend:

```bash
npm run dev
```

Frontend будет работать на:

```txt
http://localhost:5173
```

## API

### POST /api/chat

Request body:

```json
{
  "message": "Что такое React?"
}
```

Response:

```json
{
  "answer": "React — это JavaScript-библиотека..."
}
```

## Важно

OpenAI API key хранится только на backend. Не добавляй API key во frontend `.env`.

## Tailwind CSS v4

Проект использует Tailwind CSS v4 через Vite plugin:

```js
import tailwindcss from "@tailwindcss/vite";
```

В `src/index.css` используется новый импорт:

```css
@import "tailwindcss";
```

Старый `tailwind.config.js` и `postcss.config.js` здесь не нужны.
