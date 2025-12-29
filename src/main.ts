import ffmpeg from "ffmpeg";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";

const shorts: { from: number; to: number; title: string }[] = [
  { from: 55, to: 125, title: "Perceba Que As Bênçãos Ja Estão Em Ti" },
  { from: 330, to: 450, title: "O Que É Ser Vigiar Segundo A Biblia" },
  {
    from: 630,
    to: 710,
    title: "O Que Acontece Quando Você Não Tem A Porta Da Guarda Restaurada",
  },
  {
    from: 775,
    to: 890,
    title: "Porquê Muitos Cristãos Estão Vulneráveis Hoje Em Dia",
  },
  {
    from: 980,
    to: 1050,
    title: "Entenda Como Você Deve Rejeitar Os Pensamentos Errados Do Inimigo",
  },
  {
    from: 1050,
    to: 1125,
    title: "Porque Muitos Desistem Da Igreja E Não Voltam",
  },
  { from: 1270, to: 1350, title: "Entenda O Que É Coração Segundo A Biblia" },
  {
    from: 1470,
    to: 1590,
    title: "O Que Acontece Quando Você Enfraquece No Espírito",
  },
  {
    from: 1750,
    to: 1867,
    title: "O Que Fazer Para Guardar Seu Coração Segundo Salmos 34 13",
  },
  {
    from: 2230,
    to: 2275,
    title: "Porquê O Diabo Coloca Imagens Pervetidas Na Sua Mente",
  },
  { from: 2410, to: 2520, title: "Entenda Como Quebrar Tentações Do Inimigo" },
  { from: 2570, to: 2690, title: "Como A Bíblia Interpreta A Palavra Guarda" },
  {
    from: 2870,
    to: 2980,
    title: "Entenda Porquê Os Seus Pastores São Seus Guardas",
  },
  {
    from: 3390,
    to: 3510,
    title:
      "Como Muitos Pais Deram Liberdades Aos Seus Filhos Que Não Deviam Dar",
  },
  {
    from: 3495,
    to: 3600,
    title: "Porquê Os Pais Não Devem Comprar Celulares Para Suas Crianças",
  },
];

const videoFile = "2025-12-28-20-13-05.mp4";
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

    for (const short of shorts) {
      const kebabTitle = toKebabCase(short.title);
      const shortFolder = path.join(shortsPath, kebabTitle);

      await ensureDir(shortFolder);

      const outputPath = path.join(shortFolder, `${kebabTitle}.mp4`);
      const duration = short.to - short.from;

      console.log(`Processing: ${short.title}`);
      console.log(`From ${short.from}s to ${short.to}s`);

      const video = await new ffmpeg(videoPath);
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
      const boxWidth = maxLineLength * 12;
      const lineHeight = 30;
      const startY = Math.round(cropHeight * 0.7);
      const boxX = Math.round((cropWidth - boxWidth) / 2);

      const textFilters = lines
        .map(
          (line, index) =>
            `drawtext=text='${line.replace(/'/g, "\\'")}':fontcolor=white:fontsize=20:x=${boxX + 8}:y=${startY + index * lineHeight + 8}:box=1:boxcolor=0x00008B@0.9:boxborderw=8:boxw=${boxWidth}:boxh=${lineHeight - 4}`
        )
        .join(",");

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
