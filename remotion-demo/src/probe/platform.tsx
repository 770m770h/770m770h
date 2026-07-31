import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { useHebrewFonts } from '../fonts';
import { ScenePlatform } from '../scenes/ScenePlatform';

const Wrapped: React.FC = () => {
  useHebrewFonts();
  return <ScenePlatform />;
};

const Root: React.FC = () => (
  <Composition
    id="Probe"
    component={Wrapped}
    durationInFrames={135}
    fps={30}
    width={1920}
    height={1080}
  />
);

registerRoot(Root);
