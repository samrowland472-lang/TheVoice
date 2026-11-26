import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const layoutSchema = z.object({
  prompt: z.string().min(3).max(400),
  width: z.number(),
  height: z.number(),
  brandColors: z.array(z.string()).optional(),
  displayFont: z.string().optional(),
  bodyFont: z.string().optional(),
});

const layoutNodeSchema = z
  .object({
    kind: z.enum(["rect", "ellipse", "text", "star", "polygon", "line", "arrow"]),
    name: z.string().max(80).optional(),
    x: z.coerce.number(),
    y: z.coerce.number(),
    w: z.coerce.number().positive().max(8000),
    h: z.coerce.number().positive().max(8000),
    rotation: z.coerce.number().optional(),
    fill: z.string().optional(),
    stroke: z.string().optional(),
    strokeWidth: z.coerce.number().optional(),
    text: z.string().max(400).optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.coerce.number().optional(),
    fontSize: z.coerce.number().optional(),
    align: z.enum(["left", "center", "right"]).optional(),
    uppercase: z.boolean().optional(),
    letterSpacing: z.coerce.number().optional(),
    lineHeight: z.coerce.number().optional(),
    opacity: z.coerce.number().min(0).max(1).optional(),
    radius: z.coerce.number().optional(),
  });

const layoutNodesSchema = z.array(layoutNodeSchema).min(1).max(16);

export type MagicNode = {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  name?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontFamily?: string;
  fontWeight?: number;
  fontSize?: number;
  align?: string;
  uppercase?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  opacity?: number;
  radius?: number;
  rotation?: number;
};

function toMagic(n: z.infer<typeof layoutNodeSchema>): MagicNode {
  return {
    kind: n.kind,
    x: n.x,
    y: n.y,
    w: n.w,
    h: n.h,
    name: n.name,
    fill: n.fill,
    stroke: n.stroke,
    strokeWidth: n.strokeWidth,
    text: n.text,
    fontFamily: n.fontFamily,
    fontWeight: n.fontWeight,
    fontSize: n.fontSize,
    align: n.align,
    uppercase: n.uppercase,
    letterSpacing: n.letterSpacing,
    lineHeight: n.lineHeight,
    opacity: n.opacity,
    radius: n.radius,
    rotation: n.rotation,
  };
}

export const magicLayout = createServerFn({ method: "POST" })
  .validator((input: unknown) => layoutSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.XAI_API_KEY;
    if (!apiKey) return { ok: false as const, error: "AI is not available in this environment" };

    const colors = (data.brandColors ?? ["#0a0d0c", "#d9f5e3", "#3fc6ff"]).join(", ");
    const display = data.displayFont ?? "Chakra Petch";
    const body = data.bodyFont ?? "Outfit";
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
              `You are an art director. Return ONLY a JSON array of 6-12 design nodes. Schema per node: {kind: rect|ellipse|text|star|polygon|line|arrow, name, x, y, w, h, rotation, fill (hex), stroke, strokeWidth, text?, fontFamily (${display}|${body}|Syne|Fraunces|Bebas Neue|Share Tech Mono), fontWeight, fontSize, align (left|center|right), uppercase?, letterSpacing?, lineHeight?, opacity?, radius?}. Coordinates fit the given artboard. Prefer ${display} for headlines and ${body} for supporting copy. No markdown.`,
          },
          {
            role: "user",
            content: `Artboard ${data.width}×${data.height}. Brand colors: ${colors}. Design: ${data.prompt}`,
          },
        ],
      }),
    });
    if (!res.ok) return { ok: false as const, error: `xAI API error ${res.status}` };
    const bodyJson = (await res.json()) as { choices: { message: { content: string } }[] };
    const raw = bodyJson.choices[0]?.message.content ?? "[]";
    const jsonStart = raw.indexOf("[");
    const jsonEnd = raw.lastIndexOf("]");
    if (jsonStart < 0 || jsonEnd < 0) return { ok: false as const, error: "Could not parse layout" };
    try {
      const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
      const nodes = layoutNodesSchema.parse(parsed).map(toMagic);
      return { ok: true as const, nodes };
    } catch {
      return { ok: false as const, error: "Layout did not match schema" };
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
