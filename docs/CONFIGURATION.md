# Настройка и развёртывание

## Первичная установка

```bash
npm install
npm run setup
```

`setup` генерирует Prisma Client, применяет схему к локальной базе и создаёт демонстрационные данные.

## API

Скопируйте `apps/api/.env.example` в `apps/api/.env`.

```dotenv
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CORS_ORIGINS="http://localhost:5173,http://localhost:8081"
```

Для `JWT_SECRET` используйте случайное значение длиной не менее 32 байт. `CORS_ORIGINS` принимает список origin через запятую. В разработке можно оставить локальные адреса из примера.

## Мобильное приложение

При запуске через Expo приложение обычно определяет IP компьютера автоматически. Для явной настройки скопируйте `apps/mobile/.env.example` в `apps/mobile/.env`:

```dotenv
EXPO_PUBLIC_API_URL=http://192.168.1.20:4000
```

Используйте локальный IP компьютера, а не `localhost`, если приложение открыто на физическом телефоне. API должен быть доступен через брандмауэр, а устройства должны находиться в одной сети.

Для production укажите HTTPS URL API в окружении сборки Expo/EAS. Идентификаторы приложения находятся в `apps/mobile/app.json`; перед публикацией замените их на принадлежащие вашей организации.

## Веб-панель

Скопируйте `apps/admin/.env.example` в `apps/admin/.env`:

```dotenv
VITE_API_URL=https://api.example.org
```

Создание production-сборки:

```bash
npm run build:admin
```

Готовые статические файлы появятся в `apps/admin/dist`.

## Обновление модели данных

После изменения `apps/api/prisma/schema.prisma` выполните:

```bash
npm run setup
```

Команда сохраняет существующие данные, если схема позволяет миграцию. Для чистой демонстрационной базы удалите только `apps/api/prisma/dev.db`, затем снова выполните `npm run setup`.

Для production используйте Prisma Migrate и резервное копирование. Не применяйте автоматический сброс базы.

## Проверка готовности

```bash
npm run check
```

Дополнительно проверьте `GET /api/health`, вход каждой роли, отправку и получение realtime-сообщений, загрузку изображений и навигацию по уведомлениям.
