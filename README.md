# AI Assistant Fullstack Test Task

Fullstack-приложение для отправки текстового сообщения на backend, получения AI-ответа и отображения результата в интерфейсе чата.

Проект выполнен как тестовое задание для fullstack-разработчика.

## Demo

Frontend: `вставь_ссылку_на_frontend_vercel`

Backend health check: `https://test-sandy-omega-48.vercel.app/api/health`

GitHub repository: `вставь_ссылку_на_github`

---

## Стек технологий

### Frontend

- React
- Vite
- Tailwind CSS v4
- lucide-react
- Web Speech API

### Backend

- Node.js
- Express.js
- PostgreSQL
- Neon Database
- OpenAI SDK
- Vercel Serverless Functions

### Deploy

- Frontend: Vercel
- Backend: Vercel
- Database: Neon PostgreSQL

---

## Основной функционал

- Поле для ввода текста
- Отправка сообщения на backend
- Отображение ответа в интерфейсе чата
- История сообщений
- Сохранение сообщений в Neon PostgreSQL
- Голосовой ввод через Web Speech API
- Кнопка микрофона для распознавания речи
- Подстановка распознанного текста в поле ввода
- Индикатор загрузки при ожидании ответа
- Обработка ошибок на frontend и backend
- Очистка истории чата
- Dark / Light mode
- Адаптивный минималистичный интерфейс

---

## Важное уточнение по AI API

Проект поддерживает интеграцию с OpenAI API.

В deployed demo включен `mock AI mode`, потому что OpenAI API требует активного billing на OpenAI Platform.

При этом backend уже подготовлен к работе с настоящим OpenAI API. Для переключения нужно добавить API key и изменить переменную окружения:

```env
USE_MOCK_AI=false
OPENAI_API_KEY=your_openai_api_key