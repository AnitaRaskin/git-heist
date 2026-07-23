const NIGHTSHADE_POOL = [
  // ── git reflog ────────────────────────────────────────────────────────────
  {
    q: "NIGHTSHADE deleted a branch to hide evidence. Which command can still reveal that branch's commits?",
    options: [
      "git reflog, which records every HEAD position change",
      "git log --all, which walks all current branch refs",
      "git stash list, which shows all saved stash entries",
      "git show HEAD~1, which displays the previous commit"
    ],
    correct: 0,
    explain: "git reflog records every movement of HEAD including branch deletions, so orphaned commit SHAs remain visible there even after the branch is gone."
  },
  {
    q: "By default, how long does git keep orphaned commits recoverable via reflog before garbage collection?",
    options: [
      "30 days after the last reference to the commit",
      "90 days after the last reference to the commit",
      "60 days after the last reference to the commit",
      "14 days after the last reference to the commit"
    ],
    correct: 1,
    explain: "git's default gc.reflogExpire is 90 days; commits unreachable from any named ref are eligible for pruning after that window."
  },
  {
    q: "git reflog differs from git log because reflog also records which category of event?",
    options: [
      "Commits that originated from a remote fork or clone",
      "File-level content changes within each stored commit",
      "Every local HEAD position change including checkouts and resets",
      "Push operations that updated the remote tracking branch"
    ],
    correct: 2,
    explain: "git reflog tracks HEAD movements from checkouts, rebases, resets, and merges — not just commits reachable from a branch tip."
  },
  {
    q: "After a failed rebase corrupted your branch, which command shows the SHA the branch held before the rebase?",
    options: [
      "git log --merges --all --oneline to list merge commits",
      "git diff HEAD~1 HEAD --stat to compare recent commits",
      "git status --porcelain --branch to show branch state",
      "git reflog show <branch> to list its position history"
    ],
    correct: 3,
    explain: "git reflog show <branch> lists the history of that specific ref, so you can pinpoint the SHA it held before the rebase began."
  },
  {
    q: "Which scenario makes git reflog the ONLY reliable local recovery tool?",
    options: [
      "A commit was pushed to origin and then immediately reverted",
      "A local branch was hard-deleted without being merged",
      "A stash was applied to an incorrect working branch",
      "A pull request was closed before it was ever merged"
    ],
    correct: 1,
    explain: "Deleting a branch removes its ref, so git log --all can't find those commits; git reflog still records the SHA the deleted branch pointed to."
  },

  // ── git log --all vs git log ───────────────────────────────────────────────
  {
    q: "What does 'git log --all' show that plain 'git log' omits?",
    options: [
      "Commits reachable from all refs including remote-tracking ones",
      "Deleted files that were once committed to the repository",
      "Commits with no associated branch pointer at the moment",
      "The full unified diff for every commit in the history"
    ],
    correct: 0,
    explain: "git log --all walks all refs (branches, tags, remotes), while plain git log only walks ancestors of the current HEAD."
  },
  {
    q: "NIGHTSHADE committed to a feature branch then checked out main. Why won't plain 'git log' show the feature commit?",
    options: [
      "The feature commit has no upstream remote tracking ref",
      "git log only walks from HEAD, not from other branch refs",
      "The feature commit is automatically quarantined after checkout",
      "git log skips commits made by different authors by default"
    ],
    correct: 1,
    explain: "git log starts from HEAD and follows parent pointers; commits reachable only via other branch refs are simply not traversed."
  },
  {
    q: "You suspect NIGHTSHADE left evidence on a remote-tracking branch. Which flag makes git log include origin/* refs?",
    options: [
      "--remotes shows only remote-tracking branch commits",
      "--all includes all local and remote-tracking refs",
      "--branches shows only local branch head commits",
      "--tags shows only annotated tag objects in history"
    ],
    correct: 1,
    explain: "--all includes remote-tracking refs, so activity on origin/nightshade or any other remote branch becomes visible."
  },
  {
    q: "Which combination displays a condensed ASCII graph of commits across all branches at once?",
    options: [
      "git log --oneline --all --graph",
      "git log --format=short --branches --decorate",
      "git log --stat --tags --merges --abbrev",
      "git log --patch --follow --diff-filter=R"
    ],
    correct: 0,
    explain: "Combining --oneline, --all, and --graph produces a compact, graphical view of every ref and its ancestry in the repository."
  },

  // ── Detached HEAD state ───────────────────────────────────────────────────
  {
    q: "What precisely does 'detached HEAD' mean in a git repository?",
    options: [
      "HEAD points directly at a commit SHA instead of a branch ref",
      "HEAD points to a branch that has no configured upstream remote",
      "The .git/HEAD file is empty or missing from the directory",
      "HEAD points to a tag object rather than a regular commit"
    ],
    correct: 0,
    explain: "Detached HEAD means .git/HEAD contains a raw commit hash rather than a symbolic ref like refs/heads/main."
  },
  {
    q: "Which of these operations is most likely to leave you in detached HEAD state?",
    options: [
      "git branch -D feature/old to delete a local branch",
      "git checkout a3f9d21 to check out a specific commit",
      "git merge --no-ff feature to create an explicit merge commit",
      "git fetch origin main to download remote branch updates"
    ],
    correct: 1,
    explain: "Checking out a specific commit SHA puts HEAD directly on that commit rather than on any named branch ref."
  },
  {
    q: "You committed in detached HEAD state but didn't create a branch. What happens when you checkout another branch?",
    options: [
      "Those commits are immediately purged from .git/objects folder",
      "Those commits become orphaned and will eventually be garbage collected",
      "Those commits are automatically pushed to the configured remote",
      "Those commits are silently moved into a new stash entry"
    ],
    correct: 1,
    explain: "Without a branch ref pointing to them, those commits become unreachable from any named ref and are subject to garbage collection."
  },
  {
    q: "How do you preserve commits made in detached HEAD before switching to another branch?",
    options: [
      "git push origin HEAD immediately before switching branches",
      "git stash push --include-untracked to save them first",
      "git branch new-branch-name to attach a ref to HEAD",
      "git tag save-point to mark the current detached position"
    ],
    correct: 2,
    explain: "Creating a branch (git branch <name>) attaches a named ref to the current HEAD commit, preventing it from becoming orphaned."
  },
  {
    q: "What does git display to warn you that you are entering detached HEAD state?",
    options: [
      "Note: switching to commit. You are in 'detached HEAD' state.",
      "Warning: HEAD is now dangling and points to no branch.",
      "Error: no branch is checked out, please use git switch.",
      "Fatal: HEAD ref is missing from the .git directory now."
    ],
    correct: 0,
    explain: "Git prints a 'detached HEAD' notice with advice on creating a branch when you check out a commit, tag, or remote ref that isn't a local branch."
  },

  // ── git reset --hard / --soft / --mixed ───────────────────────────────────
  {
    q: "Which git reset mode moves the branch pointer but leaves both the index and working tree completely unchanged?",
    options: [
      "git reset --soft to move the pointer only",
      "git reset --hard to discard all local changes",
      "git reset --mixed to unstage but keep working tree",
      "git reset --keep to preserve uncommitted modifications"
    ],
    correct: 0,
    explain: "--soft moves only the branch pointer; staged changes remain staged and your working tree files are completely untouched."
  },
  {
    q: "NIGHTSHADE ran 'git reset --hard HEAD~3'. What happened to those three commits' changes in the working tree?",
    options: [
      "They were silently pushed to the stash for later recovery",
      "They were permanently discarded from the working directory",
      "They were left unstaged but still present in the file tree",
      "They were quietly squashed into a single previous commit"
    ],
    correct: 1,
    explain: "--hard discards all staged and unstaged changes to exactly match the target commit, with no working-tree recovery path except reflog."
  },
  {
    q: "After 'git reset --mixed HEAD~1', in what state are the previous commit's changes?",
    options: [
      "Lost permanently from the working directory and index",
      "Staged in the index and ready to be committed again",
      "Auto-committed to a new detached HEAD commit quietly",
      "Unstaged in the working tree but not deleted or lost"
    ],
    correct: 3,
    explain: "--mixed (the default) resets the index but leaves the working tree untouched, so changes appear as unstaged modifications."
  },
  {
    q: "Which git reset mode is safest for undoing commits that teammates have already pulled from origin?",
    options: [
      "--hard because it locally cleans up all evidence quickly",
      "--soft because it preserves staged changes for everyone",
      "--mixed because it keeps working tree files fully intact",
      "None — prefer git revert to create a safe undo commit"
    ],
    correct: 3,
    explain: "Any reset that moves a pushed branch pointer rewrites shared history; git revert creates a new undo commit that doesn't break teammates' histories."
  },
  {
    q: "You need to undo the last commit but keep your changes staged so you can amend them. Which command achieves this?",
    options: [
      "git reset --soft HEAD~1 to undo while keeping staged changes",
      "git reset --hard HEAD~1 to undo and discard all changes",
      "git restore --staged HEAD~1 to unstage one file at a time",
      "git revert HEAD --no-commit to create a reverse patch"
    ],
    correct: 0,
    explain: "--soft resets only the branch pointer, leaving the previous commit's changes staged and immediately ready to re-commit."
  },

  // ── git push --force ──────────────────────────────────────────────────────
  {
    q: "Why is 'git push --force' on a shared branch considered dangerous?",
    options: [
      "It discards remote commits that teammates may have already pulled",
      "It deletes the remote branch permanently along with its history",
      "It locks the remote branch for 24 hours after the push completes",
      "It resets the local branch pointer to match the remote instead"
    ],
    correct: 0,
    explain: "Force-pushing replaces the remote ref with your local one, overwriting commits that others may have already pulled and based new work on."
  },
  {
    q: "Which safer alternative to '--force' rejects the push if someone else pushed in the meantime?",
    options: [
      "git push --no-rebase --verify to check before pushing",
      "git push --force-with-lease to verify the remote ref first",
      "git push --atomic --signed to use signed commit verification",
      "git push --safe --validate to confirm no conflict exists"
    ],
    correct: 1,
    explain: "--force-with-lease checks that your locally-known remote ref hasn't changed before overwriting it, preventing accidental history loss."
  },
  {
    q: "When is force-pushing to a remote branch generally considered acceptable practice?",
    options: [
      "After amending or rebasing a personal feature branch others haven't pulled",
      "Whenever a production deploy fails and history needs immediate cleanup",
      "Whenever two developers are simultaneously reviewing the same pull request",
      "After any commit that involved resolving a difficult merge conflict locally"
    ],
    correct: 0,
    explain: "Force-pushing your own unreviewed feature branch is acceptable because no one else has based new work on those commits yet."
  },
  {
    q: "NIGHTSHADE force-pushed to erase incriminating commits from origin. What mechanism could still reveal the originals?",
    options: [
      "The remote server's own reflog if server-side logging is enabled",
      "The local git index on any collaborator's workstation nearby",
      "The packed-refs file stored in the remote repository directory",
      "The FETCH_HEAD ref stored inside the local .git directory"
    ],
    correct: 0,
    explain: "GitHub, GitLab, and most Git servers maintain server-side reflogs recording what each branch ref pointed to before force-pushes."
  },

  // ── git cherry-pick ───────────────────────────────────────────────────────
  {
    q: "What does 'git cherry-pick <sha>' do to your current branch?",
    options: [
      "Applies the diff from that commit as a new commit here",
      "Moves that commit off its original branch to this one",
      "Copies only the commit message without applying its changes",
      "Merges the branch that contains that commit into HEAD"
    ],
    correct: 0,
    explain: "cherry-pick replays the changes introduced by the specified commit as a brand-new commit on top of the current branch."
  },
  {
    q: "After cherry-picking, the resulting commit compares to the original in which way?",
    options: [
      "Same SHA because the diff content and message are identical",
      "Different SHA because the parent commit and timestamp differ",
      "Different author but matching SHA if the message is the same",
      "Same parent SHA because cherry-pick preserves ancestry links"
    ],
    correct: 1,
    explain: "The cherry-picked commit gets a new SHA because its parent differs from the original's parent, even though the diff and message are the same."
  },
  {
    q: "Which flag tells git cherry-pick to stage the changes but NOT automatically create a commit?",
    options: [
      "--no-commit stages changes without creating a commit",
      "--staged applies only what is already in the index",
      "--edit opens the commit message editor for every pick",
      "--keep-original preserves the original commit SHA intact"
    ],
    correct: 0,
    explain: "--no-commit (or -n) applies the patch to the index and working tree but stops before creating the new commit."
  },
  {
    q: "NIGHTSHADE cherry-picked a secret commit onto main then deleted the source branch. What clue remains?",
    options: [
      "The commit's author date will be earlier than surrounding commits",
      "cherry-pick leaves a permanent marker in .git/CHERRY_PICK_HEAD",
      "The duplicate diff appears in git log --all with branch refs",
      "The commit's tree SHA will be flagged by git fsck --strict"
    ],
    correct: 0,
    explain: "Cherry-picked commits often have an author date earlier than surrounding commits, and their identical diff can be found via git log -S or reflog analysis."
  },

  // ── git stash show -p ─────────────────────────────────────────────────────
  {
    q: "What does 'git stash show -p' display about the stash entry?",
    options: [
      "The full unified diff of all changes in the stash",
      "A summary of changed files and line count totals only",
      "The commit message and author metadata of the stash",
      "A list of all stash entries currently saved in the stack"
    ],
    correct: 0,
    explain: "-p (patch) shows the full diff of what the stash contains, letting you review every changed line before applying it."
  },
  {
    q: "Without the -p flag, plain 'git stash show' displays what information?",
    options: [
      "Only the stash creation timestamp and branch name",
      "A --stat summary listing changed files and line counts",
      "The complete patch including all untracked file contents",
      "The stash SHA and the branch where it was originally made"
    ],
    correct: 1,
    explain: "Plain git stash show outputs a --stat view: file names with insertions and deletions, without the full line-by-line diff."
  },
  {
    q: "To inspect the full patch of the second-most-recent stash entry without applying it, which command is correct?",
    options: [
      "git stash show -p stash@{1} for the second entry",
      "git stash show -p stash@{0} for the most recent entry",
      "git stash diff HEAD stash@{1} to compare with HEAD",
      "git stash inspect --patch 1 using the index number"
    ],
    correct: 0,
    explain: "stash@{1} refers to the second entry (0-indexed LIFO); -p displays its full diff without applying any changes."
  },

  // ── git stash list / LIFO ordering ───────────────────────────────────────
  {
    q: "git stash uses which data-structure ordering, making stash@{0} always the most recent entry?",
    options: [
      "LIFO — Last In, First Out stack ordering",
      "FIFO — First In, First Out queue ordering",
      "Alphabetical ordering by the branch name used",
      "Chronological oldest-first ordering by timestamp"
    ],
    correct: 0,
    explain: "The stash is a stack: every git stash push prepends the new entry, so stash@{0} is always the most recently saved one."
  },
  {
    q: "You ran 'git stash' three times in a row. Which stash@{N} holds the very first stash you created?",
    options: [
      "stash@{0} because it was created first in the sequence",
      "stash@{1} because zero indexing makes the first entry second",
      "stash@{2} because it is the oldest remaining stack entry",
      "stash@{3} because there is one entry per operation plus zero"
    ],
    correct: 2,
    explain: "After three pushes, stash@{0} is the latest, stash@{1} is the second, and stash@{2} is the oldest (first created)."
  },
  {
    q: "Which command drops only the oldest of four stash entries without affecting the others?",
    options: [
      "git stash drop stash@{3} to remove the oldest entry",
      "git stash pop stash@{3} to apply and remove the oldest",
      "git stash clear --keep 3 to preserve three entries only",
      "git stash drop stash@{0} to remove the most recent one"
    ],
    correct: 0,
    explain: "With four entries (0–3), stash@{3} is the oldest; git stash drop stash@{3} removes only that entry from the stack."
  },

  // ── git fetch vs git pull ─────────────────────────────────────────────────
  {
    q: "What is the fundamental difference between 'git fetch' and 'git pull'?",
    options: [
      "fetch downloads remote refs without merging; pull also merges",
      "fetch only updates tags while pull updates branches too",
      "fetch requires authentication while pull works anonymously",
      "fetch is faster because it skips downloading object data"
    ],
    correct: 0,
    explain: "git fetch updates remote-tracking refs without touching the working tree; git pull fetches and then merges (or rebases) into the current branch."
  },
  {
    q: "After 'git fetch origin', your working tree is unchanged. What specifically has changed locally?",
    options: [
      "Remote-tracking refs like origin/main are moved forward",
      "Your current branch is fast-forwarded to match the remote",
      "The local .git/config is rewritten with updated remote data",
      "Untracked files from the remote are downloaded to disk"
    ],
    correct: 0,
    explain: "Fetch only moves the origin/* remote-tracking refs to reflect the server's current state; local branches and the working tree are untouched."
  },
  {
    q: "Which command is precisely equivalent to 'git fetch origin' followed by 'git merge origin/main'?",
    options: [
      "git sync origin main to integrate remote changes locally",
      "git pull origin main using the default merge strategy",
      "git update --remote main to merge the remote tracking ref",
      "git rebase origin/main --autostash to replay local commits"
    ],
    correct: 1,
    explain: "git pull by default fetches and then merges the remote-tracking branch into the current local branch."
  },
  {
    q: "How do you configure 'git pull' to rebase instead of merge by default across the entire repo?",
    options: [
      "git config pull.rebase true to set it globally or per-repo",
      "git pull --rebase=auto once to persist the setting permanently",
      "Edit .gitconfig directly and set merge.strategy = rebase",
      "Set GIT_PULL_STRATEGY=rebase in your shell environment file"
    ],
    correct: 0,
    explain: "Setting pull.rebase = true in git config makes git pull rebase the local branch on top of the fetched branch instead of creating a merge commit."
  },
  {
    q: "You fetch but don't pull. A colleague pushed two commits to origin/main. Where are those commits stored locally?",
    options: [
      "In remote-tracking ref origin/main and the objects database",
      "Nowhere — fetch only downloads metadata but not objects",
      "In your local main branch after an automatic fast-forward",
      "In a temporary FETCH_HEAD ref that expires after one hour"
    ],
    correct: 0,
    explain: "Fetched commit objects are stored in .git/objects and the remote-tracking ref origin/main is updated to point to the new tip."
  },

  // ── git diff between commits / branches ──────────────────────────────────
  {
    q: "What does 'git diff main..feature' show?",
    options: [
      "Changes in feature that are not yet present in main",
      "Changes in main that have not been applied to feature",
      "All commits that diverge between the two branch tips",
      "The common merge-base commit between main and feature"
    ],
    correct: 0,
    explain: "main..feature shows what is in feature but not reachable from main — the changes unique to the feature branch tip."
  },
  {
    q: "How does 'git diff main...feature' (three dots) differ from the two-dot form?",
    options: [
      "Three dots diffs from the common ancestor to the feature tip",
      "Three dots shows combined changes on both branch tips together",
      "Three dots includes untracked working tree files in the output",
      "Three dots is identical to two dots when branches haven't diverged"
    ],
    correct: 0,
    explain: "Three-dot diff (A...B) compares from the merge base of A and B to B, showing only changes made in feature since it diverged from main."
  },
  {
    q: "Which command most concisely shows the diff introduced by a single specific commit?",
    options: [
      "git show <sha> to display that commit's full patch output",
      "git diff <sha>~1 <sha> to compare parent to child explicitly",
      "git log -p <sha> to print the patch for just that commit",
      "git diff HEAD <sha> to compare HEAD to the target commit"
    ],
    correct: 0,
    explain: "git show <sha> displays commit metadata and the diff it introduced, equivalent to git diff <sha>^ <sha> but in one command."
  },
  {
    q: "What does 'git diff HEAD' show when you have both staged and unstaged changes?",
    options: [
      "Only the unstaged changes not yet added to the index",
      "All modifications since HEAD — both staged and unstaged",
      "Only the staged changes that are ready to be committed",
      "Only the diff between the index and the working tree"
    ],
    correct: 1,
    explain: "git diff HEAD compares the entire working tree to the HEAD commit, including both staged and unstaged modifications."
  },

  // ── git blame / git log -S ────────────────────────────────────────────────
  {
    q: "What does 'git log -S \"password\"' search for across commit history?",
    options: [
      "Commits where the count of 'password' in files changed",
      "Commits whose message subject contains the word 'password'",
      "Files that currently contain the string 'password' anywhere",
      "Branches created after a commit mentioning the word 'password'"
    ],
    correct: 0,
    explain: "-S is the 'pickaxe' flag; it finds commits where the number of occurrences of the search string in any file changed."
  },
  {
    q: "Which command attributes each line of a source file to the commit that last modified that line?",
    options: [
      "git blame <file> to annotate each line with commit info",
      "git log --follow <file> to track file across renames",
      "git annotate --lines <file> to print line-level history",
      "git show --src-prefix <file> to display line attribution"
    ],
    correct: 0,
    explain: "git blame prefixes each line with the commit SHA, author, and timestamp of the last change to that specific line."
  },
  {
    q: "git log -S finds commits where a string's count changes. Which flag matches any diff line containing a regex instead?",
    options: [
      "-G uses a regex to match any added or removed diff line",
      "-S with --all-match broadens the search to all patterns",
      "--grep searches the full patch content for the string",
      "--pickaxe-all matches the regex against full file content"
    ],
    correct: 0,
    explain: "-G accepts a regex and matches against added or removed lines in the diff, catching occurrences that -S's count-change logic would miss."
  },
  {
    q: "'git blame' shows commit a1b2c3 introduced a suspicious line. What is the best immediate next step?",
    options: [
      "git show a1b2c3 to see the full diff of that commit",
      "git log --all to list every commit in the repository",
      "git diff a1b2c3 HEAD to see all changes since that commit",
      "git stash list to check if the code was ever stashed"
    ],
    correct: 0,
    explain: "git show a1b2c3 displays the full patch and commit metadata, revealing what else changed alongside the suspicious line."
  },
  {
    q: "Which git blame flag ignores whitespace-only changes so reformatting doesn't obscure the true change author?",
    options: [
      "-w ignores whitespace differences when attributing lines",
      "--follow tracks the file across renames in the history",
      "-M detects lines that were moved within the same file",
      "-C detects lines that were copied from other tracked files"
    ],
    correct: 0,
    explain: "-w tells git blame to skip whitespace differences, so reformatting commits don't incorrectly receive credit for logic changes."
  },

  // ── git rebase vs git merge ───────────────────────────────────────────────
  {
    q: "What is the main advantage of git rebase over git merge for integrating a feature branch?",
    options: [
      "Rebase produces a linear history without any merge commits",
      "Rebase is always faster to execute than the merge operation",
      "Rebase preserves the exact original timestamps of each commit",
      "Rebase never causes conflicts the way a merge always does"
    ],
    correct: 0,
    explain: "Rebase replays commits on top of the target, producing a straight-line history; merge creates a merge commit that preserves branch topology."
  },
  {
    q: "Which command rebases the current feature branch onto main interactively, allowing you to squash commits?",
    options: [
      "git merge --squash main to flatten all feature commits",
      "git rebase -i main from the feature branch to squash",
      "git pull --rebase --squash origin main to compress",
      "git commit --amend after fast-forwarding into main"
    ],
    correct: 1,
    explain: "git rebase -i main opens an interactive editor where you can squash, reorder, or drop commits before replaying them on main."
  },
  {
    q: "Why do rebased commits receive new SHAs even when their content and message are identical?",
    options: [
      "Rebase modifies the author email address by default",
      "Each commit's parent changes during rebase, altering its hash",
      "Git includes the rebase execution timestamp inside each SHA",
      "The commit message is automatically reformatted during rebase"
    ],
    correct: 1,
    explain: "A commit SHA is computed from its content, author, message, and parent SHA; changing the parent during rebase changes every subsequent hash."
  },
  {
    q: "Which git rebase flag stashes uncommitted changes automatically before rebasing and restores them after?",
    options: [
      "--keep-changes to preserve working tree modifications intact",
      "--autostash to stash before and restore changes after rebase",
      "--preserve-merges to handle stash entries around merge commits",
      "--no-update-refs to skip stash operations for faster execution"
    ],
    correct: 1,
    explain: "--autostash runs git stash before the rebase and git stash pop after, so a dirty working tree doesn't block the operation."
  },
  {
    q: "What does 'git rebase --abort' do when a rebase is in progress?",
    options: [
      "Deletes the current branch and checks out the main branch",
      "Cancels the rebase and restores the branch to its pre-rebase state",
      "Skips only the current conflicting commit and then continues",
      "Force-pushes the partial rebase progress to the remote branch"
    ],
    correct: 1,
    explain: "git rebase --abort stops the in-progress rebase and returns the branch and HEAD to exactly where they were before rebase began."
  },

  // ── Orphaned commits ──────────────────────────────────────────────────────
  {
    q: "Which common operation most frequently creates orphaned commits in a git repository?",
    options: [
      "git fetch from a remote with many new branches available",
      "git reset --hard moving a branch pointer back in history",
      "git stash pop on a conflicting or already-applied stash entry",
      "git merge --no-ff creating an explicit merge commit object"
    ],
    correct: 1,
    explain: "Hard reset moves the branch pointer backward, leaving the skipped commits with no ref pointing to them — they become orphaned."
  },
  {
    q: "Which git command is responsible for permanently deleting orphaned loose objects during cleanup?",
    options: [
      "git prune removes loose objects unreachable from any ref",
      "git fsck verifies object integrity but never removes objects",
      "git clean removes untracked working tree files and directories",
      "git pack-objects compresses loose objects into packfiles only"
    ],
    correct: 0,
    explain: "git prune (invoked by git gc) deletes loose objects not reachable from any ref that have passed their reflog expiry time."
  },
  {
    q: "How do you prevent an orphaned commit from being garbage collected before you finish recovering it?",
    options: [
      "Create a branch or tag pointing to the orphaned commit SHA",
      "Run git fsck --full to permanently mark the object as retained",
      "Copy the .git/objects directory to a backup location manually",
      "Push the orphaned SHA to any remote to preserve it remotely"
    ],
    correct: 0,
    explain: "Creating any named ref (branch or tag) pointing to the commit makes it reachable, so git gc will not prune it."
  },
  {
    q: "Which command scans a repository and lists all dangling (unreachable) commit objects?",
    options: [
      "git log --orphans to list all unreachable commit objects",
      "git reflog --all to show every unreachable stale reference",
      "git fsck --lost-found to identify and copy dangling objects",
      "git stash list --all to show all unreferenced stash objects"
    ],
    correct: 2,
    explain: "git fsck --lost-found finds unreachable objects and copies blobs and commits to .git/lost-found for manual recovery."
  },
  {
    q: "After finding an orphaned commit SHA in the reflog, which command creates a branch at that exact point?",
    options: [
      "git tag recover <sha> to attach a lightweight tag to it",
      "git stash apply <sha> to restore it into the working tree",
      "git merge <sha> to integrate it into the current branch",
      "git branch recovered-work <sha> to create a named branch"
    ],
    correct: 3,
    explain: "git branch <name> <sha> creates a new branch ref pointing to that commit, making it permanently reachable from a named ref."
  },

  // ── git bisect ────────────────────────────────────────────────────────────
  {
    q: "What is the primary purpose of the 'git bisect' command?",
    options: [
      "To split a large commit into several smaller atomic commits",
      "To find the exact commit that introduced a bug via binary search",
      "To compare two branches and display only their diverging commits",
      "To merge two branches together while preserving all commit metadata"
    ],
    correct: 1,
    explain: "git bisect performs a binary search through commit history, halving the search space each step to pinpoint the first bad commit."
  },
  {
    q: "What is the correct sequence of commands to begin a bisect session?",
    options: [
      "git bisect start, then bisect bad, then bisect good <sha>",
      "git bisect run bad <sha> good <sha> in a single command",
      "git bisect open --bad HEAD --good <sha> to initialize",
      "git bisect init --from <sha> --to HEAD to begin searching"
    ],
    correct: 0,
    explain: "The sequence is: git bisect start, then git bisect bad (marks HEAD as broken), then git bisect good <sha> (marks a known-clean commit)."
  },
  {
    q: "During a bisect session, git checks out a commit and you test it. If the bug is absent, what do you type?",
    options: [
      "git bisect skip to ignore this ambiguous commit result",
      "git bisect good to mark this checkout as clean and safe",
      "git bisect next to advance to the following commit up",
      "git bisect pass to continue the search without verdict"
    ],
    correct: 1,
    explain: "git bisect good tells git the current commit does not exhibit the bug, moving the lower bound of the search up."
  },
  {
    q: "Which bisect feature allows the search to run completely without manual intervention at each step?",
    options: [
      "git bisect auto --script to run silently in background",
      "git bisect run <test-script> to automate each bisect step",
      "git bisect loop --cmd <command> for automated iteration",
      "git bisect watch <command> to react to file system changes"
    ],
    correct: 1,
    explain: "git bisect run <script> runs the script at each step; exit 0 means good, nonzero means bad, automating the full search."
  },
  {
    q: "How do you end a bisect session and return your checkout to its original branch?",
    options: [
      "git bisect stop to terminate and return to main branch",
      "git bisect reset to clean up state and restore HEAD",
      "git checkout main to end bisect mode and switch back",
      "git bisect end to remove the bisect log file cleanly"
    ],
    correct: 1,
    explain: "git bisect reset cleans up all bisect state and checks out the branch you were on before starting the session."
  },

  // ── git tag ───────────────────────────────────────────────────────────────
  {
    q: "What is the key structural difference between a lightweight and an annotated git tag?",
    options: [
      "Lightweight tags are simple refs; annotated tags are full git objects",
      "Annotated tags expire after 90 days while lightweight ones persist",
      "Lightweight tags can be pushed remotely while annotated tags are local",
      "Annotated tags point to blobs while lightweight tags point to commits"
    ],
    correct: 0,
    explain: "A lightweight tag is just a named pointer to a commit; an annotated tag is a full git object storing tagger, date, message, and optional GPG signature."
  },
  {
    q: "Which command creates an annotated tag named 'v2.0' with a release message?",
    options: [
      "git tag v2.0 -a -m 'Release 2.0' to create annotated tag",
      "git tag v2.0 --note 'Release 2.0' HEAD to attach a note",
      "git tag --annotate v2.0 'Release 2.0' using long flag form",
      "git tag v2.0 --full-message 'Release 2.0' to set message"
    ],
    correct: 0,
    explain: "git tag -a <name> -m '<message>' creates an annotated tag object with the given message attached to the current HEAD commit."
  },
  {
    q: "Tags are not pushed by default. How do you push all local tags to origin at once?",
    options: [
      "git push origin --tags to send all local tags remotely",
      "git push --all to include tags together with branch refs",
      "git push origin refs/tags/* to push the tags namespace",
      "git push --follow-tags to upload all reachable tag objects"
    ],
    correct: 0,
    explain: "git push origin --tags explicitly uploads all local tags to the remote; --follow-tags only pushes annotated tags reachable from the pushed branch."
  },
  {
    q: "How do you delete a specific tag from the remote repository?",
    options: [
      "git push origin :refs/tags/<tagname> to delete remotely",
      "git tag -d <tagname> which removes it from the remote too",
      "git remote tag --delete <tagname> to remove it remotely",
      "git push --delete-tag origin <tagname> special syntax"
    ],
    correct: 0,
    explain: "Pushing an empty refspec (git push origin :refs/tags/<name>) deletes that tag ref on the remote; git push --delete origin <tag> also works."
  },

  // ── git remote --delete / push origin --delete ────────────────────────────
  {
    q: "Which command removes stale remote-tracking refs from your LOCAL repo without touching the server?",
    options: [
      "git remote prune origin to remove stale local tracking refs",
      "git branch -dr origin/feature to delete the local ref only",
      "git fetch --prune to remove stale refs during the fetch",
      "git push origin --delete feature to remove the remote branch"
    ],
    correct: 1,
    explain: "git branch -dr origin/feature removes only the local remote-tracking ref; it never contacts or modifies the remote server."
  },
  {
    q: "How do you delete a branch that exists on the remote server using git push?",
    options: [
      "git push origin :feature using an empty left-side refspec",
      "git branch -d feature locally then push to sync the state",
      "git remote branch --delete feature on the origin server",
      "git push --remove feature origin to delete it remotely"
    ],
    correct: 0,
    explain: "Pushing an empty refspec (git push origin :feature) deletes the named branch on the remote; git push origin --delete feature is the named equivalent."
  },
  {
    q: "After a teammate deletes a remote branch, your 'git branch -r' still lists it. What cleans it up?",
    options: [
      "git remote prune origin to delete stale remote-tracking refs",
      "git branch -dr origin/* to remove all remote-tracking refs",
      "git fetch --no-tags to skip stale tags during the operation",
      "git pull --all to sync all branches and remove stale ones"
    ],
    correct: 0,
    explain: "git remote prune origin (or git fetch --prune) removes remote-tracking refs for branches that no longer exist on the server."
  },

  // ── Branch tracking / upstream ────────────────────────────────────────────
  {
    q: "What does setting an upstream tracking branch on a local branch allow you to do?",
    options: [
      "Run git push and git pull with no remote or branch argument",
      "Automatically rebase every commit onto the upstream branch",
      "Mirror the remote branch locally as a read-only reference",
      "Lock the branch so only the upstream owner may push to it"
    ],
    correct: 0,
    explain: "A tracking relationship records the default remote and branch so push/pull know where to go without explicit arguments."
  },
  {
    q: "Which command pushes to origin and simultaneously sets the upstream tracking for the current branch?",
    options: [
      "git push -u origin <branch> to push and set tracking",
      "git branch --track <branch> origin/<branch> to set tracking",
      "git remote set-head origin <branch> to configure upstream",
      "git config branch.<branch>.merge to manually write tracking"
    ],
    correct: 0,
    explain: "-u (--set-upstream-to) records the remote and branch in .git/config so future push/pull commands know where to go."
  },
  {
    q: "What does 'git branch -vv' show that 'git branch -v' does not include?",
    options: [
      "The upstream tracking branch name and ahead/behind status",
      "The date and author of each branch's most recent commit",
      "The line-level diff for the most recent commit on each branch",
      "The count of untracked files in each branch's working tree"
    ],
    correct: 0,
    explain: "-vv adds upstream tracking info (e.g., [origin/main: ahead 2, behind 1]) to each branch in the listing."
  },

  // ── git restore --staged ──────────────────────────────────────────────────
  {
    q: "What does 'git restore --staged <file>' do to a staged file?",
    options: [
      "Unstages the file while keeping working tree changes intact",
      "Discards both staged and working tree changes permanently",
      "Commits only the staged portions of the specified file",
      "Moves the file from the index into a new stash entry"
    ],
    correct: 0,
    explain: "git restore --staged moves changes back out of the index (unstages them) without touching the actual file in the working tree."
  },
  {
    q: "Before 'git restore --staged' existed, which command was used to unstage a file?",
    options: [
      "git reset HEAD <file> to remove the file from staging",
      "git checkout HEAD <file> to discard working tree changes",
      "git rm --cached <file> to stop tracking the file entirely",
      "git revert HEAD --no-commit to undo the last staging step"
    ],
    correct: 0,
    explain: "git reset HEAD <file> was the unstage idiom before git restore --staged was introduced as a clearer replacement in Git 2.23."
  },
  {
    q: "How do you unstage ALL currently staged files without discarding any working tree changes?",
    options: [
      "git restore --staged . to unstage all files recursively",
      "git reset --hard HEAD to reset both index and working tree",
      "git clean -fd to remove all untracked and staged files",
      "git checkout . to reset every file to the HEAD version"
    ],
    correct: 0,
    explain: "git restore --staged . unstages all files in the current directory tree without modifying any actual file contents."
  },

  // ── git diff --staged ─────────────────────────────────────────────────────
  {
    q: "What does 'git diff --staged' compare?",
    options: [
      "Working tree changes against the last committed HEAD state",
      "The last commit against its immediate parent commit SHA",
      "All unstaged modifications relative to the current index",
      "The staged index content against the last HEAD commit"
    ],
    correct: 3,
    explain: "git diff --staged (alias --cached) shows what is in the index compared to HEAD — exactly what would be included in the next commit."
  },
  {
    q: "Which older flag is a synonym for '--staged' and still works in all git versions?",
    options: [
      "--indexed was the original comparison flag for staged content",
      "--head compared staged content to the previous HEAD ref",
      "--cached is the original name; --staged is a newer alias",
      "--committed showed staged content ready to be committed"
    ],
    correct: 2,
    explain: "--cached is the original flag name from early git; --staged was added later as a more intuitive alias for the same operation."
  },
  {
    q: "You used 'git add -p' to stage only specific hunks. Which command confirms exactly what is staged before committing?",
    options: [
      "git status --short to show which files are partially staged",
      "git log --staged to display staged content in commit form",
      "git diff --stat to see staged file summary line counts only",
      "git diff --staged to view the precise patch to be committed"
    ],
    correct: 3,
    explain: "git diff --staged shows the exact diff that will go into the next commit, letting you verify staged hunks before committing."
  },

  // ── .git directory internals ──────────────────────────────────────────────
  {
    q: "What does the file .git/HEAD normally contain when you are on the main branch?",
    options: [
      "The latest commit SHA on main stored as a raw hash",
      "The plain text word 'main' identifying the branch name",
      "A symref string: ref: refs/heads/main pointing to the branch",
      "The remote URL for origin stored as a plain text line"
    ],
    correct: 2,
    explain: "When on a branch, .git/HEAD contains a symbolic ref like 'ref: refs/heads/main', not a direct SHA (which would indicate detached HEAD)."
  },
  {
    q: "Where does git store the SHA that a local branch ref like 'main' currently points to?",
    options: [
      "In .git/refs/heads/main or inside .git/packed-refs",
      "In .git/HEAD whenever the main branch is checked out",
      "In .git/config under the branch.main.merge setting",
      "In .git/index alongside the staged file metadata entries"
    ],
    correct: 0,
    explain: "Branch refs are stored as files under .git/refs/heads/ or packed into .git/packed-refs when git packs loose refs."
  },
  {
    q: "What type of object does git store in .git/objects when you run 'git add' on a file?",
    options: [
      "A commit object linking tree to author and parent commits",
      "A blob object containing the file's content at that moment",
      "A tree object describing the directory structure snapshot",
      "A tag object referencing the file with a version label"
    ],
    correct: 1,
    explain: "git add creates a blob object in .git/objects containing the file's content, identified by the SHA-1 of its content."
  },
  {
    q: "The .git/ORIG_HEAD file is created by which type of operation?",
    options: [
      "git add, to record the pre-staging HEAD reference backup",
      "git fetch, to store the remote HEAD before downloading",
      "git merge or reset, to save HEAD before a risky operation",
      "git commit, to record the parent SHA before writing objects"
    ],
    correct: 2,
    explain: "ORIG_HEAD is written by commands like merge, rebase, and reset to record the pre-operation HEAD, making it easy to undo."
  },
  {
    q: "What information is stored in the .git/config file that is specific to the local repository?",
    options: [
      "Remote URLs, branch tracking relationships, and local settings",
      "The commit graph and object pack index for fast lookups",
      "User name and email set via git config --global settings",
      "Hook scripts and their enabled or disabled execution status"
    ],
    correct: 0,
    explain: ".git/config stores local repository settings: remote URLs, branch tracking (upstream) config, and any repository-scoped git settings."
  },

  // ── git switch -c vs git branch ───────────────────────────────────────────
  {
    q: "What does 'git switch -c new-feature' do that 'git branch new-feature' alone does not?",
    options: [
      "Creates the branch AND immediately switches to it",
      "Creates the branch with a remote upstream already set",
      "Creates the branch from origin/main instead of HEAD",
      "Creates the branch and stages all current working changes"
    ],
    correct: 0,
    explain: "git switch -c creates a new branch AND checks it out in one step; git branch only creates it without switching."
  },
  {
    q: "Which older command does 'git switch -c <branch>' replace in modern git (2.23+)?",
    options: [
      "git checkout -b <branch> which created and switched branches",
      "git branch -m <branch> which renamed the current branch",
      "git checkout --orphan <branch> for orphan branch creation",
      "git branch --create-track <branch> for tracked branches"
    ],
    correct: 0,
    explain: "git switch -c replaces the git checkout -b pattern, separating branch-switching from file-restoring into distinct commands."
  },
  {
    q: "How do you use 'git switch' to return to the previously checked-out branch?",
    options: [
      "git switch - using the dash shorthand for the previous branch",
      "git switch HEAD~1 to go back one commit in the history",
      "git switch --back to toggle between the last two branches",
      "git switch @{-1} to reference the previous branch explicitly"
    ],
    correct: 0,
    explain: "git switch - is the shorthand for switching back to the previously checked-out branch, mirroring the cd - shell idiom."
  },

  // ── Merge commit vs fast-forward ─────────────────────────────────────────
  {
    q: "When does git perform a fast-forward merge instead of creating a merge commit?",
    options: [
      "When the current branch is a direct ancestor of the branch being merged",
      "When both branches have the exact same number of commits total",
      "When the merged branch was originally created from the current branch",
      "When the --no-ff flag is explicitly omitted from the merge command"
    ],
    correct: 0,
    explain: "Fast-forward happens when there's a linear path from the current HEAD to the tip of the merged branch — no divergence to reconcile."
  },
  {
    q: "Which flag forces git to always create a merge commit even when fast-forward is possible?",
    options: [
      "git merge --ff-only to require fast-forward or abort",
      "git merge --no-ff to always create a merge commit",
      "git merge --squash to collapse all commits into one",
      "git merge --rebase to replay commits instead of merging"
    ],
    correct: 1,
    explain: "--no-ff (no fast-forward) always creates an explicit merge commit, preserving the record that a feature branch was merged."
  },
  {
    q: "What advantage does a merge commit provide over a fast-forward merge in project history?",
    options: [
      "Merge commits make git log --all run significantly faster",
      "Merge commits preserve context that a feature branch existed",
      "Merge commits reduce the total number of objects in git storage",
      "Merge commits enable git bisect to work across branch boundaries"
    ],
    correct: 1,
    explain: "A merge commit records the fact that a feature branch was developed separately and integrated at a specific point, preserving team workflow visibility."
  },
  {
    q: "Which flag makes git merge abort if a fast-forward is NOT possible, instead of creating a merge commit?",
    options: [
      "git merge --ff-only aborts if fast-forward is not possible",
      "git merge --no-ff always creates a commit regardless of path",
      "git merge --abort cancels an in-progress conflicted merge",
      "git merge --squash collapses commits but still merges them"
    ],
    correct: 0,
    explain: "--ff-only succeeds only when the merge can be done as a fast-forward; it refuses to create a merge commit, keeping history linear."
  },

  // ── git clean -fd dangers ─────────────────────────────────────────────────
  {
    q: "What does 'git clean -fd' permanently remove from your working tree?",
    options: [
      "All untracked files and untracked directories recursively",
      "All staged files that have been added to the index",
      "All tracked files that have uncommitted local modifications",
      "All empty directories that are not referenced in .gitignore"
    ],
    correct: 0,
    explain: "git clean -fd removes all untracked files (-f) and untracked directories (-d); this is irreversible unless you have backups."
  },
  {
    q: "Which git clean flag additionally removes files listed in .gitignore?",
    options: [
      "-x to also remove files matched by .gitignore patterns",
      "-n to perform a dry run without deleting anything yet",
      "-i to launch an interactive selection before cleaning",
      "-e to exclude specific patterns from the clean operation"
    ],
    correct: 0,
    explain: "-x removes both untracked files AND ignored files; useful for cleaning build artifacts but dangerous because ignored files are also deleted."
  },
  {
    q: "How do you safely preview what 'git clean -fd' would delete before actually running it?",
    options: [
      "git clean -fdn or git clean --dry-run to preview deletions",
      "git status --untracked=all to list untracked files only",
      "git diff --name-only HEAD to compare working tree to HEAD",
      "git ls-files --others to list only untracked file names"
    ],
    correct: 0,
    explain: "git clean -n (or --dry-run) lists what would be removed without actually deleting anything, letting you verify before committing."
  },

  // ── Rewriting history on shared branches ─────────────────────────────────
  {
    q: "Why is rewriting history on a shared branch (e.g., git rebase, git commit --amend) considered harmful?",
    options: [
      "It changes commit SHAs, breaking history for everyone who has pulled",
      "It permanently deletes all commit messages from the repository",
      "It disables the ability to create pull requests for that branch",
      "It forces git to re-download all objects from the remote server"
    ],
    correct: 0,
    explain: "Rewriting commits changes their SHAs; anyone who pulled the old SHAs will have divergent history and face confusing conflicts."
  },
  {
    q: "Which command creates a SAFE undo of a bad commit on a shared branch without rewriting history?",
    options: [
      "git reset --soft HEAD~1 to move the branch pointer back",
      "git revert HEAD to create a new commit that reverses changes",
      "git rebase -i HEAD~1 to drop the commit interactively",
      "git commit --amend to modify the most recent commit content"
    ],
    correct: 1,
    explain: "git revert creates a new commit that undoes the changes without altering existing history, keeping teammates' clones valid."
  },
  {
    q: "A colleague pulled a branch before you rebased it. What must they do to realign with the rewritten branch?",
    options: [
      "git fetch only, because fetch automatically resolves history",
      "git reset --hard origin/<branch> after fetching to realign",
      "git merge origin/<branch> to integrate the rewritten commits",
      "git stash then pull to safely apply the rebase over stash"
    ],
    correct: 1,
    explain: "After a remote rebase, the colleague must hard-reset to origin/<branch> after fetching; a regular pull would try to merge diverged histories."
  },
  {
    q: "Which git hook on the server can prevent force-pushes that rewrite history on protected branches?",
    options: [
      "The pre-receive hook can reject non-fast-forward push updates",
      "The commit-msg hook checks commit messages before accepting",
      "The post-merge hook audits changes after a merge completes",
      "The update hook only modifies refs during a push operation"
    ],
    correct: 0,
    explain: "A pre-receive hook runs before refs are updated; it can inspect the push and reject non-fast-forward (history-rewriting) updates."
  },

  // ── Additional coverage questions (mixed topics) ──────────────────────────
  {
    q: "NIGHTSHADE used 'git commit --amend' after pushing to origin. What problem does this cause teammates?",
    options: [
      "The amended commit gets a new SHA, breaking teammates' histories",
      "The original commit is permanently deleted from the remote server",
      "The amend operation locks the branch for other users globally",
      "Git refuses to amend if the commit is already on the remote"
    ],
    correct: 0,
    explain: "Amending a pushed commit changes its SHA; teammates who pulled the original commit now have divergent history that requires manual resolution."
  },
  {
    q: "Which command shows you the exact content of a commit object including tree, parent, and author info?",
    options: [
      "git show <sha> to display the commit and its diff content",
      "git cat-file -p <sha> to pretty-print the raw git object",
      "git log -1 <sha> to show one commit's standard log entry",
      "git diff-tree <sha> to show the tree diff for that commit"
    ],
    correct: 1,
    explain: "git cat-file -p <sha> pretty-prints the raw git object, revealing tree SHA, parent SHA, author, committer, and message fields."
  },
  {
    q: "What does 'git log --graph --oneline --decorate --all' display?",
    options: [
      "An ASCII graph of all refs with condensed one-line entries",
      "A table of all commits sorted by author date descending",
      "A unified diff of all branches compared to the main branch",
      "A list of all remotes and their configured fetch URLs only"
    ],
    correct: 0,
    explain: "This combination shows a compact ASCII commit graph for all refs with branch/tag decorations on relevant commits."
  },
  {
    q: "git reflog entries expire independently from the regular gc.reflogExpire. Entries for unreachable commits expire after how long by default?",
    options: [
      "60 days via the gc.reflogExpireUnreachable setting",
      "30 days via the gc.reflogExpireUnreachable setting",
      "90 days via the gc.reflogExpireUnreachable setting",
      "14 days via the gc.reflogExpireUnreachable setting"
    ],
    correct: 1,
    explain: "gc.reflogExpireUnreachable defaults to 30 days for unreachable commits, shorter than the 90-day default for reachable ones."
  },
  {
    q: "Which git diff option shows only the names of changed files without any line-level diff content?",
    options: [
      "--name-only to list just the filenames that changed",
      "--stat to show filenames with insertion and deletion counts",
      "--summary to print a brief summary of changes made",
      "--compact to suppress verbose output in the diff display"
    ],
    correct: 0,
    explain: "--name-only prints just the paths of files that changed between the two refs, without any diff content."
  },
  {
    q: "Which command lets you apply a stash to the working tree without removing it from the stash list?",
    options: [
      "git stash apply stash@{N} to apply without popping it",
      "git stash pop stash@{N} to apply and remove the entry",
      "git stash show stash@{N} to apply the stored changes",
      "git stash branch <name> to apply and convert to a branch"
    ],
    correct: 0,
    explain: "git stash apply leaves the stash entry in the list after applying; git stash pop applies and removes it automatically."
  },
  {
    q: "What does 'git log --follow -- <file>' do that plain 'git log -- <file>' does not?",
    options: [
      "--follow tracks the file's history across file renames",
      "--follow shows the full diff for each commit touching that file",
      "--follow includes commits that only modified file permissions",
      "--follow shows commits from all branches not just the current one"
    ],
    correct: 0,
    explain: "--follow continues tracking the log through file renames, so you see the complete history even when the file was renamed."
  },
  {
    q: "What is a fast-forward merge's primary disadvantage compared to a --no-ff merge commit?",
    options: [
      "It erases the visual record that a feature branch existed",
      "It always causes conflicts because branches are being joined",
      "It creates extra merge objects that bloat the git object store",
      "It prevents future rebasing of the merged commits onto other branches"
    ],
    correct: 0,
    explain: "Fast-forward moves the branch pointer directly, leaving no merge commit to show that a feature was developed in isolation and then integrated."
  },
  {
    q: "You need to recover work after accidentally running 'git reset --hard HEAD'. Which is the fastest recovery path?",
    options: [
      "git reflog to find the previous HEAD SHA then checkout",
      "git fsck --lost-found to scan and recover all objects",
      "git stash list to find the work saved in the stash",
      "git log --all to search all branch refs for the commit"
    ],
    correct: 0,
    explain: "git reflog shows HEAD's position immediately before the reset, giving you the SHA to branch off of or cherry-pick from."
  },
  {
    q: "Which command deletes a remote named 'staging' from your local git config entirely?",
    options: [
      "git remote remove staging to delete the remote config entry",
      "git push staging --delete to remove the staging server ref",
      "git remote prune staging to clean up its tracking branches",
      "git config --unset remote.staging.url to clear its URL"
    ],
    correct: 0,
    explain: "git remote remove <name> removes the remote's entry from .git/config including all associated tracking branch configurations."
  }
];
