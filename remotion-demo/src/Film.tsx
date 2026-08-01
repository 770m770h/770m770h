import React from 'react';
import { AbsoluteFill } from 'remotion';
import { TransitionSeries, linearTiming, springTiming } from '@remotion/transitions';
import { fade } from '@remotion/transitions/fade';
import { wipe } from '@remotion/transitions/wipe';
import { slide } from '@remotion/transitions/slide';

import { useHebrewFonts } from './fonts';
import { C } from './theme';
import { SceneArrival } from './scenes/SceneArrival';
import { SceneOverload } from './scenes/SceneOverload';
import { ScenePlatform } from './scenes/ScenePlatform';
import { SceneHuman } from './scenes/SceneHuman';
import { SceneLockup } from './scenes/SceneLockup';

/**
 * הסרט המלא — חמש סצנות, כל אחת בשפה חזותית וקומפוזיציה משלה,
 * מחוברות במעברים (ולא בחיתוכים לינאריים אחידים).
 *
 *   1. הבוקר      — שוט רחב, עיר עם שחר, דמות בהליכה
 *   2. העומס      — פנים, קלוז' על שולחן, סופת ניירת
 *   3. הפלטפורמה  — שדה גרפי איזומטרי, סדר מתוך הכאוס
 *   4. אנשים      — קלוז' חם שנפתח לצוות שלם
 *   5. נעילת מותג — לוגו, טאגליין, החיים ממשיכים ברקע
 */

export const SCENE_FRAMES = {
  arrival: 105,
  overload: 105,
  platform: 135,
  human: 150,
  lockup: 105,
} as const;

export const TRANSITION_FRAMES = 18;

/** אורכי המעברים בפועל — לא כולם זהים, ולכן חייבים להיסכם בנפרד. */
export const TRANSITIONS = {
  arrivalToOverload: TRANSITION_FRAMES,
  overloadToPlatform: 22,
  platformToHuman: 20,
  humanToLockup: TRANSITION_FRAMES,
} as const;

/**
 * משך הסרט = סכום הסצנות פחות חפיפות המעברים.
 * חשוב: לסכום את המעברים בפועל ולא להכפיל אחד מהם — אחרת נוצרת זנב
 * של פריימים ריקים אחרי שהסצנה האחרונה נגמרה.
 */
export const FILM_DURATION =
  Object.values(SCENE_FRAMES).reduce((a, b) => a + b, 0) -
  Object.values(TRANSITIONS).reduce((a, b) => a + b, 0);

export const Film: React.FC = () => {
  useHebrewFonts();

  return (
    <AbsoluteFill style={{ backgroundColor: C.paper }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.arrival}>
          <SceneArrival />
        </TransitionSeries.Sequence>

        {/* הבוקר → העומס: דיזולב רך, המשך של אותו יום */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.overload}>
          <SceneOverload />
        </TransitionSeries.Sequence>

        {/* העומס → הפלטפורמה: ניגוב — נקודת המפנה של הסרט */}
        <TransitionSeries.Transition
          presentation={wipe({ direction: 'from-right' })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITIONS.overloadToPlatform })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.platform}>
          <ScenePlatform />
        </TransitionSeries.Sequence>

        {/* הפלטפורמה → אנשים: הסטה, מהמערכת אל בני האדם */}
        <TransitionSeries.Transition
          presentation={slide({ direction: 'from-left' })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITIONS.platformToHuman })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.human}>
          <SceneHuman />
        </TransitionSeries.Sequence>

        {/* אנשים → נעילה: דיזולב שקט */}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />

        <TransitionSeries.Sequence durationInFrames={SCENE_FRAMES.lockup}>
          <SceneLockup />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
