import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { useHebrewFonts } from '../fonts';
import { SceneLockup } from '../scenes/SceneLockup';

const Wrapped: React.FC = () => {
  useHebrewFonts();
  return <SceneLockup />;
};

const Root: React.FC = () => (
  <Composition
    id="Probe"
    component={Wrapped}
    durationInFrames={105}
    fps={30}
    width={1920}
    height={1080}
  />
);

registerRoot(Root);
