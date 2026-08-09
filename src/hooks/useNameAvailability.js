import { useEffect, useRef, useState } from 'react';
import { isUsernameTaken } from '../leaderboard';
import { normaliseUsername, validateUsername } from '../validation';

export const NAME = {
  EMPTY: 'empty',
  INVALID: 'invalid',
  CHECKING: 'checking',
  AVAILABLE: 'available',
  TAKEN: 'taken',
  UNKNOWN: 'unknown',
};

const DEBOUNCE_MS = 450;

/**
 * Live availability for a name as it is typed.
 *
 * Debounced so a keystroke is not a request, and every reply is matched against
 * the value that asked for it — a slow answer for an old name must never
 * overwrite a fast answer for the current one.
 */
export function useNameAvailability(value) {
  const [state, setState] = useState({ status: NAME.EMPTY, message: null });
  const latest = useRef(0);

  useEffect(() => {
    const name = normaliseUsername(value);

    if (!name) {
      setState({ status: NAME.EMPTY, message: null });
      return undefined;
    }

    const invalid = validateUsername(name);
    if (invalid) {
      setState({ status: NAME.INVALID, message: invalid });
      return undefined;
    }

    setState({ status: NAME.CHECKING, message: 'Checking…' });
    const ticket = ++latest.current;

    const timer = setTimeout(async () => {
      try {
        const taken = await isUsernameTaken(name);
        if (ticket !== latest.current) return;
        setState(
          taken
            ? { status: NAME.TAKEN, message: `${name} is already climbing` }
            : { status: NAME.AVAILABLE, message: `${name} is free` },
        );
      } catch {
        if (ticket !== latest.current) return;
        setState({ status: NAME.UNKNOWN, message: 'Could not check right now' });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [value]);

  return state;
}
