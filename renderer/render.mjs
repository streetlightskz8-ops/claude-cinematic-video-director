import fs from "node:fs";
import path from "node:path";
import {bundle} from "@remotion/bundler";
import {selectComposition, renderMedia, getAudioDurationInSeconds} from "@remotion/renderer";

const here = path.dirname(new URL(import.meta.url).pathname);
const inputProps = JSON.parse(fs.readFileSync(path.join(here, "public/scenes.json"), "utf8"));
const audioPath = path.join(here, "public/voiceover.mp3");
const audioSeconds = await getAudioDurationInSeconds(audioPath);
const fps = 30;
const durationInFrames = Math.max(30, Math.ceil(audioSeconds * fps));
const serveUrl = await bundle({entryPoint: path.join(here, "src/index.jsx")});
const selected = await selectComposition({serveUrl, id:"Main", inputProps});
const composition = {...selected, durationInFrames};
fs.mkdirSync(path.join(here, "../out"), {recursive:true});
await renderMedia({
  composition, serveUrl, codec:"h264", outputLocation:path.join(here, "../out/video.mp4"),
  inputProps, audioCodec:"aac", pixelFormat:"yuv420p", concurrency:2
});
console.log(`Rendered ${durationInFrames} frames (${audioSeconds.toFixed(2)} seconds).`);
