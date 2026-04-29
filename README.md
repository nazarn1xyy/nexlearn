# EduPlatform — Система супроводу навчального процесу

Веб-орієнтована інформаційна система для центрів підвищення кваліфікації.

## Архітектура

```
Vercel (Next.js)  ◄──REST API──►  Railway (Django + DRF)  ◄──SQL──►  Supabase (PostgreSQL)
```

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS → Vercel
- **Backend**: Django 5, Django REST Framework, Simple JWT → Railway
- **Database**: PostgreSQL → Supabase

## Модулі

1. **Користувачі** — реєстрація, авторизація, ролі (адміністратор, викладач, слухач)
2. **Курси** — створення, редагування, матеріали, запис слухачів
3. **Тестування** — створення тестів, проходження, автоматичне оцінювання
4. **Сертифікати** — генерація PDF після успішного проходження курсу

## Запуск локально

### Backend (Django)

```bash
cd backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env      # налаштувати DATABASE_URL, SECRET_KEY
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### Frontend (Next.js)

```bash
cd frontend
npm install
cp env.example .env.local  # налаштувати NEXT_PUBLIC_API_URL
npm run dev
```

## Деплой

### Supabase
1. Створити проект на [supabase.com](https://supabase.com)
2. Скопіювати `DATABASE_URL` з Settings → Database

### Railway (Backend)
1. Підключити GitHub репозиторій
2. Вказати Root Directory: `backend`
3. Додати змінні: `DATABASE_URL`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`
4. Railway автоматично визначить `Procfile`

### Vercel (Frontend)
1. Підключити GitHub репозиторій
2. Вказати Root Directory: `frontend`
3. Додати змінну: `NEXT_PUBLIC_API_URL` → URL Railway бекенду

## API Endpoints

| Метод | Endpoint | Опис |
|-------|----------|------|
| POST | `/api/auth/register/` | Реєстрація |
| POST | `/api/auth/login/` | JWT токени |
| POST | `/api/auth/refresh/` | Оновити токен |
| GET | `/api/auth/me/` | Профіль |
| GET/POST | `/api/courses/` | Список / створення курсів |
| GET/PUT/DELETE | `/api/courses/{id}/` | Деталі курсу |
| POST | `/api/courses/{id}/enroll/` | Записатися |
| GET/POST | `/api/tests/` | Список / створення тестів |
| POST | `/api/tests/{id}/submit/` | Здати тест |
| GET | `/api/certificates/` | Сертифікати |
