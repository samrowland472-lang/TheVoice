import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const layoutSchema = z.object({
  prompt: z.string().min(3).max(400),
  width: z.number(),
  height: z.number(),
  brandColors: z.array(z.string()).optional(),
});

export const magicLayout = createServerFn({ method: "POST" })
  .validator((input: unknown) => layoutSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available in this environment" };

    const colors = (data.brandColors ?? ["#0a0d0c", "#d9f5e3", "#3fc6ff"]).join(", ");
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 1200,
        messages: [
          {
            role: "system",
            content:
              "You are an art director. Return ONLY a JSON array of design nodes. Each node: {kind: rect|ellipse|text|star|polygon, name, x, y, w, h, rotation, fill (hex), stroke, strokeWidth, text?, fontFamily (Chakra Petch|Syne|Fraunces|Bebas Neue|Outfit|Share Tech Mono), fontWeight, fontSize, align (left|center|right), uppercase?, letterSpacing?, lineHeight?, opacity?, radius?}. Coordinates are in a canvas of the given size. Use 6-12 nodes. No markdown.",
          },
          {
            role: "user",
            content: `Artboard ${data.width}×${data.height}. Brand colors: ${colors}. Design: ${data.prompt}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    const raw = body.choices[0]?.message.content ?? "[]";
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]");
    if (jsonStart < 0 || jsonEnd < 0) return { ok: false as const, error: "Could not parse layout" };
    try {
      const nodes = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      return { ok: true as const, nodes };
    } catch {
      return { ok: false as const, error: "Could not parse layout" };
    }
  });

export const rewriteCopy = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ text: z.string().max(500), tone: z.string().max(40) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available" };
    const res = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-4.5",
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content: "Rewrite the copy for a graphic design. Keep it short. Return only the rewritten text, no quotes.",
          },
          { role: "user", content: `Tone: ${data.tone}. Copy:\n${data.text}` },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { choices: { message: { content: string } }[] };
    return { ok: true as const, text: (body.choices[0]?.message.content ?? "").trim() };
  });

export const generateFill = createServerFn({ method: "POST" })
  .validator((input: unknown) => z.object({ prompt: z.string().min(3).max(300) }).parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available" };
    const res = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-image",
        prompt: data.prompt,
        n: 1,
        resolution: "1k",
        response_format: "url",
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const body = (await res.json()) as { data: { url: string }[] };
    const url = body.data?.[0]?.url;
    if (!url) return { ok: false as const, error: "No image returned" };
    return { ok: true as const, url };
  });
