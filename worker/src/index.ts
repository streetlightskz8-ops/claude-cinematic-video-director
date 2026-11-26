import { McpAgent } from "agents/mcp";
import { z } from "zod";

interface Env {
  VIDEO_BUCKET: R2Bucket;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_REF: string;
  DOWNLOAD_BASE_URL: string;
}

export class VideoDirector extends McpAgent<Env> {
  server = this.createMcpServer({ name: "Cinematic Video Director", version: "0.1.0" });

  async init() {
    this.server.tool(
      "render_cinematic_video",
      "Kirim naskah dan voice-over Google Drive ke renderer untuk dibuat menjadi MP4 cinematic.",
      {
        script: z.string().min(20).max(12000),
        audio_url: z.string().url().describe("Link file MP3 Google Drive yang bisa diakses siapa saja yang memiliki link"),
        title: z.string().max(100).optional(),
        visual_style: z.string().max(300).default("premium cinematic motion design, warm gold and deep charcoal"),
        aspect_ratio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
        scenes: z.array(z.object({
          heading: z.string().max(80),
          caption: z.string().max(180),
          image_url: z.string().url().optional()
        })).min(1).max(12)
      },
      async ({ script, audio_url, title, visual_style, aspect_ratio, scenes }) => {
        const idMatch = audio_url.match(/(?:\\/d\\/|id=)([a-zA-Z0-9_-]{10,})/);
        if (!idMatch) throw new Error("Link Google Drive tidak dikenali. Gunakan link file, bukan folder.");
        const fileId = idMatch[1];
        const directAudioUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        const jobId = crypto.randomUUID();
        const jobPayload = {
          job_id: jobId, script, audio_url: directAudioUrl,
          title: title ?? "Cinematic Video", visual_style, aspect_ratio, scenes
        };
        await this.env.VIDEO_BUCKET.put(`${jobId}.json`, JSON.stringify(jobPayload), {
          httpMetadata: { contentType: "application/json" }
        });
        const payload = {
          event_type: "render_video",
          client_payload: { job_id: jobId }
        };
        const dispatch = await fetch(
          `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/dispatches`,
          {
            method:"POST",
            headers:{
              "Authorization":`Bearer ${this.env.GITHUB_TOKEN}`,
              "Accept":"application/vnd.github+json",
              "X-GitHub-Api-Version":"2022-11-28",
              "Content-Type":"application/json",
              "User-Agent":"claude-cinematic-video-director"
            },
            body:JSON.stringify(payload)
          }
        );
        if (!dispatch.ok) throw new Error(`GitHub dispatch gagal (${dispatch.status}): ${await dispatch.text()}`);
        return {content:[{type:"text",text:`Job render dibuat dengan ID ${jobId}. Untuk mengecek hasilnya, panggil tool check_video_status dengan job_id "${jobId}".`}]};
      }
    );

    this.server.tool(
      "check_video_status",
      "Periksa apakah render MP4 sudah selesai dan berikan tautan unduhan.",
      { job_id: z.string().uuid() },
      async ({job_id}) => {
        const object = await this.env.VIDEO_BUCKET.head(`${job_id}.mp4`);
        if (!object) return {content:[{type:"text",text:`Video ${job_id} masih diproses atau gagal. Coba periksa lagi beberapa menit.`}]};
        return {content:[{type:"text",text:`Video selesai. Unduh MP4 di ${this.env.DOWNLOAD_BASE_URL}/video/${job_id}.mp4`}]};
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/video/")) {
      return (async () => {
        const key = url.pathname.slice("/video/".length);
        if (!/^[a-f0-9-]+\\.mp4$/i.test(key)) return new Response("Not found", {status:404});
        const obj = await env.VIDEO_BUCKET.get(key);
        if (!obj) return new Response("Video belum tersedia", {status:404});
        return new Response(obj.body, {headers:{
          "Content-Type":"video/mp4",
          "Content-Disposition":`attachment; filename="${key}"`,
          "Cache-Control":"private, max-age=300"
        }});
      })();
    }
    return VideoDirector.serve("/mcp").fetch(request, env, ctx);
  }
};
