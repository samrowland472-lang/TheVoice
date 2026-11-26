export {
  useDesign,
  makeShape,
  makeText,
  ensurePaintLayer,
} from "./store-impl";
export type { ViewIntent } from "./store-impl";
import { useDesign } from "./store-impl";
export type DesignStore = ReturnType<typeof useDesign.getState>;
