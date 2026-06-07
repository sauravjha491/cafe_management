# Debug Session: Admin Notification Verification

## Status
[OPEN]

## Symptoms
- Sound might not be playing for waiter calls.
- Order notification popups might not be showing details correctly or at all.

## Hypotheses
1. **Hypothesis 1 (Listener Delay)**: The Firebase `onSnapshot` listener might have a delay or might not be triggering for some reason in the production-like environment.
2. **Hypothesis 2 (Audio Blocking)**: The browser might still be blocking the audio even with the "Enable Sound" button if the audio object is not correctly re-initialized.
3. **Hypothesis 3 (Toast ID Conflict)**: Multiple orders might be sharing the same toast ID or being suppressed.
4. **Hypothesis 5 (Data Structure Mismatch)**: The data structure returned by Firebase might be slightly different from what the UI expects.

## Evidence
(None yet)

## Fix
(None yet)

## Verification
(None yet)
