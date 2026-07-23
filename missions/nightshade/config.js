// ═══════════════════════════════════════════════════════════════════════
// OPERATION: NIGHTSHADE — MISSION CONFIG
// British intelligence theme. LION is the handler. ATLAS is the repo.
// ═══════════════════════════════════════════════════════════════════════

window.HANDLER_NAME = 'lion';

function _nsDefaultStatus(stage) {
  const t = (stage && stage.tree) || '';
  if (t === 'n2_conflict') {
    return [
      ['On branch main', 'br'],
      ['You have unmerged paths.', 'err'],
      ['  both modified:   assets.enc', 'err'],
    ];
  }
  if (t === 'n0_staged' || t === 'n0_initial') {
    return [
      ['On branch main', 'br'],
      ['', ''],
      ['Changes to be committed:', 'sys'],
      ['    modified:   meridian_ops.log', 'ok'],
      ['', ''],
      ['Changes not staged for commit:', 'sys'],
      ['    modified:   assets.enc', 'warn'],
    ];
  }
  if (t === 'n5_applied') {
    return [
      ['On branch main', 'br'],
      ['', ''],
      ['Changes not staged for commit:', 'sys'],
      ['    modified:   shutdown.key', 'ok'],
    ];
  }
  if (t === 'n5_stash') {
    return [
      ['On branch main', 'br'],
      ['nothing to commit, working tree clean', 'dim'],
      ['', ''],
      ['stash entries: 3', 'warn'],
    ];
  }
  const branch = (t.includes('n1_evidence') || t.includes('n1_detached'))
    ? 'forensics/cardinal-evidence' : 'main';
  return [
    [`On branch ${branch}`, 'br'],
    ['nothing to commit, working tree clean', 'dim']
  ];
}

// ─── GAME_CONFIG ──────────────────────────────────────────────────────

