# תוכנית עבודה - לפי סדר עדיפות

מסמך זה מסודר לפי דחיפות: **קודם מתקנים את הבילד השבור, אחר כך מסיימים את המעבר, ואז פיצ'רים, ובסוף אימות.**
כל משימה: מה שבור/חסר, מה עושים, ומתי גמור.

## מצב נוכחי (עובדה, לא הנחה)

בוצע רפקטור חלקי: נוצרה שכבת נתונים חדשה `app/data/` ושכבת הרשאות `app/lib/permissions.ts`,
ובמקביל **נמחקו** הקבצים הישנים `app/dashboard/data.ts`, `app/dashboard/store.server.ts`,
`app/dashboard/import-types.ts`. הבעיה: כמה ראוטים עדיין מייבאים את הקבצים שנמחקו, ולכן
**הבילד שבור עכשיו.** זו העדיפות הראשונה.

מה שכבר קיים ומוכן לשימוש: `app/types/` (מודל מלא), `app/data/` (seed לפי המודל), `app/lib/permissions.ts` (RBAC).

---

# שלב א' - תיקון הבילד השבור (דחוף)

חמישה מקומות מייבאים קבצים שנמחקו. עד שהם מתוקנים, `tsc`/`build` נכשלים.

## משימה 8 - `leads.tsx`
`app/routes/dashboard/leads.tsx:27` מייבא מ-`../../dashboard/data` (נמחק).
- להחליף ל-`import { LEADS, LEAD_STAGES, INVITES, projectById } from '~/data'` ו-`import type { Lead, LeadStage, Invite } from '~/types'`.
- ליישר למבנה החדש: `id` הוא `string` (לא number), `budget` הוא `Money` (לא number), `stage` מ-6 השלבים החדשים, ואין `flag` אלא `countryCode`.
- **גמור:** הקובץ עובר `tsc` והמסך נטען.

