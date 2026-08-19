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
const TOP_BAR_HEIGHT = 280;
const BOTTOM_BAR_HEIGHT = TOP_BAR_HEIGHT;
const BAR_COLOR = '0x020e2e';
const TITLE_BOTTOM_PADDING = 32;
const TEXT_WIDTH_FACTOR = 0.5;
const TEXT_SIDE_MARGIN = 16;
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;

// Video viewport: width fixed, height is whatever's left after the bars.
const CROP_WIDTH = OUTPUT_WIDTH;
const CROP_HEIGHT = OUTPUT_HEIGHT - TOP_BAR_HEIGHT - BOTTOM_BAR_HEIGHT;
// ---------------------------------------------------------------------------

if (CROP_HEIGHT <= 0) {
  throw new Error(
    'TOP_BAR_HEIGHT + BOTTOM_BAR_HEIGHT must be less than OUTPUT_HEIGHT',
  );
}

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

      // Crop a centered region from the real source, matching whatever
      // aspect ratio CROP_WIDTH:CROP_HEIGHT currently is, without ever
      // asking for more pixels than the source has.
      const targetRatio = CROP_WIDTH / CROP_HEIGHT;

      let sourceCropWidth: number;
      let sourceCropHeight: number;

      if (videoWidth / videoHeight > targetRatio) {
        sourceCropHeight = videoHeight;
        sourceCropWidth = Math.round(sourceCropHeight * targetRatio);
      } else {
        sourceCropWidth = videoWidth;
        sourceCropHeight = Math.round(sourceCropWidth / targetRatio);
      }

      sourceCropHeight = sourceCropHeight - 110;

      const xOffset = Math.round((videoWidth - sourceCropWidth) / 2);
      const yOffset = Math.round((videoHeight - sourceCropHeight) / 2);
      const cropFilter = `crop=${sourceCropWidth}:${sourceCropHeight}:${xOffset}:${yOffset}`;

      // Scale to fill the viewport exactly. The crop above already matches
      // this ratio, so this scale is uniform and never distorts.
      const scaleFilter = `scale=${CROP_WIDTH}:${CROP_HEIGHT}`;

      // Pad onto the full output canvas, adding bars top and bottom.
      const padFilter = `pad=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}:0:${TOP_BAR_HEIGHT}:color=${BAR_COLOR}`;

      const wrapText = (text: string, maxChars: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        let currentLine = '';

        for (const word of words) {
          const testLine = currentLine + word + ' ';
          if (testLine.length > maxChars && currentLine.length > 0) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.trim().length > 0) {
          lines.push(currentLine.trim());
        }
        return lines;
      };

      const fontSize = 52;
      const lineHeight = fontSize + fontSize / 4;

      // Derive max chars per line from the actual canvas width, so lines
      // use the full available width instead of an arbitrary fixed count.
      const availableTextWidth = OUTPUT_WIDTH - TEXT_SIDE_MARGIN * 2;
      const maxChars = Math.floor(
        availableTextWidth / (fontSize * TEXT_WIDTH_FACTOR),
      );

      const lines = wrapText(short.title, maxChars);
      const maxLineLength = Math.max(...lines.map((l) => l.length));
      const maxLine = 'O'.repeat(maxLineLength);

      // Title sits inside the top bar, bottom-aligned just above the video,
      // stacked upward, horizontally centered.
      const totalTextHeight = lines.length * lineHeight;
      const startY = TOP_BAR_HEIGHT - totalTextHeight - TITLE_BOTTOM_PADDING;

      function getBoxX(length: number) {
        const x = length * fontSize * TEXT_WIDTH_FACTOR;
        return Math.round((OUTPUT_WIDTH - x) / 2);
      }

      const boxFontSize = fontSize + 2;
      const boxLineHeight = fontSize + fontSize / 6;

      const textFilters = lines
        .map(
          (line, index) =>
            `drawtext=text='${maxLine}':fontcolor=${BAR_COLOR}:fontsize=${boxFontSize}:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${getBoxX(
              maxLine.length,
            )}:y=${
              startY + index * boxLineHeight + 8
            }:box=1:boxcolor=${BAR_COLOR},` +
            `drawtext=text='${line.replace(
              /'/g,
              "\\'",
            )}':fontcolor=white:fontsize=${fontSize}:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${getBoxX(
              line.length,
            )}:y=${startY + index * lineHeight + 8}:box=1:boxcolor=${BAR_COLOR}`,
        )
        .join(',');

      const filterComplex = `${cropFilter},${scaleFilter},${padFilter},${textFilters}`;

      video.addCommand('-ss', short.from.toString());
      video.addCommand('-t', duration.toString());
      video.addCommand('-filter_complex', filterComplex);
      video.addCommand('-c:v', 'libx264');
      video.addCommand('-crf', '18'); // visually lossless (17-20 range)
      video.addCommand('-preset', 'slow'); // better compression efficiency, same quality
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