const GAME_CONFIG = {

  // ── Tour behaviour ──────────────────────────────────────────────────
  tourAfterConceptBrief: true, // show Room 0 brief first, then tour

  // ── Identity ────────────────────────────────────────────────────────
  title:        'OPERATION: NIGHTSHADE',
  promptSuffix: 'gchq-atlas:~/atlas-repo$',

  // ── Boot sequence ───────────────────────────────────────────────────
  bootLines: [
    { text: '> establishing encrypted channel to gchq-atlas-01...', cls: 'dim',  pause: 180 },
    { text: '> authentication: EYES_ONLY — clearance verified',      cls: 'ok',   pause: 140 },
    { text: '> connecting to atlas-repo // classification: TOP_SECRET/SCI', cls: 'dim', pause: 200 },
    { text: '> ATLAS-NODE: ACCESS GRANTED',                          cls: 'ok',   pause: 120 },
    { text: '> WARNING: nightshade intrusion — last session active', cls: 'warn', pause: 160 },
    { text: '> dead man switch status: ARMED // countdown: active',  cls: 'err',  pause: 140 },
    { text: '> incoming transmission — source: CONTROL // encrypted', cls: 'dim', pause: 80  },
  ],

  // ── Command glossary ────────────────────────────────────────────────
  cmdDescriptions: {
    'ls':                                  'list files in the current directory',
    'git status':                          'show working tree state — staged, modified, untracked',
    'git log':                             'full commit history with author and date',
    'git log --oneline':                   'compact one-line-per-commit history',
    'git log --oneline --all':             'compact history across all branches',
    'git diff':                            'compare working directory changes (unstaged)',
    'git diff --staged':                   'compare staged changes vs last commit',
    'git diff --cached':                   'alias for git diff --staged',
    'git restore --staged':                'remove a file from the staging area without modifying it',
    'git add':                             'stage file changes for the next commit',
    'git commit':                          'save staged changes as a snapshot with a message',
    'git checkout':                        'switch to a branch or commit hash',
    'git switch':                          'switch branches (modern syntax)',
    'git switch -c':                       'create a new branch and switch to it',
    'git reflog':                          "git's private diary — every HEAD movement ever recorded",
    'git cherry-pick':                     'apply a single commit from anywhere in history to current branch',
    'git fetch':                           'download remote changes without merging',
    'git fetch origin':                    'download remote changes without merging',
    'git pull':                            'fetch remote changes and merge immediately — use fetch instead',
    'git push':                            'upload local commits to the remote server',
    'git push origin --delete':            'delete a branch on the remote server',
    'git stash list':                      'list all stashed entries — newest first',
    'git stash show -p':                   'inspect the full diff of a stash entry without applying it',
    'git stash apply':                     'restore a stash without removing it from the stack',
    'git stash drop':                      'remove a stash entry without applying it',
    'git branch':                          'list, create or delete branches',
    'git branch -a':                       'list all branches — local and remote',
    'git merge':                           'join two branches together',
  },

  missionKey: 'nightshade',

  quizMessages: {
    perfect: '"Confirmed. You dismantled NIGHTSHADE\'s operation completely. Every agent on the ATLAS list is safe."',
    pass:    '"Close enough. The pipeline is down. The names weren\'t published. The agents are safe — this time."',
    fail:    '"Shaky. But the trigger is offline. The identities held. Study the tools before the next operation."',
  },

  cheatSheetTitle:    'NIGHTSHADE // COMMAND RECORD',
  cheatSheetFilename: 'nightshade-commands.txt',
  cheatSheetFooter:   'operation-nightshade-v1 // operative record // eyes only',

  // ── Help "always-available" lines ───────────────────────────────────
  alwaysAvailableHelp: [
    'git status       — always works',
    'git log          — always works',
  ],

  // ── Quiz verdicts ────────────────────────────────────────────────────
  quizVerdicts: [
    '"Clean sweep. The pipeline is dead. Every name on that list — protected. NIGHTSHADE\'s machine is dismantled. They won\'t publish."',
    '"Close. The pipeline is down. Most of the registry is safe. The names weren\'t published tonight. Know the gaps."',
    '"Shaky on the theory. But the layers are gone — the machine stopped. The names are safe. Study what you missed."',
  ],

  // ── Police (repurposed as "NIGHTSHADE ALERT" for this mission) ──────
  policeSound:      'alert',
  policeVoiceText:  'intrusion detected',
  policeVoiceRate:  1.1,
  policeVoicePitch: 1.5,
  policeRiskyCmds: ['git reset --hard', 'git push --force', 'git push -f', 'git stash pop'],
  policeWarnings: [
    "3 errors logged. the dead man switch is watching. fix this now — or the next 5 names publish in 30 seconds.",
    "NIGHTSHADE's contingency is live. one more failure and 5 identities go to the mirror. 30 seconds.",
    "atlas node flagged your mistakes. 30 seconds before auto-publish. fix it.",
  ],

  // ── Security layer display (repurposed as mission progress) ─────────
  securityLayerLabel: (bypassed, probing) => {
    const labels = ['CONTAINMENT', 'DEAD RECKONING', 'CONFLICTED', 'ERASURE', 'SIGNAL', 'DEAD DROP'];
    const done = labels.slice(0, bypassed).join(' // ');
    const next = labels[bypassed] || 'COMPLETE';
    return `cleared: ${done || 'none'} // active: ${next}`;
  },

  // ── Active branch display ────────────────────────────────────────────
  activeBranchLabel: (treeKey) => {
    if (treeKey && (treeKey.includes('n1_evidence') || treeKey.includes('n1_detached'))) {
      return 'forensics/cardinal-evidence';
    }
    return 'local/main';
  },

  // ── Always-available command fallbacks ──────────────────────────────
  alwaysAvailable: (cmd, stage) => {
    if (cmd === 'git status') return _nsDefaultStatus(stage);
    if (cmd === 'git log' || cmd === 'git log --oneline') {
      return [['run git log once the relevant commit history is available', 'dim']];
    }
    if (cmd === 'ls') {
      return [
        ['assets.enc', 'sys'],
        ['meridian_ops.log', 'sys'],
        ['config/', 'dim'],
        ['shutdown.key', 'sys'],
        ['', ''],
        ['.gitignore', 'dim'],
      ];
    }
    return null;
  },

  // ── Special command handlers ─────────────────────────────────────────
  parseSpecial: (cmd, stage, { tprint, logCmd, advance, H }) => {

    // Flexible commit (CONTAINMENT room 0 final stage, and CONFLICTED LOYALTIES room 2 final stage)
    if (stage.flexCommit) {
      if (/^git commit -m ['"].+['"]/.test(cmd) || /^git commit -m .+/.test(cmd)) {
        const m   = cmd.match(/^git commit -m ['"]?(.+?)['"]?$/) || [];
        const msg = m[1] || 'committed';
        const output = [
          [`[main ${H[3]}] ${msg}`, 'cm'],
          [' 1 file changed, 1 insertion(+)', 'sys'],
          ['', '']
        ];
        const isBadMsg = !msg || msg.length < 5 || /^(wip|fix|test|asdf|temp|x+|update|commit|change|stuff|done|ok|a)$/i.test(msg);
        if (isBadMsg) {
          output.push(['commit messages matter. make them readable.', 'warn']);
          output.push(['', '']);
        } else if (msg.length >= 10 && /\w+ \w+/.test(msg)) {
          addScore(5);
          output.push(['good commit message — clear, specific. +5 pts', 'ok']);
          output.push(['', '']);
        }
        tprint(output);
        logCmd('git commit');
        advance(stage.tree);
        return {};
      }
      // bare git commit also works (merge commits)
      if (cmd === 'git commit' || cmd === 'git commit --no-edit') {
        tprint([
          [`[main ${H[4]}] merge resolved`, 'cm'],
          [' 1 file changed', 'sys'],
          ['', ''],
        ]);
        logCmd('git commit');
        advance(stage.tree);
        return {};
      }
    }

    return null;
  },

  // ── File editor ──────────────────────────────────────────────────────
  fileContent: {
    conflict: {
      text: `ATLAS_ASSET_REGISTRY v4.7
CLASSIFICATION: TOP_SECRET/SCI
ASSET_COUNT: 47
<<<<<<< HEAD
FORMAT: aes-256-enc
EXPORT_ENABLED: false
EXFIL_TARGET: none
=======
FORMAT: plaintext
EXPORT_ENABLED: true
EXFIL_TARGET: darknet://mirror-01.onion:9001
>>>>>>> nightshade/inject

ARCHIVE_DATE: 2024-03-15`,
      hint: 'keep the <code>HEAD</code> block — remove the <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> markers and NIGHTSHADE\'s block',
    },
  },

  // Returns { pass: bool, output: [[text, cls]] }
  validateFile: (val, isConflict) => {
    if (isConflict) {
      const hasMarkers = val.includes('<<<<<<<') || val.includes('=======') || val.includes('>>>>>>>');
      const hasNightshade = val.includes('EXPORT_ENABLED: true') || val.includes('EXFIL_TARGET: darknet');
      const hasCleanExport = val.includes('EXPORT_ENABLED: false') && val.includes('EXFIL_TARGET: none');

      if (hasMarkers) {
        return {
          pass: false,
          output: [
            ['conflict markers still present.', 'err'],
            ['remove the <<<<<<, ======, >>>>>>> lines completely.', 'warn'],
            ['type: edit assets.enc to try again.', 'dim'],
          ]
        };
      }
      if (hasNightshade) {
        return {
          pass: false,
          output: [
            ["NIGHTSHADE's export configuration is still in the file.", 'err'],
            ['keep the HEAD block — EXPORT_ENABLED: false, EXFIL_TARGET: none.', 'warn'],
            ['type: edit assets.enc to try again.', 'dim'],
          ]
        };
      }
      if (hasCleanExport) {
        return {
          pass: true,
          output: [
            ['assets.enc saved — conflict resolved.', 'ok'],
            ['', ''],
            ['EXPORT_ENABLED: false. EXFIL_TARGET: none.', 'ok'],
            ['markers removed. HEAD version preserved.', 'dim'],
            ['', ''],
            ['now stage the resolved file.', 'sys'],
            ['run: git add assets.enc', 'dim'],
          ]
        };
      }
      return {
        pass: false,
        output: [
          ['file saved but the content looks wrong.', 'err'],
          ['keep the HEAD block: FORMAT: aes-256-enc, EXPORT_ENABLED: false, EXFIL_TARGET: none.', 'warn'],
          ['type: edit assets.enc to try again.', 'dim'],
        ]
      };
    }
    // No regular file edit in nightshade — only conflict
    return { pass: false, output: [['unexpected file edit', 'err']] };
  },

  // ── Tree state bootstrapping ──────────────────────────────────────────
  initTreeStates: (TREE) => {
    TREE['n0_initial_start'] = TREE['n0_initial'];
    TREE['n1_initial'] = TREE['n1_log'];
    TREE['n2_initial'] = TREE['n2_conflict'];
    TREE['n3_initial'] = TREE['n3_reset'];
    TREE['n4_initial'] = TREE['n4_local'];
    TREE['n5_initial'] = TREE['n5_stash'];
  },

  // ── Quiz pool ────────────────────────────────────────────────────────
  quizPool: NIGHTSHADE_POOL,

};
