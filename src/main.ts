import { emptyDir, ensureDir } from 'https://deno.land/std/fs/mod.ts';
import * as path from 'https://deno.land/std/path/mod.ts';

import { shorts } from './source.ts';

const videoFile = '2026-08-22_13-03-58.mp4';

const videoPath = path.resolve(path.join(
  'C:\\Users\\PENIEL 1\\Videos',
  videoFile,
));

console.log(videoPath)

const shortsPath = path.join(
  Deno.cwd(),
  'shorts',
  toKebabCase(videoFile.replace(/\.mp4$/i, '')),
);

const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;

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

    // Check that the input file exists
    try {
      await Deno.stat(videoPath);
    } catch {
      throw new Error(`Video file not found: ${videoPath}`);
    }

    // Get video metadata using ffprobe
    const probe = new Deno.Command('ffprobe', {
      args: [
        '-v',
        'error',
        '-select_streams',
        'v:0',
        '-show_entries',
        'stream=width,height',
        '-of',
        'csv=s=x:p=0',
        videoPath,
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    const probeResult = await probe.output();

    if (!probeResult.success) {
      const error = new TextDecoder().decode(probeResult.stderr);
      throw new Error(`ffprobe failed: ${error}`);
    }

    const resolution = new TextDecoder()
      .decode(probeResult.stdout)
      .trim();

    const [videoWidth, videoHeight] = resolution
      .split('x')
      .map(Number);

    if (!videoWidth || !videoHeight) {
      throw new Error(`Could not determine video resolution: ${resolution}`);
    }

    console.log(`Input: ${videoPath}`);
    console.log(`Resolution: ${videoWidth}x${videoHeight}`);
    console.log(`Output directory: ${shortsPath}`);

    const targetRatio = OUTPUT_WIDTH / OUTPUT_HEIGHT;

    let sourceCropWidth: number;
    let sourceCropHeight: number;

    if (videoWidth / videoHeight > targetRatio) {
      sourceCropHeight = videoHeight;
      sourceCropWidth = Math.round(
        sourceCropHeight * targetRatio,
      );
    } else {
      sourceCropWidth = videoWidth;
      sourceCropHeight = Math.round(
        sourceCropWidth / targetRatio,
      );
    }

    const xOffset = Math.round(
      (videoWidth - sourceCropWidth) / 2,
    );

    const yOffset = Math.round(
      (videoHeight - sourceCropHeight) / 2,
    );

    const filter = [
      `crop=${sourceCropWidth}:${sourceCropHeight-110}:${xOffset}:${yOffset}`,
      `scale=${OUTPUT_WIDTH}:${OUTPUT_HEIGHT}`,
    ].join(',');

    for (const [i, short] of shorts.entries()) {
      const kebabTitle = toKebabCase(short.title);

      const outputPath = path.join(
        shortsPath,
        `${i + 1}-${kebabTitle}.mp4`,
      );

      const duration = short.to - short.from;

      console.log('');
      console.log(`Processing: ${short.title}`);
      console.log(`From ${short.from}s to ${short.to}s`);
      console.log(`Output: ${outputPath}`);

      const command = new Deno.Command('ffmpeg', {
        args: [
          '-y',

          // Input
          '-ss',
          short.from.toString(),
          '-i',
          videoPath,

          // Duration
          '-t',
          duration.toString(),

          // Video
          '-vf',
          filter,
          '-c:v',
          'libx264',
          '-crf',
          '18',
          '-preset',
          'slow',

          // Audio
          '-c:a',
          'aac',
          '-b:a',
          '128k',

          // Output
          outputPath,
        ],

        stdout: 'piped',
        stderr: 'piped',
      });

      const result = await command.output();

      if (!result.success) {
        const error = new TextDecoder().decode(result.stderr);

        console.error(error);

        throw new Error(
          `FFmpeg failed while processing "${short.title}"`,
        );
      }

      console.log(`✓ Created: ${outputPath}`);
    }

    console.log('');
    console.log('All shorts generated successfully!');
  } catch (error) {
    console.error('Error generating shorts:', error);
  }
}

generateShorts();
