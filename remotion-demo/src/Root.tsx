import { Composition } from 'remotion';
import { FeatureDemo, featureDemoDefaultProps } from './FeatureDemo';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FeatureDemo"
      component={FeatureDemo}
      durationInFrames={180}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={featureDemoDefaultProps}
    />
  );
};
