import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { useHebrewFonts } from '../fonts';
import { SceneOverload } from '../scenes/SceneOverload';

const Wrapped: React.FC = () => {
  useHebrewFonts();
  return <SceneOverload />;
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
