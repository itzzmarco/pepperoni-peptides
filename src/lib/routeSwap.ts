/** Starts a view transition that runs `update` inside it, the shape of `document.startViewTransition`. */
export type StartTransition = (update: () => void) => { finished: Promise<unknown> };

/**
 * Route swaps through view transitions, one at a time. A swap asked for while a transition is still
 * running (a second tab tap mid-fade), or when starting one throws, happens at once instead, so the
 * route always follows the hash. `swap` must be safe to run twice: it reads the current hash.
 */
export function transitionGate(swap: () => void) {
  let running = false;
  const done = () => { running = false; };
  return (start: StartTransition | null) => {
    if (start && !running) {
      try {
        running = true;
        start(swap).finished.then(done, done);
        return;
      } catch {
        running = false;
      }
    }
    swap();
  };
}