## משימה 9 - `projects.tsx`
`app/routes/dashboard/projects.tsx:19-20` מייבא משני קבצים שנמחקו: `../../dashboard/data` ו-`../../dashboard/store.server` (הפונקציה `getProjects`).
- להפנות נתונים ל-`~/data` (`PROJECTS`, `unitById`).
- **החלטה נדרשת:** מה מחליף את `getProjects` של ה-store. אפשרות א' - ה-loader קורא ישירות מ-`~/data`. אפשרות ב' - store server חדש. (מוצע: אפשרות א' כל עוד אין DB.)
- **גמור:** אין ייבוא מנתיב מחוק, המסך נטען.

## משימה 10 - `import.tsx`  (תלוי ב-9)
`app/routes/dashboard/import.tsx:60` עושה dynamic import ל-`../../dashboard/store.server` (`applyImport`).
- לעדכן לפי ההחלטה שהתקבלה במשימה 9 לגבי שכבת ה-store.
- **גמור:** `applyImport` מיובא ממקום קיים, אין שגיאה.

## משימה 11 - `ai.server.ts`  (תלוי ב-9)
`app/dashboard/ai.server.ts` מייבא `./store.server` ו-`./import-types` (שניהם נמחקו). טיפוסי הייבוא כבר עברו ל-`~/types` (ראה הערה בראש `app/types/ai.ts`).
- להחליף את ייבוא הטייפים ל-`~/types`, ולחבר מחדש את שכבת ה-store לפי משימה 9.
- **גמור:** אין ייבוא מנתיב מחוק.

## משימה 12 - `property.tsx` + `logIn.tsx` (auth)
שתי שגיאות נפרדות:
1. `app/routes/property.tsx:46` מייבא `~/components/modals/loginModal` - אבל הקובץ נקרא `logIn.tsx`. לתקן את שם/נתיב הייבוא.
2. `app/components/modals/logIn.tsx:8` קורא ל-`useAuth()` שלא קיים בשום מקום.
- **החלטה נדרשת:** ליצור `useAuth` מינימלי (context/hook עם mock user) או להסיר את התלות בשלב זה. (מוצע: hook מינימלי, כי גם התפריט הדינמי בשלב ג' צריך "מי מחובר".)
- **גמור:** שני הקבצים עוברים `tsc`.

---

# שלב ב' - סיום המעבר לשכבה החדשה

## משימה 13 - חיסול `app/listings/data.ts` הישן
הקובץ הישן (`id:number`, `price:number`) עדיין קיים, בזמן ש-`app/data/listings.ts` החדש מוכן.
- להפנות את כל הצרכנים (`listing-card.tsx`, `listings.tsx`, `property.tsx`, `home.tsx`) ל-`~/data` + `~/types`.
- למחוק את `app/listings/data.ts`.
- **גמור:** אין יותר ייבוא מ-`listings/data`, החיפוש/סינון בעמוד הבית עובד (בדיקה בדפדפן).

---

# שלב ג' - פיצ'רים

## משימה 14 - תפריט דשבורד דינמי לפי role
`app/routes/dashboard.tsx` מקודד קשיח לקבלן (`CONTRACTOR_NAV`, Badge "קבלן", משתמש קבוע "יוסי כהן").
- לבנות תפריט מונחה-הרשאות: כל פריט דורש `Permission`, וסינון דרך `can()` מ-`app/lib/permissions.ts` (כבר קיים).
- כרטיס המשתמש וה-Badge נגזרים מ-`role` של המשתמש המחובר (ה-`useAuth` ממשימה 12).
- **גמור:** החלפת role משנה בפועל את פריטי התפריט; אין טקסט "קבלן" קשיח.

## משימה 15 - קומפוננטת צ'אט
הדאטה (`app/data/chat.ts`) והטייפים (`app/types/chat.ts`) קיימים; אין קומפוננטה.
- לבנות מסך צ'אט (UI בלבד): רשימת שיחות עם מונה "לא נקרא", חלון הודעות עם סטטוסי `delivery` (`sending/sent/delivered/read/failed`), ותווית הקשר שיחה (יחידה/עסקה/ליד).
- לרשום ראוט ב-`app/routes.ts`.
- **גמור:** אפשר לפתוח שיחה, לראות הודעות, ולשלוח הודעת mock. פרק 9.

## משימה 16 - שדרוג מסך הלידים (תלוי ב-8)
אחרי תיקון הייבוא, להעשיר את המסך לפי המודל (פרק 13):
- להציג `heat` (חם/פושר/קר), `score/100`, `source`, ותזכורת מעקב.
- להוסיף סינון (`LeadFilters`) ושמירת תצוגה (`SavedLeadView`).
- **גמור:** הכרטיסים מציגים חום וניקוד; אפשר לסנן ("רק חמים" / "מעקב שעבר").

---

# שלב ד' - אימות

## משימה 17 - typecheck + build נקי (תלוי בכל השאר)
```bash
npm run typecheck   # react-router typegen + tsc
npm run build
```
- הערה: בסביבת הסנדבוקס שלי `typegen` נכשל על native binding (arm64/rolldown), לכן ההרצה המלאה צריכה לרוץ אצלך. בסנדבוקס אפשר `tsc` על `+types` קיימים.
- לעבור על `git diff`, לתקן שאריות, ובדיקה ידנית: עמוד הבית, לידים, צ'אט נטענים בלי קריסה.

---

## סדר ותלויות

| # | משימה | שלב | תלוי ב |
|---|--------|-----|--------|
| 8 | leads.tsx | א' דחוף | - |
| 9 | projects.tsx | א' דחוף | - |
| 10 | import.tsx | א' דחוף | 9 |
| 11 | ai.server.ts | א' דחוף | 9 |
| 12 | property + logIn (auth) | א' דחוף | - |
| 13 | חיסול listings/data.ts | ב' | - |
| 14 | תפריט דינמי | ג' | (12 ל-useAuth) |
| 15 | צ'אט | ג' | - |
| 16 | לידים מתקדם | ג' | 8 |
| 17 | אימות | ד' | הכל |

**מסלול:** קודם 8,9,12 (עצמאיים), אחריהם 10,11 (תלויים ב-9). זה מחזיר בילד ירוק. אז 13 לסגירת המעבר, ואז 14,15,16 פיצ'רים, ו-17 סוגר.

## החלטות פתוחות לסגור לפני שמתחילים
1. **שכבת store** (משימות 9-11): loader קורא ישירות מ-`~/data`, או store server חדש? (מוצע: קריאה ישירה כל עוד אין DB.)
2. **auth** (משימה 12): `useAuth` mock מינימלי, או להסיר את התלות כרגע? (מוצע: mock מינימלי, נחוץ גם לתפריט הדינמי.)
