## 2025-03-09 - Memoizing derived state in JobScheduler
**Learning:** In JobScheduler.tsx, total capacity calculations were computed inline twice via array reductions on every render, which is O(2N) complexity and unnecessarily recalculated whenever unrelated states (like `roomName` or `priority`) changed.
**Action:** When components have expensive derived states (like O(N) array reductions), consolidate them into a single pass and use `useMemo` to cache the result, preventing redundant recalculations on unrelated state updates.
