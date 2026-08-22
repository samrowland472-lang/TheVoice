import { useEffect, useRef } from "react";
import { drawDocument } from "@/lib/design/render";
import { instantiateTemplate, type Template } from "@/lib/design/templates";
import { fitViewport } from "@/lib/design/render";

export function TemplateThumb({ template, className }: { template: Template; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const doc = instantiateTemplate(template.id);
    const parent = canvas.parentElement;
    const w = parent?.clientWidth || 240;
    const h = parent?.clientHeight || 240;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const vp = fitViewport(doc.artboard.width, doc.artboard.height, w, h, 8);
    drawDocument(ctx, doc, vp, { dpr, skipChrome: true });
  }, [template.id]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
