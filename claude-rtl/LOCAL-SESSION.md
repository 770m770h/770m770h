# מעבר לסשן לוקלי

הפרויקט נבנה בסשן ענן ללא גישה למחשב. סשן לוקלי ב-30.8.2026 הריץ אותו לראשונה
על Windows אמיתי. מה שלמטה מתעד מה נמצא ומה תוקן.

## הקשר

- **מטרה:** תצוגת עברית מימין לשמאל ב-Claude Desktop, כולל שורות שמערבבות אנגלית.
- **מערכת:** Windows 11. המשתמש אינו מפתח — צריך הוראות קונקרטיות.
- **מצב:** הענף `claude/hebrew-rtl-display-z6f81n`, PR #3, לא מוזג. `main` ריק
  מהתוכן הזה.

## מה שנמצא בסשן הלוקלי (30.8.2026)

### Claude Desktop כאן הוא גרסת Microsoft Store / MSIX

זו הנקודה שמשנה הכל. הקוד נכתב לגרסת ההתקנה הישנה (Squirrel/NSIS ב-
`%LOCALAPPDATA%\AnthropicClaude\app-x.y.z\claude.exe`). המכונה הזאת מריצה את
גרסת ה-Store:

```
C:\Program Files\WindowsApps\Claude_1.37937.3.0_x64__pzs8sxrjxfjjc\app\Claude.exe
AUMID: Claude_pzs8sxrjxfjjc!Claude
```

מכאן נגזרו הבעיות והתיקונים:

1. **המשגר לא מצא את Claude בכלל.** `Find-ClaudeExe` חיפש רק בתיקיות
   `AnthropicClaude`/`Claude` — לא ב-`WindowsApps`. **תוקן:** זיהוי דרך
   `Get-AppxPackage` נוסף וקודם בעדיפות.

2. **המשגר היה הורג את Claude Code CLI.** `Get-Process -Name claude` תופס גם
   את ה-Desktop וגם את ה-CLI (שם קובץ זהה). ריסטרט היה סוגר סשנים של CLI.
   **תוקן:** `Get-ClaudeDesktopProcess` מסנן לפי נתיב ההתקנה, אז ה-CLI אף פעם
   לא נכלל.

3. **שיטה 2 (patch-asar) חסומה כאן, סופית.** ה-fuses של הבינארי:
   `OnlyLoadAppFromAsar=enabled` ו-`EnableEmbeddedAsarIntegrityValidation=enabled`,
   ותיקיית `resources` תחת `WindowsApps` היא **לקריאה בלבד** (Access denied).
   שני חסמים בלתי-תלויים. `node windows\patch-asar.js check` מדווח על זה נכון
   עכשיו (זיהוי MSIX נוסף) ומפנה למשגר. **בגרסת Store — רק שיטה 1 רלוונטית.**

### מה שנבדק ועובד

- **56 בדיקות עוברות.**
- **ה-payload נבדק בדפדפן Chromium אמיתי** (לא רק jsdom) מול DOM שמדמה את
  Claude. כל המקרים שהמשתמש ביקש עברו: פסקה עברית → RTL; שורה שמתחילה ב-
  `Next.js` → RTL; שורה שמתחילה במספר → RTL; שורה עברית עם `code` בתוכה → RTL;
  רשימת בולטים (כולל תיקון ה-`padding-left` הפיזי → מועבר לימין); רשימה
  ממוספרת; טבלה → RTL; בלוקקוד → נשאר LTR; תיבת הכתיבה → מכולה ושורות עבריות
  RTL, שורה אנגלית לגמרי LTR. מתג הכיבוי/הדלקה מחזיר למצב המקורי נקי (25 מסומנים
  → 0 בכיבוי → 25 בהדלקה).

### מה שלא ניתן לבדוק מכאן — ולמה

**האם הפורט נפתח על גרסת MSIX** לא נבדק בפועל, ולא במקרה: **סשן ה-Claude Code
הזה רץ בתוך Claude Desktop** (תהליך ה-Desktop הראשי הוא ההורה של הסשן). המשגר
חייב לסגור את Claude לגמרי כדי לפתוח את פורט הניפוי בהפעלה קרה — וסגירת Claude
Desktop הורגת את הסשן הזה. לכן החוליה האחרונה נבדקת רק כשהמשתמש מריץ בעצמו.

מה שכן נמדד: הפעלת ה-exe בזמן ש-Claude רץ **לא** פותחת פורט — היא מנותבת
למופע הקיים ומתה מיד (single-instance), גם עם `--user-data-dir` נפרד. מכאן
שהפורט יכול להיפתח **רק בהפעלה קרה**, וזה בדיוק מה שהמשגר עושה (סוגר → מפעיל
מחדש עם הדגל). `EnableNodeCliInspectArguments` כבוי נוגע ל-`--inspect` בלבד,
לא ל-`--remote-debugging-port`, אז אין סיבה ידועה שהפורט חסום.

## איך המשתמש בודק (מריץ פעם אחת, זה מה שסוגר ופותח את Claude)

```powershell
powershell -ExecutionPolicy Bypass -File windows\claude-rtl.ps1 -Diagnose   # אבחון
powershell -ExecutionPolicy Bypass -File windows\claude-rtl.ps1 -Watch      # הפעלה
```

`-Watch` ישאל אישור לסגור ולפתוח מחדש את Claude, יזריק, וידווח `RTL injected`.
אם הפורט לא נפתח תוך 45 שנ' — זה הסימן שגרסת ה-MSIX חוסמת ניפוי, ואז החלופה
היחידה היא ה-userscript לדפדפן (claude.ai), כי שיטה 2 חסומה.

## נקודות כשל שנותרו רלוונטיות

- `Get-PageTargets` הורחב לקבל `page` וגם `webview` (החלון של Claude עלול להיות
  webview). עדיין לא נצפה מול פורט חי.
- אם `-Diagnose` מראה פורט פתוח אבל `Page targets: 0` — זה מקרה ה-webview, וכעת
  הוא אמור להיתפס.
