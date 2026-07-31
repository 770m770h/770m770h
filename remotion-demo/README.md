# פרסומת "אנשים" — Remotion (וידאו תכנותי ב-React)

פרסומת פרימיום למותג בתחום **יחסי אנוש**, שנבנתה כולה כקוד React עם
[Remotion](https://www.remotion.dev/) — בלי טיימליין ובלי צוות וידאו.
הכול נגזר מ-`props`: טקסט, צבעים ותנועה מחושבים לפי הפריים הנוכחי.

![poster](out/poster.png)

## שפת עיצוב

- **עברית מלאה, RTL.** בלי סגול ובלי זוהר-AI גנרי.
- פלטה חמה ואנושית: נייר (`#ECE4D3`), דיו (`#211B13`), ירוק-אורן (`#1E5A44`) וניצוץ טרקוטה (`#B9552F`).
- טיפוגרפיה עברית אמיתית: **Frank Ruhl Libre** (סריף תצוגה) ל-כותרות, **Assistant** (סן-סריף) לגוף.
- אייקוני-קו מצוירים (SVG) במקום אמוג'י.
- תנועה מאופקת: `spring()` לכניסות, `interpolate()` לקו-ההדגשה ולפייד.

1920×1080, ‏180 פריימים @ 30fps (6 שניות).

## הטמעת גופנים

לדפדפן ה-headless אין גופן עברי, לכן הגופנים **מוטמעים מקומית** (`public/fonts/*.woff2`,
מתוך חבילות `@fontsource`) ונטענים דרך `@font-face` + `delayRender`, כך שהרינדור
לא תלוי בגופני מערכת או ברשת. ראו `src/fonts.ts`.

## קבצים

| קובץ | תפקיד |
|------|-------|
| `src/index.ts` | נקודת כניסה (`registerRoot`) |
| `src/Root.tsx` | הגדרת ה-`<Composition>` (גודל, fps, משך) |
| `src/FeatureDemo.tsx` | קומפוננטת הפרסומת + ה-`props`/ברירות המחדל |
| `src/fonts.ts` | הטמעת גופנים עבריים + חסימת רינדור עד לטעינתם |
| `src/icons.tsx` | אייקוני-קו + סמל המותג |

## התאמה אישית

עורכים את `featureDemoDefaultProps` ב-`src/FeatureDemo.tsx` (מותג, כותרת,
תת-כותרת, `features`, cta) — וכל הסרטון מתרנדר מחדש מהנתונים. בלי עריכה חוזרת,
בלי צילום מחדש.

## פיתוח

```bash
npm install
npm run studio      # תצוגה אינטראקטיבית ב-http://localhost:3000
```

## רינדור

Remotion מרנדר עם Chrome headless. בסביבה הזו קיים `chrome-headless-shell`
מותקן מראש, לכן מעבירים אותו במפורש:

```bash
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell

npm run render -- --browser-executable="$HS"   # → out/feature-demo.mp4
npm run still  -- --browser-executable="$HS"    # → out/poster.png
```

במחשב רגיל משמיטים את `--browser-executable` ו-Remotion מוריד Chrome בעצמו.

## רינדור ב-CI

מכיוון שהסרטון הוא קוד, `npm run render` רץ בכל מקום — commit למקור,
רינדור ה-MP4 ב-pipeline, ושחרור כ-build artifact.
