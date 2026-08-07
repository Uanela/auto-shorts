import ffmpeg from "ffmpeg";
import { emptyDir, ensureDir } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const shorts: { from: number; to: number; title: string }[] = [
  { from: 2450, to: 2570, title: "Fé vem de uma promessa" },
  {
    from: 2490,
    to: 2595,
    title: "A fidelidade te leva a concretização do seu milagre",
  },
  {
    from: 2865,
    to: 2905,
    title: "Entenda o que precisas para Concretizar o seu propósito",
  },
  {
    from: 2990,
    to: 3040,
    title:
      "Entenda porque em Génesis diz que a voz do senhor passeava sobre o jardim",
  },
  {
    from: 3155,
    to: 3260,
    title: "Veja o que aconteceu quando Deus liberou a guerra contra Jó",
  },
  {
    from: 3240,
    to: 3290,
    title: "O que aconteceu com Jó ao fim da Guerra com o Diabo",
  },
  { from: 3305, to: 3376, title: "Veja Porquê Você Necessita Ser fiel a Deus" },
  {
    from: 3370,
    to: 3440,
    title: "Aprenda a ter fé através do senhor Jesus Cristo",
  },
  {
    from: 3710,
    to: 3810,
    title: "Entenda porque você deve agarrar-se a sua fé em Jesus Cristo",
  },
  { from: 3780, to: 3830, title: "Entenda Porque a Bíblia é Eterna" },
  {
    from: 3920,
    to: 3990,
    title: "Todos nos fomos enviados por Deus para um propósito",
  },
  { from: 4075, to: 4125, title: "Porquê parece que Deus te abandonou" },
  {
    from: 4180,
    to: 4230,
    title: "Porquê Jesus dormiu em meio a uma tempestade",
  },
  {
    from: 4375,
    to: 4440,
    title: "Porquê um homem rico subiu a figueira brava",
  },
  {
    from: 4555,
    to: 4650,
    title: "A uma Guerra entre você e seus objectivos. aprenda a clamar",
  },
  {
    from: 4855,
    to: 4905,
    title: "Veja Porquê Deus vai te levar para um Deserto",
  },
];

const videoFile = "2026-07-26_18-36-14.mp4";
const videoPath = path.join(Deno.cwd(), "videos", videoFile);
const shortsPath = path.join(Deno.cwd(), "shorts");

function toKebabCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function generateShorts() {
  try {
    await ensureDir(shortsPath);

    await emptyDir(shortsPath);
    for (const short of shorts) {
      const kebabTitle = toKebabCase(short.title);
      const shortFolder = path.join(shortsPath, kebabTitle);

      await ensureDir(shortFolder);

      const outputPath = path.join(shortFolder, `${kebabTitle}.mp4`);
      const duration = short.to - short.from;

      console.log(`Processing: ${short.title}`);
      console.log(`From ${short.from}s to ${short.to}s`);

      const video = await new ffmpeg(`${videoPath}`);
      const metadata = await video.metadata;

      const height = metadata.video.resolution.h;
      const width = Math.round((height * 9) / 16);

      const videoWidth = metadata.video.resolution.w;
      const videoHeight = metadata.video.resolution.h;
      const cropWidth = Math.round((videoHeight * 9) / 16);
      const cropHeight = videoHeight;
      const xOffset = Math.round((videoWidth - cropWidth) / 2);

      const cropFilter = `crop=${cropWidth}:${cropHeight}:${xOffset}:0`;

      // const cropFilter = `crop=${width}:${height}:in_w-${width}/2:0`;
      // const cropFilter = `crop=${height}:${width}:${Math.round((metadata.video.resolution.w - height) / 2)}:0`;
      // const textFilter = `drawtext=text=${short.title.replace(/\s/g, "\\ ")}:fontcolor=yellow:fontsize=60:x=(w-text_w)/2:y=${Math.round(height * 0.3)}:enable=between\\t\\,0\\,10\\`;
      const wrapText = (text: string, maxChars: number = 20): string[] => {
        const words = text.split(" ");
        let lines: string[] = [];
        let currentLine: string = "";

        for (const word of words) {
          const testLine = currentLine + word + " ";
          if (testLine.length > maxChars && currentLine.length > 0) {
            lines.push(currentLine.trim());
            currentLine = word + " ";
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.trim().length > 0) {
          lines.push(currentLine.trim());
        }
        return lines;
      };

      const lines = wrapText(short.title);
      const maxLineLength = Math.max(...lines.map((l) => l.length));
      const maxLine = (() => {
        let line = "";
        for (let i = 0; i < maxLineLength; i++) {
          line += "O";
        }

        return line;
      })();
      const startY = Math.round(cropHeight * 0.7);
      const fontSize = 24;
      const lineHeight = fontSize + fontSize / 6;

      function getBoxX(length: number) {
        const x = length * ((fontSize * 62.5) / 100);
        return Math.round((cropWidth - x) / 2);
      }

      const boxFontSize = fontSize + 2;
      const boxLineHeight = fontSize + fontSize / 6;

      const textFilters = lines
        .map(
          (line, index) =>
            `drawtext=text='${maxLine}':fontcolor=0x041a51:fontsize=${boxFontSize}:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${
              getBoxX(maxLine?.length!)
            }:y=${
              startY + index * boxLineHeight + 8
            }:box=1:boxcolor=0x041a51,` +
            `drawtext=text='${
              line.replace(/'/g, "\\'")
            }':fontcolor=white:fontsize=${fontSize}:fontfile='/System/Library/Fonts/Supplemental/Tahoma Bold.ttf':x=${
              getBoxX(line.length)
            }:y=${startY + index * lineHeight + 8}:box=1:boxcolor=0x041a51`,
        )
        .join(",");

      // const textFilters = lines
      //   .map(
      //     (line, index) =>
      //       `drawtext=text='${line.replace(/'/g, "\\'")}':fontcolor=white:fontsize=20:x=${boxX + 8}:y=${startY + index * lineHeight + 8}:box=1:boxcolor=0x00008B@0.9:boxborderw=8:boxw=${boxWidth}:boxh=${lineHeight - 4}`
      //   )
      //   .join(",");

      const filterComplex = `${cropFilter},${textFilters}`;
      // const filterComplex = `${cropFilter}`;

      video.addCommand("-ss", short.from.toString());
      video.addCommand("-t", duration.toString());
      video.addCommand("-filter_complex", filterComplex);
      video.addCommand("-c:a", "copy");

      await video.save(outputPath);

      console.log(`✓ Created: ${outputPath}`);
    }

    console.log("All shorts generated successfully!");
  } catch (error) {
    console.error("Error generating shorts:", error);
  }
}

generateShorts();
