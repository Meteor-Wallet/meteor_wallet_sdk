import { createContext } from "@lit/context";

export const overlayCloseTriggerContext = createContext<() => void>("overlay-close-trigger");
