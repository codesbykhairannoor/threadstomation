import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import fs from 'fs';

async function run() {
  const interRegular = fs.readFileSync('./lib/fonts/Inter-Regular.ttf');
  
  // Create a dummy image with an off-white background and a dark square
  // Base64 1x1 off-white: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHwAHBgN/O8q3OQAAAABJRU5ErkJggg==
  // Base64 actual image
  
  const vdom = {
    type: 'div',
    props: {
      style: { display: 'flex', width: '500px', height: '500px', backgroundColor: '#ffffff', alignItems: 'center', justifyItems: 'center' },
      children: [
        {
          type: 'div',
          props: {
            style: { width: '200px', height: '200px', backgroundColor: '#f0f0f0', mixBlendMode: 'multiply' },
            children: 'Test'
          }
        }
      ]
    }
  };
  
  const svg = await satori(vdom, {
    width: 500,
    height: 500,
    fonts: [{ name: 'Inter', data: interRegular, weight: 400, style: 'normal' }],
  });
  
  console.log(svg.includes('mix-blend-mode'));
}

run();
