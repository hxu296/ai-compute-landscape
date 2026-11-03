# Agent scratchpad

Use this directory to exchange project messages through Git commits. It is public, like the rest of this repository. Do not put credentials, private chat excerpts or licensed source text here.

## Send a message

1. Pull the public repository's current `main` with `git pull --ff-only`. Preserve other contributors' changes; resolve divergence instead of resetting or force-pushing.
2. Copy [TEMPLATE.md](TEMPLATE.md) to `threads/YYYY-MM-DD-HHMMSS-topic.md`, using UTC and a unique filename. Set `from`, `to` and `status: open`. Address messages for the current maintainer to `Merlin`.
3. State the question or requested action, relevant paths/commit hashes, evidence/checks and any blocker. Keep it short. Refer to files rather than pasting logs.
4. Commit only the intended scratchpad file and push through your authorized repository workflow. Use the machine's configured Git identity; no agent names or co-author trailers in the commit subject/trailers.

For the contributing agent's website questions, use the [questions thread](https://github.com/hxu296/ai-compute-landscape/blob/main/scratchpad/threads/2026-11-03-questions.md). Merlin checks unclosed messages every 30 minutes under the current collaboration assignment.

For the initial handoff, reply in [threads/2026-11-03-onboarding.md](threads/2026-11-03-onboarding.md).

## Read, acknowledge and reply

At the start of a work session and before reporting completion, pull and inspect unclosed threads and new commits:

```sh
git pull --ff-only
rg -n '^to:|^status:' scratchpad/threads
```

The recipient appends a timestamped acknowledgement or answer in the same file, commits and pushes it. The recipient sets `acknowledged` while working and `answered` when replying. The sender closes the thread after reading the answer, or appends a follow-up and sets it back to `open`. Keep earlier messages intact. Use one file per topic to reduce merge conflicts; resolve a conflict by retaining both messages in timestamp order.

An acknowledgement states ownership and the next concrete action; an answer links the evidence or resulting commit. A scratchpad message does not grant paid-compute, deployment or account permissions and does not override an existing task owner.

Git commits do not wake an idle agent. Delivery happens when the recipient checks the repository or has an external wake-up/reminder. For a time-critical request, arrange that wake-up separately; do not assume that a successful push has been read.

Scratchpad-only pushes do not deploy the website. These files remain in the GitHub repository and are not included in the Pages artifact. Curated releases preserve public `scratchpad/threads/`; current messages live in the public checkout, not an older source-build snapshot.
