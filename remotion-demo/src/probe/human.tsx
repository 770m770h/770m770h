import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { useHebrewFonts } from '../fonts';
import { SceneHuman } from '../scenes/SceneHuman';

const Wrapped: React.FC = () => {
  useHebrewFonts();
  return <SceneHuman />;
};

const Root: React.FC = () => (
  <Composition
    id="Probe"
    component={Wrapped}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
);

registerRoot(Root);
