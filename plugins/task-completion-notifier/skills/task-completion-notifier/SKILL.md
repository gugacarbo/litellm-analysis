---
name: task-completion-notifier
description: Use the installed completion notifier when a task has been completed and verified.
---

# Task Completion Notifier

When the user explicitly activates notification mode, run:

```sh
python3 .task-completion-notifier/scripts/session-state.py activate \
  --state-dir .task-completion-notifier/state \
  --session-id default
```

The plugin's `Stop` hook owns notification delivery. Do not call a platform
notification command directly from a skill or task.
