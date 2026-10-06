# Rebuild recorded generation chains in dependency order

Source sketch editing now finds indirect consumers through generated output guide IDs, not just objects that reference the source directly. The affected objects are ordered so producers rebuild before their consumers. Restoration runs in reverse order to respect existing overlapping-layer provenance, then the usual manual-preservation and collision policies apply during rebuilding.

Generated display guides advance their revision when rebuilt. Downstream source-version records capture those updated revisions. Source-only editing marks the whole recorded affected chain outdated while retaining its current voxels. Explicitly detached or physically independent producers do not propagate updates through their retained output guide snapshots.

Cycle and missing-reference checks reject the plan before live changes. Multiple selected producers using the same output guide ID also reject rather than guessing ownership. The working planner remains a fork: failure is not a partially committed result. Confirmation and undo use the existing atomic construction workflow.

The source edit panel now lists the transitive affected object names. Saved-guide rows label their counts as **直接关联** to distinguish immediate consumers from the full affected scope. Editing an upstream feature's parameters includes recorded descendants through the same planner, while retaining existing object IDs and manual-policy behavior.

Tests cover reversed object order in a three-level dependency graph, cycle/missing-reference failure, independent order and detached stops. A two-stage path/sweep geometry chain verified updated downstream voxels, preserved manual overrides, output-guide/source versions, atomic planning, one-step undo, source-only stale marking and upstream parameter propagation. A fresh browser verified the named two-stage scope, preview/commit, manual preservation and undo. Existing single-source navigation/regeneration cases passed. See [evidence](validation/generation-propagation.json).

Limits: this operates on existing `generation.sources`, recipe IDs and output guide IDs. It does not infer new dependencies from coincident geometry, create persistent object-snap constraints, repair topology automatically or enable every generated output as every possible profile type. Unsupported or missing inputs still fail explicitly. Full dependency graph editing, backend authority/working sets and live game validation remain pending.

中文：修改源草图会沿已记录的输出辅助线关系寻找间接消费者，逆序恢复、顺序重建；显示辅助线版本及下游来源版本同步更新。循环、失效和输出归属歧义在写入前拒绝，独立化终止传播。仅改草图标记整条关联链待更新，确认仍可一次撤销，不把几何重合或普通吸附自动视为工程约束。
