import { distributeGuidePositions } from "./guide-select";
import { useDesign } from "./store-impl";

type Guide = { id: string; axis: "x" | "y"; pos: number; locked?: boolean; hidden?: boolean };

const state = useDesign.getState() as {
  distributeSelectedGuides?: () => void;
  selectGuides?: (ids: string[], additive?: boolean) => void;
};

if (typeof state.distributeSelectedGuides !== "function") {
  useDesign.setState({
    guideSelection: (useDesign.getState() as { guideSelection?: string[] }).guideSelection ?? [],
    selectGuides: (ids: string[], additive = false) => {
      const cur = ((useDesign.getState() as { guideSelection?: string[] }).guideSelection ?? []) as string[];
      if (additive) {
        const next = new Set(cur);
        for (const id of ids) {
          if (next.has(id)) next.delete(id);
          else next.add(id);
        }
        useDesign.setState({ guideSelection: [...next], selection: [] });
        return;
      }
      useDesign.setState({ guideSelection: ids, selection: [] });
    },
    distributeSelectedGuides: () => {
      const s = useDesign.getState() as {
        doc: { guides?: Guide[] } | null;
        guideSelection?: string[];
      };
      if (!s.doc) return;
      const guides = s.doc.guides ?? [];
      const ids = (s.guideSelection ?? []).length ? s.guideSelection! : guides.map((g) => g.id);
      const next = distributeGuidePositions(guides, ids);
      useDesign.setState({ doc: { ...s.doc, guides: next }, dirty: true });
    },
  } as Record<string, unknown>);
}
