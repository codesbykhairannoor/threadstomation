import React from 'react';
import { Composition } from 'remotion';
import { MotionGraphicDemo } from './MotionDemo.jsx';
import { MindsetTherapyDemo } from './MindsetTherapyDemo.jsx';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="MotionGraphicDemo"
        component={MotionGraphicDemo}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          badgeText: '@adhlil.co',
          scene1Frames: 150,
          scene2Frames: 180,
          scene3Frames: 120,
        }}
        calculateMetadata={async ({ props }) => {
          const s1 = props.scene1Frames || 150;
          const s2 = props.scene2Frames || 180;
          const s3 = props.scene3Frames || 120;
          return {
            durationInFrames: s1 + s2 + s3,
            props,
          };
        }}
      />

      <Composition
        id="MindsetTherapyDemo"
        component={MindsetTherapyDemo}
        durationInFrames={570}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          badgeText: '@adhlil.co',
          scene1Frames: 170,
          scene2Frames: 220,
          scene3Frames: 180,
        }}
        calculateMetadata={async ({ props }) => {
          const s1 = props.scene1Frames || 170;
          const s2 = props.scene2Frames || 220;
          const s3 = props.scene3Frames || 180;
          return {
            durationInFrames: s1 + s2 + s3,
            props,
          };
        }}
      />
    </>
  );
};


