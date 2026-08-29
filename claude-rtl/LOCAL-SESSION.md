# מעבר לסשן לוקלי

הפרויקט הזה נבנה בסשן ענן, שאין לו גישה למחשב של המשתמש. הקוד נכתב ונבדק
(56 בדיקות עוברות), אבל **מעולם לא הורץ על מכונת Windows אמיתית**. סשן לוקלי
יכול לסגור את הפער הזה.

## הקשר למי שממשיך מכאן

- **מטרה:** תצוגת עברית מימין לשמאל ב-Claude Desktop, כולל שורות שמערבבות אנגלית.
- **מערכת:** Windows. המשתמש אינו מפתח — צריך הוראות קונקרטיות, לא אפשרויות.
- **מצב:** הענף `claude/hebrew-rtl-display-z6f81n`, PR #3, לא מוזג. `main` ריק
  מהתוכן הזה — הורדת ZIP של `main` נותנת תיקייה עם `README.md` בלבד, וזו כבר
  הייתה תקלה אחת.
- **מה עוד לא נבדק:** `windows/claude-rtl.ps1` ו-`install.ps1` נבדקו מבנית בלבד;
  אין PowerShell בסביבת הענן. ההזרקה דרך CDP לא הורצה מול Claude Desktop אמיתי.

## מה שצריך לקרות בסשן הלוקלי

1. להריץ את `install.ps1` (או `windows/claude-rtl.ps1 -Diagnose` תחילה).
2. לוודא ש-Claude נפתח, שהפורט נפתח, ושה-payload הוזרק.
3. לפתוח את Claude ולבדוק בעין: פסקה עברית, שורה שמתחילה באנגלית או במספר,
   רשימת בולטים, טבלה, ותיבת הכתיבה.
4. `claudeRtl.status()` בקונסולה מדווח מה קרה בפועל.
5. לתקן את מה שנשבר, לדחוף לענף — ה-PR מתעדכן לבד.

## נקודות כשל סבירות

- Electron עשוי להתעלם מ-`--remote-debugging-port`. אם `-Diagnose` מדווח שהפורט
  סגור בזמן ש-Claude רץ — זה מה שקרה, ואז שיטה 2 (`windows/patch-asar.js`) היא
  החלופה.
- `Get-PageTargets` מסנן `type -eq 'page'`. ייתכן שהחלון הרלוונטי מסוג אחר
  (`webview`), ואז אין יעד להזרקה למרות שהפורט פתוח.
- הבורר `[contenteditable="true"]` עשוי לא לתפוס את תיבת הכתיבה של Claude.
- Claude מגדיר `dir` בעצמו; `respectAppDir` חייב להישאר `false`.

## פקודות

```powershell
# אבחון לפני הכל
powershell -ExecutionPolicy Bypass -File windows\claude-rtl.ps1 -Diagnose

# הרצה
powershell -ExecutionPolicy Bypass -File windows\claude-rtl.ps1 -Watch

# בדיקות (דורש Node)
npm install
npm test
```
