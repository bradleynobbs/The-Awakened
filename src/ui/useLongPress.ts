import { useRef } from "react";

const LONG_PRESS_MS = 450;

/**
 * A press-and-hold gesture layered on top of a normal tap (§9.47 —
 * see DESIGN.md): the Deck Builder redesign's mockup has no room for
 * a separate ⓘ button on each card, so a plain tap now does the
 * primary action (select/deselect) and a long-press opens the
 * full-screen detail panel instead. `consumeIfLongPress()` must be
 * called at the start of the element's own onClick handler — if it
 * returns true, the long-press already fired and the click should be
 * swallowed rather than also triggering the primary action.
 */
export function useLongPress(onLongPress?: () => void) {
  const timerRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const cancelTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!onLongPress) {
    return { handlers: {}, consumeIfLongPress: () => false };
  }

  const handlers = {
    onPointerDown: () => {
      firedRef.current = false;
      cancelTimer();
      timerRef.current = window.setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, LONG_PRESS_MS);
    },
    onPointerUp: cancelTimer,
    onPointerLeave: cancelTimer,
    onPointerCancel: cancelTimer,
  };

  const consumeIfLongPress = () => {
    if (firedRef.current) {
      firedRef.current = false;
      return true;
    }
    return false;
  };

  return { handlers, consumeIfLongPress };
}
