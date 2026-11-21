import { useDesign } from "./store-impl";

type Probe = {
  axis: "x" | "y";
  pos: number;
  before: number | null;
  after: number | null;
} | null;

const state = useDesign.getState() as { setGuideProbe?: (p: Probe) => void; setGuideGapPreview?: (g: number | null) => void };
if (typeof state.setGuideProbe !== "function") {
  useDesign.setState({
    guideProbe: null,
    setGuideProbe: (guideProbe: Probe) => useDesign.setState({ guideProbe }),
  } as Record<string, unknown>);
}
if (typeof state.setGuideGapPreview !== "function") {
  useDesign.setState({
    guideGapPreview: null as number | null,
    setGuideGapPreview: (guideGapPreview: number | null) => useDesign.setState({ guideGapPreview }),
  } as Record<string, unknown>);
}
