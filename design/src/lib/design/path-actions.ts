import { applyPathEdit, type PathEditHit } from "./path-edit";
import { useDesign } from "./store";
import { isPath } from "./types";

export function setPathEditHit(hit: PathEditHit | null) {
  useDesign.setState({ pathEditHit: hit } as { pathEditHit: PathEditHit | null });
}

export function editPathHit(
  id: string,
  hit: PathEditHit,
  localX: number,
  localY: number,
  keepSmooth: boolean,
  commit = false,
) {
  const s = useDesign.getState();
  const doc = s.doc;
  if (!doc) return;
  const n = doc.nodes.find((x) => x.id === id);
  if (!n || !isPath(n)) return;
  if (commit) s.commit();
  const next = applyPathEdit(n, hit, localX, localY, keepSmooth);
  s.replaceNode(id, next, false);
  setPathEditHit(hit);
}
