import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import {
  ABANDON_RESETS_LIFETIME,
  GRACE_MS,
  elevationForMs,
} from './config';
import {
  clearPending,
  loadLifetime,
  loadPending,
  saveLifetime,
  savePending,
} from './storage';

export const PHASE = {
  BOOT: 'boot',
  SELECT: 'select',
  CLIMB: 'climb',
  TOLL: 'toll',
  DONE: 'done',
};

/**
 * Owns the session clock and the Toll.
 *
 * The clock is kept in refs and read on demand rather than held in state: at 60
 * frames a second nothing here should cause a React render, and the HUD polls
 * `readElapsed()` on its own slow interval instead.
 *
 * Elapsed time is always derived from wall-clock timestamps, never accumulated
 * by a ticking counter — the OS suspends JavaScript the moment the app is
 * backgrounded, so an interval-based timer would silently under-count exactly
 * when it matters most.
 */
export function useSession() {
  const [phase, setPhase] = useState(PHASE.BOOT);
  const [lifetime, setLifetime] = useState(0);
  const [durationMs, setDurationMs] = useState(0);
  const [awayMs, setAwayMs] = useState(0);

  const bankedRef = useRef(0);      // ms of climbing completed before the last pause
  const resumedAtRef = useRef(0);   // wall clock at which the current run began
  const runningRef = useRef(false);
  const leftAtRef = useRef(0);
  const awayRef = useRef(0);        // time away, frozen at the moment they returned
  const durationRef = useRef(0);
  const lifetimeRef = useRef(0);
  const phaseRef = useRef(PHASE.BOOT);

  const setPhaseSafe = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const setLifetimeSafe = useCallback((miles) => {
    lifetimeRef.current = miles;
    setLifetime(miles);
    saveLifetime(miles);
  }, []);

  /** Milliseconds climbed so far, clamped to the chosen duration. */
  const readElapsed = useCallback(() => {
    const live = runningRef.current ? Date.now() - resumedAtRef.current : 0;
    return Math.min(durationRef.current, bankedRef.current + live);
  }, []);

  const pauseClock = useCallback(() => {
    if (!runningRef.current) return;
    bankedRef.current = Math.min(
      durationRef.current,
      bankedRef.current + (Date.now() - resumedAtRef.current),
    );
    runningRef.current = false;
  }, []);

  const resumeClock = useCallback(() => {
    resumedAtRef.current = Date.now();
    runningRef.current = true;
  }, []);

  // --- restore -----------------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [saved, pending] = await Promise.all([loadLifetime(), loadPending()]);
      if (cancelled) return;
      lifetimeRef.current = saved;
      setLifetime(saved);

      if (pending) {
        // They left mid-climb and never came back — force-quit, reboot, or just
        // a long absence. The Toll was promised to be waiting for them.
        bankedRef.current = pending.elapsedMs;
        durationRef.current = pending.durationMs;
        leftAtRef.current = pending.leftAt;
        runningRef.current = false;
        setDurationMs(pending.durationMs);
        awayRef.current = Date.now() - pending.leftAt;
        setAwayMs(awayRef.current);
        setPhaseSafe(PHASE.TOLL);
      } else {
        setPhaseSafe(PHASE.SELECT);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setPhaseSafe]);

  // --- the intercept -----------------------------------------------------
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        if (phaseRef.current !== PHASE.CLIMB) return;
        pauseClock();
        leftAtRef.current = Date.now();
        // Fail closed. The real verdict is computed when they come back; until
        // then assume the worst, so a frame rendered mid-transition can never
        // flash a "Continue the Climb" button they have not earned.
        awayRef.current = Number.MAX_SAFE_INTEGER;
        setAwayMs(Number.MAX_SAFE_INTEGER);
        savePending({
          elapsedMs: bankedRef.current,
          durationMs: durationRef.current,
          leftAt: leftAtRef.current,
        });
        setPhaseSafe(PHASE.TOLL);
      } else if (next === 'active' && phaseRef.current === PHASE.TOLL) {
        // Freeze the verdict here. How long they then spend deliberating on the
        // modal must not push them out of the grace window.
        awayRef.current = Date.now() - leftAtRef.current;
        setAwayMs(awayRef.current);
      }
    });
    return () => sub.remove();
  }, [pauseClock, setPhaseSafe]);
  // NOTE: 'inactive' is deliberately ignored. On iOS it fires for the incoming
  // call banner and Control Centre, which the client wants forgiven; a real
  // switch to another app always progresses to 'background'. Answering a call
  // does background the app, so it is currently treated as leaving — telling
  // those apart needs a native CallKit observer. Flagged in OPEN-QUESTIONS.md.

  // --- actions -----------------------------------------------------------
  const begin = useCallback((minutes) => {
    const ms = minutes * 60000;
    bankedRef.current = 0;
    durationRef.current = ms;
    leftAtRef.current = 0;
    awayRef.current = 0;
    setDurationMs(ms);
    setAwayMs(0);
    resumeClock();
    setPhaseSafe(PHASE.CLIMB);
  }, [resumeClock, setPhaseSafe]);

  /** Available only inside the grace window. */
  const continueClimb = useCallback(() => {
    if (awayRef.current >= GRACE_MS) return false;
    clearPending();
    resumeClock();
    setPhaseSafe(PHASE.CLIMB);
    return true;
  }, [resumeClock, setPhaseSafe]);

  /** Bank what they climbed and end the session — after a successful purchase. */
  const payAndExit = useCallback(() => {
    clearPending();
    setLifetimeSafe(lifetimeRef.current + elevationForMs(readElapsed()));
    runningRef.current = false;
    setPhaseSafe(PHASE.DONE);
  }, [readElapsed, setLifetimeSafe, setPhaseSafe]);

  const abandon = useCallback(() => {
    clearPending();
    if (ABANDON_RESETS_LIFETIME) setLifetimeSafe(0);
    bankedRef.current = 0;
    runningRef.current = false;
    setPhaseSafe(PHASE.SELECT);
  }, [setLifetimeSafe, setPhaseSafe]);

  /** The whole duration was served — the only way to gain elevation for free. */
  const complete = useCallback(() => {
    if (phaseRef.current !== PHASE.CLIMB) return;
    clearPending();
    setLifetimeSafe(lifetimeRef.current + elevationForMs(durationRef.current));
    runningRef.current = false;
    setPhaseSafe(PHASE.DONE);
  }, [setLifetimeSafe, setPhaseSafe]);

  const dismissSummary = useCallback(() => setPhaseSafe(PHASE.SELECT), [setPhaseSafe]);

  return {
    phase,
    lifetime,
    durationMs,
    awayMs,
    inGrace: awayMs < GRACE_MS,
    readElapsed,
    begin,
    continueClimb,
    payAndExit,
    abandon,
    complete,
    dismissSummary,
  };
}
