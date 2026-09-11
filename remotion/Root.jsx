import React from 'react';
import { Composition } from 'remotion';
import { MotionGraphicDemo } from './MotionDemo.jsx';
import { MindsetTherapyDemo } from './MindsetTherapyDemo.jsx';

import { DynamicMindsetVideo } from './DynamicMindsetVideo.jsx';
import { RiskToRichExact } from './RiskToRichExact.jsx';
import { ConfidenceVsEgoExact } from './ConfidenceVsEgoExact.jsx';
import { TranvasFlipVideo, TranvasChaosToStructureVideo } from './TranvasVisualMetaphors.jsx';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TranvasFlipVideo"
        component={TranvasFlipVideo}
        durationInFrames={190} // ~6.33 seconds
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          fromWord: 'BUSY',
          toWord: 'CALM',
          watermark: '@tranvas',
        }}
      />

      <Composition
        id="TranvasChaosToStructureVideo"
        component={TranvasChaosToStructureVideo}
        durationInFrames={190} // ~6.33 seconds
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          watermark: '@tranvas',
        }}
      />
      <Composition
        id="RiskToRichExact"
        component={RiskToRichExact}
        durationInFrames={190} // ~6.33 seconds
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          watermark: '@adhlil.co',
        }}
      />

      <Composition
        id="ConfidenceVsEgoExact"
        component={ConfidenceVsEgoExact}
        durationInFrames={190} // ~6.33 seconds
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="DynamicMindsetVideo"
        component={DynamicMindsetVideo}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          slides: [],
          badgeText: '@adhlil.co',
          sceneDurationsInFrames: [],
        }}
        calculateMetadata={async ({ props }) => {
          const sceneDurations = props.sceneDurationsInFrames || [];
          const totalFrames = sceneDurations.length > 0
            ? sceneDurations.reduce((a, b) => a + b, 0)
            : (props.slides?.length || 3) * 150;
          return {
            durationInFrames: Math.max(30, totalFrames),
            props,
          };
        }}
      />

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


