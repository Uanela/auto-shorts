import ffmpeg from 'ffmpeg';
import { emptyDir, ensureDir } from 'https://deno.land/std/fs/mod.ts';
import * as path from 'https://deno.land/std/path/mod.ts';
import { shorts } from './source.ts';

const videoFile = '2026-08-09_18-29-45.mp4';
const videoPath = path.join(Deno.cwd(), 'videos', videoFile);
const shortsPath = path.join(
  Deno.cwd(),
  'shorts',
  toKebabCase(videoFile.replace('.mp4', '')),
);

// --- Layout tuning knobs ---------------------------------------------------
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;
// ---------------------------------------------------------------------------

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

async function generateShorts() {
  try {
    await ensureDir(shortsPath);
    await emptyDir(shortsPath);

    for (const i in shorts) {
      const short = shorts[i];
      const kebabTitle = toKebabCase(short.title);

      const outputPath = path.join(
        shortsPath,
        `${Number(i) + 1}-${kebabTitle}.mp4`,
      );
      const duration = short.to - short.from;

      console.log(`Processing: ${short.title}`);
      console.log(`From ${short.from}s to ${short.to}s`);

      const video = await new ffmpeg(`${videoPath}`);
      const metadata = await video.metadata;

      const videoWidth = metadata.video.resolution.w;
      const videoHeight = metadata.video.resolution.h;

      const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;

      let sourceCropWidth: number;
      let sourceCropHeight: number;

      if (videoWidth / videoHeight > targetRatio) {
        sourceCropHeight = videoHeight;
        sourceCropWidth = Math.round(sourceCropHeight * targetRatio);
      } else {
        sourceCropWidth = videoWidth;
        sourceCropHeight = Math.round(sourceCropWidth / targetRatio);
      }

      const xOffset = Math.round((videoWidth - sourceCropWidth) / 2);
      const yOffset = Math.round((videoHeight - sourceCropHeight) / 2);
      const cropFilter = `crop=${sourceCropWidth}:${sourceCropHeight}:${xOffset}:${yOffset}`;

      const scaleFilter = `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}`;

      const filterComplex = `${cropFilter},${scaleFilter}`;

      video.addCommand('-ss', short.from.toString());
      video.addCommand('-t', duration.toString());
      video.addCommand('-filter_complex', filterComplex);
      video.addCommand('-c:v', 'libx264');
      video.addCommand('-crf', '18');
      video.addCommand('-preset', 'slow');
      video.addCommand('-c:a', 'aac');
      video.addCommand('-b:a', '128k');
      await video.save(outputPath);

      console.log(`✓ Created: ${outputPath}`);
    }

    console.log('All shorts generated successfully!');
  } catch (error) {
    console.error('Error generating shorts:', error);
  }
}

generateShorts();

