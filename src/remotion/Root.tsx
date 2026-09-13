import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {MomsRemotionComposition, MomsRemotionProps, MomsRenderFormat} from './MomsRemotionComposition';

type RenderProps = MomsRemotionProps & {
  durationSeconds: number;
  format: MomsRenderFormat;
};

const SPECS: Record<MomsRenderFormat, {width: number; height: number}> = {
  vertical: {width: 1080, height: 1920},
  landscape: {width: 1920, height: 1080},
  square: {width: 1080, height: 1080},
};

const Root: React.FC = () => (
  <Composition
    id="MomsSocial"
    component={MomsRemotionComposition}
    durationInFrames={30}
    fps={30}
    width={1080}
    height={1920}
    defaultProps={{
      videoUrl: '',
      title: 'MOMS Mobile Oil Change',
      subtitle: 'Mobile service. Done where you are.',
      showBranding: true,
      durationSeconds: 1,
      format: 'vertical' as MomsRenderFormat,
    } as RenderProps}
    calculateMetadata={({props}) => {
      const typed = props as RenderProps;
      const spec = SPECS[typed.format] || SPECS.vertical;
      return {
        durationInFrames: Math.max(30, Math.ceil(Math.max(1, typed.durationSeconds || 1) * 30)),
        width: spec.width,
        height: spec.height,
        fps: 30,
        props: typed,
      };
    }}
  />
);

registerRoot(Root);
