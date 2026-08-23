import { Command } from "cmdk";
import type { ReactNode } from "react";
import { PRESETS } from "@/lib/studio/presets";
import { useStudio } from "@/lib/studio/store";

export function CommandPalette() {
  const open = useStudio((s) => s.commandOpen);
  if (!open) return null;

  const close = () => useStudio.getState().setCommandOpen(false);
  const run = (fn: () => void) => {
    fn();
    close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-bg/70 pt-[12vh]" onClick={close}>
      <Command
        className="w-[min(100%-24px,440px)] overflow-hidden rounded-lg border border-border bg-surface shadow-panel"
        onClick={(e) => e.stopPropagation()}
        label="Command palette"
      >
        <Command.Input
          autoFocus
          placeholder="Create, play, load a scene…"
          className="h-11 w-full border-b border-border bg-transparent px-3 text-sm text-fg outline-none placeholder:text-subtle"
        />
        <Command.List className="max-h-72 overflow-y-auto p-1">
          <Command.Empty className="px-3 py-6 text-center text-xs text-muted">
            No matching command
          </Command.Empty>
          <Command.Group heading="Playback" className="px-1 py-1 text-2xs uppercase tracking-wider text-subtle">
            <Item onSelect={() => run(() => useStudio.getState().togglePlay())}>Play / Pause</Item>
            <Item onSelect={() => run(() => useStudio.getState().stop())}>Stop to range start</Item>
            <Item onSelect={() => run(() => useStudio.getState().insertKeysForSelection())}>
              Keyframe selection (S)
            </Item>
            <Item onSelect={() => run(() => useStudio.getState().copyPose())}>Copy pose</Item>
            <Item onSelect={() => run(() => useStudio.getState().pastePose())}>Paste pose</Item>
            <Item onSelect={() => run(() => useStudio.getState().copyKeys())}>Copy keys</Item>
            <Item onSelect={() => run(() => useStudio.getState().pasteKeys())}>Paste keys</Item>
            <Item onSelect={() => run(() => useStudio.getState().rippleDeleteKeys())}>
              Ripple delete keys
            </Item>
            <Item onSelect={() => run(() => useStudio.getState().selectAllKeys())}>Select all keys</Item>
            <Item onSelect={() => run(() => useStudio.getState().setPlayblastOpen(true))}>
              Playblast viewport
            </Item>
            <Item
              onSelect={() =>
                run(() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = ".glb,.gltf,model/gltf-binary,model/gltf+json";
                  input.onchange = () => {
                    const f = input.files?.[0];
                    if (!f) return;
                    void import("@/lib/studio/gltf").then(({ parseGltfFile }) =>
                      parseGltfFile(f).then(({ nodes, rootId }) =>
                        useStudio.getState().addImported(nodes, rootId),
                      ),
                    );
                  };
                  input.click();
                })
              }
            >
              Import glTF
            </Item>
            <Item onSelect={() => run(() => useStudio.getState().setOnionSkin(!useStudio.getState().onionSkin))}>
              Toggle onion skin
            </Item>
            <Item
              onSelect={() =>
                run(() => {
                  const s = useStudio.getState();
                  const ids = s.selectedIds;
                  if (ids.length >= 2) s.addIkChain(ids[0]!, ids[1]!);
                  else if (s.selectedId) s.toggleIk(s.selectedId);
                })
              }
            >
              IK handle / toggle IK
            </Item>
          </Command.Group>
          <Command.Group heading="Create" className="px-1 py-1 text-2xs uppercase tracking-wider text-subtle">
            <Item onSelect={() => run(() => useStudio.getState().addMesh({ type: "box", w: 1, h: 1, d: 1 }, "Cube"))}>
              Cube
            </Item>
            <Item onSelect={() => run(() => useStudio.getState().addMesh({ type: "sphere", r: 0.5 }, "Sphere"))}>
              Sphere
            </Item>
            <Item
              onSelect={() =>
                run(() =>
                  useStudio.getState().addMesh({ type: "cylinder", rt: 0.45, rb: 0.45, h: 1.2 }, "Cylinder"),
                )
              }
            >
              Cylinder
            </Item>
            <Item onSelect={() => run(() => useStudio.getState().addLight("point"))}>Point light</Item>
            <Item onSelect={() => run(() => useStudio.getState().addCamera())}>Camera</Item>
          </Command.Group>
          <Command.Group heading="Scenes" className="px-1 py-1 text-2xs uppercase tracking-wider text-subtle">
            {PRESETS.map((p) => (
              <Item key={p.id} onSelect={() => run(() => useStudio.getState().loadSnapshot(p.factory(), p.id === "loop"))}>
                Load {p.label}
              </Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function Item({ children, onSelect }: { children: ReactNode; onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex h-8 cursor-pointer items-center rounded-sm px-2 text-sm text-fg data-[selected=true]:bg-surface-2"
    >
      {children}
    </Command.Item>
  );
}
