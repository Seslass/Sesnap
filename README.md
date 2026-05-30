# Sesnap — Инструкция запуска

## Шаг 1 — Supabase (база данных)

1. Зайдите на https://supabase.com и создайте новый проект
2. Откройте **SQL Editor** → **New query**
3. Вставьте содержимое файла `supabase_schema.sql` → нажмите **Run**
4. Зайдите в **Storage** → **New bucket** → назовите `avatars` → включите **Public bucket** → Save

## Шаг 2 — Отключить email-подтверждение (для быстрого теста)

В Supabase: **Authentication → Providers → Email** → выключите **Confirm email** → Save

## Шаг 3 — Переменные окружения

Скопируйте файл `.env.local.example` → переименуйте в `.env.local`

Значения возьмите в Supabase: **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key

## Шаг 4 — Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:3000

## Что работает

- Регистрация / Вход / Выход
- Лента постов с лайками
- Страница профиля /profile/[id]
- Загрузка аватара
- Редактирование username и bio
- Синяя галочка верификации (is_verified = true в БД)
- Бейдж Администратор (role = 'admin' в БД)
