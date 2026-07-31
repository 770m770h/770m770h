import React from 'react';
import { Composition } from 'remotion';
import { AbsoluteFill } from 'remotion';

/** זמני — מוחלף בהרכבת הסרט המלאה לאחר שכל הסצנות מוכנות. */
const Placeholder: React.FC = () => <AbsoluteFill style={{ backgroundColor: '#ECE4D3' }} />;

export const RemotionRoot: React.FC = () => (
  <Composition id="Film" component={Placeholder} durationInFrames={60} fps={30} width={1920} height={1080} />
);
