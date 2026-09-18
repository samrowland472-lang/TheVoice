import { useDesign } from "./store-impl";

type Probe = {
  axis: "x" | "y";
  pos: number;
  before: number | null;
  after: number | null;
} | null;

const state = useDesign.getState() as { setGuideProbe?: (p: Probe) => void };
if (typeof state.setGuideProbe !== "function") {
  useDesign.setState({
    guideProbe: null,
    setGuideProbe: (guideProbe: Probe) => useDesign.setState({ guideProbe }),
  } as Record<string, unknown>);
}
