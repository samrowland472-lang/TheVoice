import type { PathNode } from "@/lib/design/types";
import { PathInspector } from "./path-inspector";

/** Path point fields. Tab-order chrome lives in inspector-path.tsx. */
export function PathFields({ node }: { node: PathNode }) {
  return <PathInspector node={node} />;
}
