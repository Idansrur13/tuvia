# פלטפורמת נדל"ן בינלאומית

מרקטפלייס נדל"ן ציבורי + דשבורדים לפי תפקיד (לקוח / קבלן / מוכר-מתווך / אדמין), עם בוט AI להמלצות בשם **נדלנומטר**.

- שפה ראשית: **אנגלית**, שפה שנייה: עברית (RTL/LTR מלא).
- נכסים חדשים מפורסמים על ידי קבלנים ונמכרים ללקוחות בעזרת מתווכים.
- אפיון מלא: [docs/spec.md](docs/spec.md) · תוכנית עבודה: [docs/tasks.md](docs/tasks.md)

## סטאק

React Router v7 (SSR) · TypeScript · TailwindCSS

## הרצה

```bash
npm install
npm run dev        # http://localhost:5173
```

## בדיקות ובילד

```bash
npm run typecheck  # react-router typegen + tsc
npm run build
```

## Docker

```bash
docker build -t nadlan-platform .
docker run -p 3000:3000 nadlan-platform
```

## מבנה הפרויקט

```
app/
├── routes/        ראוטים (ציבורי + דשבורדים)
├── types/         מודל הנתונים (ראה spec.md פרק 19)
├── data/          נתוני mock/seed
├── i18n/          רב-לשוניות (en ראשית, he)
├── components/    UI + Design System
└── assistant/     בוט נדלנומטר
docs/
├── spec.md        אפיון פונקציונלי (גרסה 3.0)
└── tasks.md       תוכנית עבודה
```
