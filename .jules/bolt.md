## 2025-03-09 - Memoizing derived state in JobScheduler
**Learning:** In JobScheduler.tsx, total capacity calculations were computed inline twice via array reductions on every render, which is O(2N) complexity and unnecessarily recalculated whenever unrelated states (like `roomName` or `priority`) changed.
**Action:** When components have expensive derived states (like O(N) array reductions), consolidate them into a single pass and use `useMemo` to cache the result, preventing redundant recalculations on unrelated state updates.

## 2025-03-09 - Memoizing complex list items in VoiceSandbox
**Learning:** In VoiceSandbox.tsx, typing in the chat input or continuous microphone volume changes trigger high-frequency state updates in the parent component. Rendering an array of complex DOM elements inside the parent component's `.map()` function without memoization causes O(N) re-renders, impacting overall application responsiveness and typing latency.
**Action:** Always extract complex list items into separate components wrapped with `React.memo` when the parent component experiences frequent state updates to prevent unnecessary re-rendering of entire lists.
