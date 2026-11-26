
import { McpAgent } from "agents/mcp";
import { z } from "zod";

interface Env {
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_REF: string;
}

export class VideoDirector extends McpAgent<Env> {
  server = this.createMcpServer({
    name: "Cinematic Video Director",
    version: "0.2.0"
  });

  async init() {
    this.server.tool(
      "render_cinematic_video",
      "Membuat video MP4 cinematic dari naskah dan audio Google Drive.",
      {
        script: z.string().min(20).max(12000),
        audio_url: z.string().url(),
        title: z.string().max(100).optional(),
        visual_style: z.string().max(300).default(
          "premium cinematic motion design, warm gold and deep charcoal"
        ),
        aspect_ratio: z.enum(["9:16", "16:9", "1:1"]).default("9:16"),
        scenes: z.array(z.object({
          heading: z.string().max(80),
          caption: z.string().max(180),
          image_url: z.string().url().optional()
        })).min(1).max(12)
      },
      async ({ script, audio_url, title, visual_style, aspect_ratio, scenes }) => {
        const match = audio_url.match(/(?:\/d\/|id=)([a-zA-Z0-9_-]{10,})/);

        if (!match) {
          throw new Error("Gunakan link file Google Drive, bukan folder.");
        }

        const jobId = crypto.randomUUID();

        const payload = {
          event_type: "render_video",
          client_payload: {
            job_id: jobId,
            script,
            audio_url: `https://drive.google.com/uc?export=download&id=${match[1]}`,
            title: title ?? "Cinematic Video",
            visual_style,
            aspect_ratio,
            scenes
          }
        };

        const response = await fetch(
          `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/dispatches`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${this.env.GITHUB_TOKEN}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

        if (!response.ok) {
          throw new Error(
            `Gagal mengirim job ke GitHub: ${response.status} ${await response.text()}`
          );
        }

        return {
          content: [{
            type: "text",
            text: `Job video berhasil dikirim. ID: ${jobId}. Gunakan check_video_status untuk memeriksa hasil render.`
          }]
        };
      }
    );

    this.server.tool(
      "check_video_status",
      "Memeriksa apakah video MP4 sudah selesai dirender.",
      {
        job_id: z.string().uuid()
      },
      async ({ job_id }) => {
        const response = await fetch(
          `https://api.github.com/repos/${this.env.GITHUB_OWNER}/${this.env.GITHUB_REPO}/releases/tags/video-${job_id}`,
          {
            headers: {
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28"
            }
          }
        );

        if (response.status === 404) {
          return {
            content: [{
              type: "text",
              text: "Video masih diproses atau proses render belum berhasil. Periksa kembali beberapa menit lagi."
            }]
          };
        }

        if (!response.ok) {
          throw new Error(`Gagal memeriksa release: ${response.status}`);
        }

        const release = await response.json() as {
          assets: Array<{
            name: string;
            browser_download_url: string;
          }>;
        };

        const video = release.assets.find(
          asset => asset.name.endsWith(".mp4")
        );

        if (!video) {
          return {
            content: [{
              type: "text",
              text: "Release ditemukan, tetapi file MP4 belum tersedia."
            }]
          };
        }

        return {
          content: [{
            type: "text",
            text: `Video sudah selesai! Unduh MP4 di sini: ${video.browser_download_url}`
          }]
        };
      }
    );
  }
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return VideoDirector.serve("/mcp").fetch(request, env, ctx);
  }
};
