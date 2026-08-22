import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Copy, Plus, Search, Trash2 } from "lucide-react";
import { FORMATS } from "@/lib/design/formats";
import { imageNode } from "@/lib/design/node-factory";
import { useDesign } from "@/lib/design/store";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/design/templates";
import { Button } from "@/components/ui/button";
import { CommandPalette, type CommandItem } from "@/components/studio/command-palette";
import { TemplateThumb } from "@/components/template-thumb";
import { cn } from "@/lib/utils";

export function HubView() {
  const navigate = useNavigate();
  const hydrate = useDesign((s) => s.hydrate);
  const index = useDesign((s) => s.index);
  const fromTemplate = useDesign((s) => s.fromTemplate);
  const fromBlank = useDesign((s) => s.fromBlank);
  const remove = useDesign((s) => s.remove);
  const brand = useDesign((s) => s.brand);
  const setBrand = useDesign((s) => s.setBrand);
  const duplicateProject = useDesign((s) => s.duplicateProject);
  const paletteOpen = useDesign((s) => s.paletteOpen);
  const setPaletteOpen = useDesign((s) => s.setPaletteOpen);
  const [cat, setCat] = useState("All");
  const [formatId, setFormatId] = useState("ig-post");
  const [newColor, setNewColor] = useState("#3fc6ff");
  const [q, setQ] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!useDesign.getState().paletteOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  const templates = useMemo(() => {
    const s = q.trim().toLowerCase();
    return TEMPLATES.filter((t) => (cat === "All" || t.category === cat) && (!s || `${t.name} ${t.description} ${t.category}`.toLowerCase().includes(s)));
  }, [cat, q]);

  function openTemplate(id: string) {
    const docId = fromTemplate(id);
    void navigate({ to: "/studio/$id", params: { id: docId } });
  }

  function openBlank() {
    const docId = fromBlank(formatId);
    void navigate({ to: "/studio/$id", params: { id: docId } });
  }

  function openProject(id: string) {
    void navigate({ to: "/studio/$id", params: { id } });
  }

  const commands = useMemo<CommandItem[]>(() => {
    return [
      { id: "blank", label: `New ${FORMATS.find((f) => f.id === formatId)?.label ?? "artboard"}`, group: "Create", hint: "N", run: openBlank },
      ...TEMPLATES.map((t) => ({
        id: `t-${t.id}`,
        label: t.name,
        group: t.category,
        hint: t.formatId,
        run: () => openTemplate(t.id),
      })),
      ...index.slice(0, 12).map((p) => ({
        id: `p-${p.id}`,
        label: p.name,
        group: "Recent",
        run: () => openProject(p.id),
      })),
    ];
  }, [formatId, index]);

  return (
    <div className="min-h-0 flex-1 overflow-auto scrollbar-thin">
      <header className="border-b border-border px-5 py-6 md:px-10 md:py-10">
        <p className="font-mono text-[11px] tracking-[0.28em] text-phosphor uppercase">The Voice · Design</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.03em] text-ink md:text-6xl">
          Artboard. Paint. Press.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-dim">
          Layouts with type, layers, and a real brush engine — posters, covers, stories, and marks that
          hold a room. Stay in the loop: ⌘K for anything, drop an image, export at 3×.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select
            value={formatId}
            onChange={(e) => setFormatId(e.target.value)}
            className="h-10 rounded-[12px] border border-border bg-surface-alt px-3 text-sm text-ink"
            aria-label="Artboard size"
          >
            {FORMATS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label} · {f.width}×{f.height}
              </option>
            ))}
          </select>
          <Button variant="primary" onClick={openBlank}>
            <Plus className="size-4" />
            New artboard
          </Button>
          <Button onClick={() => setPaletteOpen(true)}>
            <Search className="size-4" />
            Command
          </Button>
        </div>
        <label className="relative mt-6 block max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search templates"
            className="h-11 w-full rounded-[12px] border border-border bg-surface-alt pr-3 pl-10 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-phosphor"
          />
        </label>
      </header>

      {index.length > 0 && (
        <section className="border-b border-border px-5 py-8 md:px-10">
          <h2 className="text-sm font-medium tracking-[0.16em] text-ink-dim uppercase">Recent</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {index.slice(0, 10).map((p) => (
              <article key={p.id} className="group relative">
                <button
                  type="button"
                  onClick={() => openProject(p.id)}
                  className="block w-full overflow-hidden rounded-[16px] border border-border bg-surface text-left transition-colors hover:border-phosphor"
                >
                  <div className="aspect-[4/5] bg-surface-alt">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center font-mono text-xs text-ink-faint">
                        {p.width}×{p.height}
                      </div>
                    )}
                  </div>
                  <div className="px-3 py-2">
                    <div className="truncate text-sm text-ink">{p.name}</div>
                    <div className="font-mono text-[10px] text-ink-faint uppercase">{p.formatId}</div>
                  </div>
                </button>
                <div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-[8px] border border-border bg-ground/80 text-ink-dim hover:text-ink"
                    onClick={() => duplicateProject(p.id)}
                    aria-label={`Duplicate ${p.name}`}
                  >
                    <Copy className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center rounded-[8px] border border-border bg-ground/80 text-ink-dim hover:text-alert"
                    onClick={() => remove(p.id)}
                    aria-label={`Delete ${p.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section id="brand" className="border-b border-border px-5 py-8 md:px-10">
        <h2 className="text-sm font-medium tracking-[0.16em] text-ink-dim uppercase">Brand kit</h2>
        <p className="mt-2 max-w-xl text-sm text-ink-dim">
          Colours ride with every new layout. Click a swatch in the inspector to paint with it.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {brand.colors.map((c) => (
            <button
              key={c}
              type="button"
              className="size-10 rounded-full border border-border"
              style={{ background: c }}
              aria-label={c}
              onClick={() => setBrand({ ...brand, colors: brand.colors.filter((x) => x !== c) })}
              title="Remove"
            />
          ))}
          <input
            type="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            className="size-10 rounded-full border border-border bg-surface-alt"
            aria-label="New brand colour"
          />
          <Button
            size="sm"
            onClick={() => {
              if (!brand.colors.includes(newColor)) setBrand({ ...brand, colors: [...brand.colors, newColor] });
            }}
          >
            Add colour
          </Button>
        </div>
      </section>

      <section
        className="px-5 py-8 md:px-10 md:py-12"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = [...e.dataTransfer.files].find((f) => f.type.startsWith("image/"));
          if (!file) return;
          const reader = new FileReader();
          reader.onload = () => {
            const src = String(reader.result);
            const docId = fromBlank(formatId);
            const img = new Image();
            img.onload = () => {
              useDesign.getState().open(docId);
              const doc = useDesign.getState().doc;
              if (!doc) return;
              const scale = Math.min(doc.artboard.width / img.width, doc.artboard.height / img.height);
              useDesign.getState().addNode(
                imageNode({
                  x: (doc.artboard.width - img.width * scale) / 2,
                  y: (doc.artboard.height - img.height * scale) / 2,
                  w: img.width * scale,
                  h: img.height * scale,
                  src,
                }),
              );
              useDesign.getState().save();
              void navigate({ to: "/studio/$id", params: { id: docId } });
            };
            img.src = src;
          };
          reader.readAsDataURL(file);
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-medium tracking-[0.16em] text-ink-dim uppercase">Templates</h2>
          <div className="flex flex-wrap gap-1">
            {TEMPLATE_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={cn(
                  "h-9 rounded-[999px] px-3 text-xs font-medium",
                  cat === c ? "bg-phosphor text-phosphor-ink" : "text-ink-dim hover:bg-surface-alt hover:text-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {templates.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => openTemplate(t.id)}
              className="group overflow-hidden rounded-[24px] border border-border bg-surface p-2 text-left transition-colors hover:border-phosphor"
            >
              <div className="aspect-[4/5] overflow-hidden rounded-[16px] bg-ground">
                <TemplateThumb template={t} className="size-full" />
              </div>
              <div className="px-2 pt-3 pb-1">
                <div className="text-sm font-medium text-ink">{t.name}</div>
                <div className="mt-0.5 text-xs text-ink-dim">{t.description}</div>
              </div>
            </button>
          ))}
        </div>
        {templates.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-faint">No templates match that search.</p>
        )}
      </section>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} placeholder="Open a template or recent…" />
    </div>
  );
}
