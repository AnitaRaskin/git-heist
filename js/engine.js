// ═══════════════════════════════════════════════════════════════════════
// RUNTIME HASH GENERATION — each session gets unique commit IDs
// ═══════════════════════════════════════════════════════════════════════

function genHash() {
  const chars = '0123456789abcdef';
  return Array.from({length: 7}, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// H[1]–H[8] replace hardcoded hashes throughout data.js
// H[1] vault schematics commit (Room 1 checkout target + Room 7 log)
// H[2] wrong/decoy commit (Room 1 log decoy, wrong command)
// H[3] maintenance window commit (stash messages, commit output)
// H[4] bad temp-fix commit (Room 7 git show target, Room 8 revert target)
// H[5]–H[8] decorative entries in git log output
const H = [''].concat(Array.from({length: 8}, genHash));

function interp(s) {
  if (typeof s !== 'string') return s;
  return s
    .replace(/\{\{H1\}\}/g, H[1])
    .replace(/\{\{H2\}\}/g, H[2])
    .replace(/\{\{H3\}\}/g, H[3])
    .replace(/\{\{H4\}\}/g, H[4])
    .replace(/\{\{H5\}\}/g, H[5])
    .replace(/\{\{H6\}\}/g, H[6])
    .replace(/\{\{H7\}\}/g, H[7])
    .replace(/\{\{H8\}\}/g, H[8]);
}


const G = {
  roomIdx:       0,
  stageIdx:      0,
  hintsUsed:     0,
  totalHints:    0,
  hintLevel:     0,
  roomStart:     0,
  missionStart:  0,
  fileEditDone:  false,
  score:         0,
  stageWrongs:   0,   // wrong attempts this stage (first is free)
  stageHintLevel: -1, // highest hint level charged this stage (-1 = none charged)
  clues: [],
  savedProgress: JSON.parse(localStorage.getItem('vz_progress') || '{}')
};

// ═══════════════════════════════════════════════════════════════════════
// COMMAND LOG / CHEAT SHEET
// ═══════════════════════════════════════════════════════════════════════

let cmdLog = [];

const CMD_DESCRIPTIONS = {
  'ls':                  'list files in the current directory',
  'git status':          'show working tree state (modified, staged, untracked)',
  'git log --oneline':   'compact commit history',
  'git log':             'full commit history with author and date',
  'git branch -a':       'list all branches — local and remote',
  'git checkout':        'switch to a branch or commit',
  'git switch':          'switch branches',
  'git checkout -b':     'create a new branch and switch to it',
  'git switch -c':       'create a new branch and switch to it',
  'git stash':           'hide uncommitted changes temporarily',
  'git stash push':      'hide uncommitted changes temporarily',
  'git stash list':      'list all stashed changes',
  'git stash pop':       'restore latest stash and remove it from the list',
  'git stash apply':     'restore latest stash (keeps it in the list)',
  'git pull':            'fetch remote changes and merge them locally',
  'git add':             'stage file changes for the next commit',
  'git commit':          'save staged changes as a snapshot with a message',
  'git push':            'upload local commits to the remote server',
  'git show':            'inspect a specific commit\'s changes',
  'git diff':            'compare working directory or commits',
  'git clean -fd':       'remove untracked files and directories',
  'git clean -f':        'remove untracked files',
  'git restore':         'discard working directory changes for a file',
  'git revert':          'safely undo a commit on a shared branch',
  'git remote -v':       'show remote server connections',
  'gh repo fork':        'fork a repo to your own account',
  'git clone':           'download a repo to your local machine',
};

function logCmd(raw) {
  const key = Object.keys(CMD_DESCRIPTIONS).find(k => raw === k || raw.startsWith(k + ' '));
  if (!key) return;
  if (!cmdLog.find(e => e.cmd === key)) {
    cmdLog.push({ cmd: key, desc: CMD_DESCRIPTIONS[key] });
  }
}

function openCheatSheet() {
  const list = document.getElementById('cheatList');
  list.innerHTML = '';
  if (cmdLog.length === 0) {
    list.innerHTML = '<div class="cheat-empty">no commands logged yet. complete a stage to start building your record.</div>';
  } else {
    cmdLog.forEach(({ cmd, desc }) => {
      const row = document.createElement('div');
      row.className = 'cheat-row';
      row.innerHTML = `<span class="cheat-cmd">${cmd}</span><span class="cheat-desc">${desc}</span>`;
      list.appendChild(row);
    });
  }
  document.getElementById('cheatSheet').classList.add('open');
}

function closeCheatSheet() {
  document.getElementById('cheatSheet').classList.remove('open');
  inp.focus();
}

function downloadCheatSheet() {
  const lines = ['GIT HEIST // COMMAND RECORD', '═'.repeat(40), ''];
  cmdLog.forEach(({ cmd, desc }) => {
    lines.push(`  ${cmd.padEnd(28)}${desc}`);
  });
  lines.push('', '═'.repeat(40), 'git-heist-v1 // operative record');
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'git-heist-commands.txt';
  a.click();
}

function room()  { return ROOMS[G.roomIdx]; }
function stage() { return room().stages[G.stageIdx]; }


// ═══════════════════════════════════════════════════════════════════════
// LIVE SCORE
// ═══════════════════════════════════════════════════════════════════════

function addScore(delta) {
  const chip = document.getElementById('scoreChip');
  const el   = document.getElementById('scoreVal');
  if (!chip || !el) return;

  const from   = G.score;
  G.score      = Math.max(0, G.score + delta);
  const actual = G.score - from; // might differ if floor hit
  if (actual === 0) return;

  // Flash colour
  const cls = actual > 0 ? 'gaining' : 'dropping';
  chip.classList.remove('gaining', 'dropping');
  void chip.offsetWidth;
  chip.classList.add(cls);
  setTimeout(() => chip.classList.remove(cls), 700);

  // Floating delta indicator
  showScoreDelta(actual);

  // Tick the number
  const frameDelay = Math.abs(actual) <= 1 ? 0 : Math.abs(actual) <= 5 ? 50 : 35;
  let current = from;
  function tick() {
    current += actual > 0 ? 1 : -1;
    el.textContent = current;
    if (current !== G.score) setTimeout(tick, frameDelay);
  }
  tick();
}

function showScoreDelta(delta) {
  const chip = document.getElementById('scoreChip');
  if (!chip) return;
  const ind = document.createElement('div');
  ind.className = 'score-delta ' + (delta > 0 ? 'pos' : 'neg');
  ind.textContent = (delta > 0 ? '+' : '') + delta;
  chip.appendChild(ind);
  setTimeout(() => ind.remove(), 850);
}

function countWrong() {
  G.stageWrongs++;
  if (G.stageWrongs >= 2) addScore(-1);
  if (G.stageWrongs === POLICE_TRIGGER_WRONGS) triggerPolice();
}


// ═══════════════════════════════════════════════════════════════════════
// POLICE MECHANIC
// ═══════════════════════════════════════════════════════════════════════

const POLICE_SECONDS        = 30;
const POLICE_TRIGGER_WRONGS = 3;
const POLICE_RISKY_CMDS     = ['git reset --hard', 'git push --force', 'git push -f'];
const POLICE_WARNINGS       = [
  "scanner picked up anomalies. you've got 30 seconds to complete this step. move.",
  "IDS alert — they're watching. 30 seconds. don't freeze.",
  "police bot flagged your session. 30 seconds. finish the step.",
];

let policeActive      = false;
let policeSecondsLeft = 0;
let policeIntervalId  = null;
let footstepId        = null;
let voiceTriggered    = false;
let audioCtx          = null;

function getAudioCtx() {
  if (!audioCtx) {
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}

function playFootstep() {
  const ctx = getAudioCtx();
  if (!ctx) return;
  try {
    const sr  = ctx.sampleRate;
    const now = ctx.currentTime;

    // Low thud (body of step)
    const tbuf = ctx.createBuffer(1, Math.floor(sr * 0.08), sr);
    const td   = tbuf.getChannelData(0);
    for (let i = 0; i < td.length; i++) td[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.018));
    const tsrc = ctx.createBufferSource();
    tsrc.buffer = tbuf;
    const tlpf = ctx.createBiquadFilter();
    tlpf.type = 'lowpass'; tlpf.frequency.value = 160; tlpf.Q.value = 0.5;
    const tg = ctx.createGain();
    tg.gain.setValueAtTime(0.6, now);
    tsrc.connect(tlpf); tlpf.connect(tg); tg.connect(ctx.destination);
    tsrc.start(now);

    // High click (shoe on hard floor)
    const cbuf = ctx.createBuffer(1, Math.floor(sr * 0.012), sr);
    const cd   = cbuf.getChannelData(0);
    for (let i = 0; i < cd.length; i++) cd[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sr * 0.002));
    const csrc = ctx.createBufferSource();
    csrc.buffer = cbuf;
    const chpf = ctx.createBiquadFilter();
    chpf.type = 'highpass'; chpf.frequency.value = 1500;
    const cg = ctx.createGain();
    cg.gain.setValueAtTime(0.2, now + 0.008);
    csrc.connect(chpf); chpf.connect(cg); cg.connect(ctx.destination);
    csrc.start(now + 0.008);
  } catch(e) {}
}

function stopPoliceAudio() {
  if (footstepId) { clearInterval(footstepId); footstepId = null; }
  voiceTriggered = false;
  try { if (window.speechSynthesis) window.speechSynthesis.cancel(); } catch(e) {}
}

function triggerPolice(skipMsg) {
  if (policeActive) return;
  policeActive      = true;
  policeSecondsLeft = POLICE_SECONDS;
  voiceTriggered    = false;

  if (!skipMsg) {
    const msg = POLICE_WARNINGS[G.stageWrongs % POLICE_WARNINGS.length];
    setTimeout(() => foxMsg(msg, 'sys'), 100);
  }

  const alertEl = document.getElementById('policeAlert');
  alertEl.classList.add('active');
  alertEl.classList.remove('urgent-mode');
  document.querySelector('.terminal-panel').classList.add('police-active');
  document.querySelector('.terminal-panel').classList.remove('police-urgent');
  document.getElementById('policeVignette').classList.remove('active');
  updatePoliceUI();

  policeIntervalId = setInterval(() => {
    policeSecondsLeft--;
    updatePoliceUI();
    if (policeSecondsLeft <= 0) policeRaid();
  }, 1000);
}

function clearPolice(silent) {
  if (!policeActive) return;
  policeActive = false;
  clearInterval(policeIntervalId);
  policeIntervalId = null;
  stopPoliceAudio();
  const alertEl = document.getElementById('policeAlert');
  alertEl.classList.remove('active', 'urgent-mode');
  document.getElementById('policeVignette').classList.remove('active');
  document.querySelector('.terminal-panel').classList.remove('police-active', 'police-urgent');
  if (!silent) setTimeout(() => foxMsg('clean. they moved on.', 'sys'), 200);
}

function policeRaid() {
  clearPolice(true);
  addScore(-10);
  setTimeout(() => foxMsg("too slow. they logged the attempt. we took a hit.", 'sys'), 100);
}

function updatePoliceUI() {
  const countdownEl = document.getElementById('policeCountdown');
  const fillEl      = document.getElementById('policeBarFill');
  const alertEl     = document.getElementById('policeAlert');
  const vigEl       = document.getElementById('policeVignette');
  const termEl      = document.querySelector('.terminal-panel');
  if (!countdownEl || !fillEl) return;

  const s      = policeSecondsLeft;
  const urgent = s <= 10;

  countdownEl.textContent = '0:' + String(s).padStart(2, '0');
  fillEl.style.width      = ((s / POLICE_SECONDS) * 100) + '%';
  countdownEl.classList.toggle('urgent', urgent);
  alertEl.classList.toggle('urgent-mode', urgent);
  vigEl.classList.toggle('active', urgent);
  termEl.classList.toggle('police-urgent', urgent);

  // Footsteps start at 10 seconds
  if (urgent && !footstepId) {
    footstepId = setInterval(() => { if (policeActive) playFootstep(); }, 550);
  }

  // "who's there?" at 6 seconds
  if (s === 6 && !voiceTriggered) {
    voiceTriggered = true;
    try {
      if (window.speechSynthesis) {
        const utt  = new SpeechSynthesisUtterance("who's there?");
        utt.volume = 0.85;
        utt.rate   = 0.75;
        utt.pitch  = 0.6;
        window.speechSynthesis.speak(utt);
      }
    } catch(e) {}
  }
}


// ═══════════════════════════════════════════════════════════════════════
// TERMINAL
// ═══════════════════════════════════════════════════════════════════════

const out  = document.getElementById('termOut');
const inp  = document.getElementById('termInput');
let cmdHist = [], histIdx = -1;

function tprint(lines) {
  if (typeof lines === 'string') lines = [[lines, '']];
  lines.forEach(([text, cls]) => {
    const d = document.createElement('div');
    d.className = 't ' + (cls || '');
    d.textContent = interp(text);
    out.appendChild(d);
  });
  out.scrollTop = out.scrollHeight;
}

function tcmd(cmd) {
  const d = document.createElement('div');
  d.className = 't cmd';
  d.textContent = '$ ' + cmd;
  out.appendChild(d);
  out.scrollTop = out.scrollHeight;
}

function getMissionTime() {
  const elapsed = Math.floor((Date.now() - (G.missionStart || Date.now())) / 1000);
  const base = 2 * 3600 + elapsed;
  const h = Math.floor(base / 3600) % 24;
  const m = Math.floor((base % 3600) / 60);
  const s = base % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function foxMsg(text, type) {
  const wrap = document.getElementById('foxMessages');

  const row = document.createElement('div');
  row.className = 'fox-msg-row';

  const ts = document.createElement('span');
  ts.className = 'fox-ts';
  ts.textContent = getMissionTime();

  const msg = document.createElement('div');
  msg.className = 'fox-msg' + (type === 'sys' ? ' sys' : '');

  row.appendChild(ts);
  row.appendChild(msg);
  wrap.appendChild(row);

  const fullText = `[fox] > ${interp(text)}`;
  let i = 0;
  function next() {
    if (i < fullText.length) {
      msg.textContent += fullText[i++];
      wrap.scrollTop = wrap.scrollHeight;
      setTimeout(next, 16);
    }
  }
  next();
}


// ═══════════════════════════════════════════════════════════════════════
// COMMAND PARSING
// ═══════════════════════════════════════════════════════════════════════

function normalise(s) { return s.trim().replace(/\s+/g, ' '); }

function parseCmd(raw) {
  const cmd = normalise(raw);
  const s = stage();

  // Always-available
  if (cmd === 'clear') { out.innerHTML = ''; return {}; }
  if (cmd === 'hint')  { openHint(); return {}; }
  if (cmd === 'help')  {
    tprint([
      [`ROOM ${room().id}: ${room().name}`, 'hl'],
      [`Stage ${G.stageIdx+1}: ${s.task}`, ''],
      ['', ''],
      ['git status       — always works', 'dim'],
      ['git log          — always works', 'dim'],
      ['hint             — get a hint', 'dim'],
      ['clear            — clear terminal', 'dim']
    ]);
    return {};
  }

  // Risky commands — trigger police even if also handled in wrong block
  if (!policeActive && POLICE_RISKY_CMDS.some(r => cmd === r || cmd.startsWith(r + ' '))) {
    triggerPolice();
  }

  // File edit trigger (generic — uses s.fileName or defaults to security-config.json)
  if (s.fileEdit) {
    const fn = s.fileName || 'security-config.json';
    if (cmd === `edit ${fn}` || cmd === `nano ${fn}` || cmd === `vim ${fn}`) {
      openEditor(); return {};
    }
  }

  // Flexible stash pop (HIDE THE EVIDENCE Stage 4)
  if (s.flexStashPop) {
    if (cmd === 'git stash pop') {
      tprint(s.output || []);
      logCmd(cmd);
      advance(s.tree);
      return {};
    }
    if (cmd === 'git stash apply') {
      tprint([
        ['On branch operative/entry-window', 'br'],
        ['Changes not staged for commit:', 'sys'],
        ['    modified:   firewall-rules.json', 'ok'],
        ['    modified:   entry-tokens.txt', 'ok'],
        ['', ''],
        ['apply restores the stash but keeps it in the list — use git stash drop to clean up.', 'dim'],
        ['git stash pop does both in one step. worth knowing the difference.', 'dim'],
      ]);
      logCmd('git stash apply');
      advance(s.tree);
      return {};
    }
  }

  // Flexible commit (Rooms 3, 6)
  if (s.flexCommit) {
    if (/^git commit -m ['"].+['"]/.test(cmd) || /^git commit -m .+/.test(cmd)) {
      const m = cmd.match(/^git commit -m ['"]?(.+?)['"]?$/) || [];
      const msg = m[1] || 'committed';
      const branch = (s.tree || '').includes('conflict') ? 'main' : 'operative/entry-window';
      const output = [
        [`[${branch} ${H[3]}] ${msg}`, 'cm'],
        [' 1 file changed, 1 insertion(+), 1 deletion(-)', 'sys'],
        ['', '']
      ];
      if (!msg || msg.length < 5 || /^(wip|fix|test|asdf|temp|x+|update)$/i.test(msg)) {
        output.push(["commit messages are for the crew. make them readable.", "warn"]);
        output.push(['', '']);
      }
      tprint(output);
      logCmd('git commit');
      advance(s.tree);
      return {};
    }
  }

  // Exact + near matches
  const accepted = (s.accepted || []).map(a => interp(normalise(a)));
  if (accepted.includes(cmd)) {
    if (s.fileEdit && !G.fileEditDone) {
      const fn = s.fileName || 'security-config.json';
      tprint([[`no changes to stage. edit the file first — type: edit ${fn}`, "warn"]]);
      return {};
    }
    tprint(s.output || []);
    logCmd(cmd);
    advance(s.tree);
    return {};
  }

  // Wrong-command responses
  if (s.wrong) {
    for (const [wCmd, wOut] of Object.entries(s.wrong)) {
      if (cmd === interp(normalise(wCmd)) || cmd.startsWith(interp(normalise(wCmd)) + ' ')) {
        tprint(wOut);
        countWrong();
        return {};
      }
    }
  }

  // Soft fallbacks (informational — not counted as wrong)
  if (cmd === 'git status') { tprint(defaultStatus()); return {}; }
  if (cmd === 'git log' || cmd === 'git log --oneline') {
    tprint([['view git log once you\'re on the right branch', 'dim']]); return {};
  }

  tprint([["command not recognized in this environment. type 'help' for available commands.", 'warn']]);
  flashTerminal();
  countWrong();
  return {};
}


function defaultStatus() {
  const s = stage();
  const t = s.tree || '';
  if (t.includes('stash_dirty')) {
    return [
      ['On branch operative/entry-window', 'br'],
      ['', ''],
      ['Changes not staged for commit:', 'sys'],
      ['    modified:   firewall-rules.json', 'err'],
      ['    modified:   entry-tokens.txt', 'err'],
    ];
  }
  if (t.includes('stash_clean')) {
    return [
      ['On branch operative/entry-window', 'br'],
      ['nothing to commit, working tree clean', 'ok'],
    ];
  }
  if (t.includes('conflict_initial')) {
    return [
      ['On branch main', 'br'],
      ['You have unmerged paths.', 'err'],
      ['    (fix conflicts and run "git commit")', 'dim'],
      ['', ''],
      ['Unmerged paths:', 'sys'],
      ['    both modified:   entry-tokens.txt', 'err'],
    ];
  }
  if (t.includes('dirty') || t.includes('r5') || t.includes('r6_dirty')) {
    return [
      ['On branch main', 'br'],
      ['', ''],
      ['Changes not staged for commit:', 'sys'],
      ['    modified:   alarm-config.json', 'err'],
      ['    modified:   access-log.txt', 'err'],
      ['', ''],
      ['Untracked files:', 'sys'],
      ['    temp-override.sh', 'warn']
    ];
  }
  const b = (t.includes('feature') || t.includes('r3') || t.includes('stash') || t.includes('entry'))
    ? 'operative/entry-window' : 'main';
  return [
    [`On branch ${b}`, 'br'],
    ['nothing to commit, working tree clean', 'dim']
  ];
}


// ═══════════════════════════════════════════════════════════════════════
// STAGE / ROOM ADVANCEMENT
// ═══════════════════════════════════════════════════════════════════════

function updateActiveBranch(treeKey) {
  const el = document.getElementById('activeBranch');
  if (!el) return;
  const isFeature = treeKey && (treeKey.includes('r3') || treeKey.includes('r4') || treeKey.includes('entry') || treeKey.includes('stash'));
  el.textContent = isFeature ? 'local/operative' : 'local/main';
}

function advance(treeState) {
  if (treeState) { renderTree(treeState); updateActiveBranch(treeState); }

  clearPolice(false); // player completed step — evaded in time (no-op if not active)
  addScore(10); // correct answer reward

  const nextIdx = G.stageIdx + 1;
  if (nextIdx >= room().stages.length) {
    completeRoom();
  } else {
    G.stageIdx      = nextIdx;
    G.hintLevel     = 0;
    G.fileEditDone  = false;
    G.stageWrongs   = 0;
    G.stageHintLevel = -1;
    updateProgress();

    setTimeout(() => {
      foxMsg(stage().foxMessage || stage().foxMsg);
      if (stage().fileEdit) setTimeout(openEditor, 900);
      if (stage().policeOnLoad) setTimeout(() => triggerPolice(true), 1400);
    }, 700);
  }
}

function completeRoom() {
  const t = Math.floor((Date.now() - G.roomStart) / 1000);
  const m = Math.floor(t / 60);
  const s = (t % 60).toString().padStart(2, '0');
  const completionMsg = room().stages[room().stages.length - 1].completionMsg || 'room cleared.';

  G.savedProgress[`room${room().id}`] = { complete: true, hints: G.hintsUsed, time: t };
  localStorage.setItem('vz_progress', JSON.stringify(G.savedProgress));

  // Collect clue fragment
  const clue = room().clue;
  if (clue && !G.clues.find(c => c.label === clue.label)) {
    G.clues.push(clue);
  }

  document.getElementById('doneStats').textContent = `Time: ${m}:${s}  ·  Hints used: ${G.hintsUsed}`;
  document.getElementById('doneMsg').textContent = `"${completionMsg}"`;

  // Show clue fragment in done screen
  const clueWrap = document.getElementById('clueFragment');
  if (clue && clueWrap) {
    document.getElementById('clueKey').textContent = clue.label;
    const clueValEl = document.getElementById('clueVal');
    clueValEl.textContent = '';
    document.getElementById('clueCount').textContent =
      `${G.clues.length} of ${ROOMS.length} fragments collected`;
    clueWrap.style.display = '';
    let i = 0;
    function typeVal() {
      if (i < clue.value.length) { clueValEl.textContent += clue.value[i++]; setTimeout(typeVal, 35); }
    }
    setTimeout(typeVal, 900);
  } else if (clueWrap) {
    clueWrap.style.display = 'none';
  }

  setTimeout(() => document.getElementById('roomDone').classList.add('open'), 1200);
}

function goNextRoom() {
  document.getElementById('roomDone').classList.remove('open');
  clearPolice(true); // reset silently between rooms
  const next = G.roomIdx + 1;
  if (next >= ROOMS.length) {
    buildQuiz();
    document.getElementById('quizScreen').classList.add('open');
    return;
  }
  G.roomIdx        = next;
  G.stageIdx       = 0;
  G.hintsUsed      = 0;
  G.hintLevel      = 0;
  G.fileEditDone   = false;
  G.stageWrongs    = 0;
  G.stageHintLevel = -1;
  G.roomStart      = Date.now();
  loadRoom();
}

function updateProgress() {
  const total = ROOMS.reduce((s, r) => s + r.stages.length, 0);
  const done  = ROOMS.slice(0, G.roomIdx).reduce((s, r) => s + r.stages.length, 0) + G.stageIdx;
  document.getElementById('progressFill').style.width = ((done / total) * 100) + '%';
}


// ═══════════════════════════════════════════════════════════════════════
// LOAD ROOM
// ═══════════════════════════════════════════════════════════════════════

function loadRoom() {
  const r = room();
  const s = stage();

  out.innerHTML = '';
  document.getElementById('foxMessages').innerHTML = '';
  const roomSlug = r.name.toLowerCase().replace(/\s+/g, '_');
  document.getElementById('roomInfo').textContent = `room_0${r.id} // ${roomSlug}`;
  updateActiveBranch(r.initialTree || ('r' + r.id + '_initial'));
  updateSecurityDots();

  tprint([
    ['', ''],
    [`  ╔══════════════════════════════════════╗`, 'dim'],
    [`  ║  ROOM ${r.id}: ${r.name.padEnd(32)}║`, 'hl'],
    [`  ╚══════════════════════════════════════╝`, 'dim'],
    ['', ''],
    [r.intro, 'sys'],
    ['', ''],
    [`  ──────────────────────────────────────`, 'dim'],
    ['', '']
  ]);

  updateProgress();
  renderTree(r.initialTree || ('r' + r.id + '_initial'));

  setTimeout(() => {
    foxMsg(s.foxMessage || s.foxMsg);
    if (s.fileEdit) setTimeout(openEditor, 1000);
    if (s.policeOnLoad) setTimeout(() => triggerPolice(true), 1400);
  }, 400);

  inp.focus();
}


// ═══════════════════════════════════════════════════════════════════════
// FILE EDITOR (Room 3 Stage 3 + Room 6 conflict)
// ═══════════════════════════════════════════════════════════════════════

const FILE_BEFORE = `{
  "system": "git-heist",
  "maintenance_window": null,
  "ids_threshold": 5,
  "monitoring_cycle": "04:00"
}`;

const FILE_CONFLICT = `{
  "system": "git-heist",
  "entry_tokens": [
<<<<<<< HEAD
    "tok_operative_7a2f",
    "tok_crew_3b1e"
=======
    "tok_operative_7a2f",
    "tok_crew_3b1e",
    "tok_override_9x77"
>>>>>>> origin/main
  ],
  "expiry": "02:15"
}`;

function openEditor() {
  const s = stage();
  const isConflict = s.fileEditType === 'conflict';
  const fc = document.getElementById('fileContent');
  fc.value = isConflict ? FILE_CONFLICT : FILE_BEFORE;
  const title = document.getElementById('editorTitle');
  if (title) title.textContent = 'EDIT FILE: ' + (s.fileName || 'security-config.json');
  const hint = document.getElementById('editorHint');
  if (hint) {
    hint.innerHTML = isConflict
      ? 'remove the <code>&lt;&lt;&lt;&lt;&lt;&lt;&lt;</code>, <code>=======</code>, <code>&gt;&gt;&gt;&gt;&gt;&gt;&gt;</code> markers — keep all three tokens'
      : 'change <code>"maintenance_window": null</code> → <code>"maintenance_window": "02:00"</code>';
  }
  document.getElementById('fileEditor').classList.add('open');
  fc.focus();
}

function saveFile() {
  const s = stage();
  const isConflict = s.fileEditType === 'conflict';
  const val = document.getElementById('fileContent').value;
  document.getElementById('fileEditor').classList.remove('open');

  if (isConflict) {
    const hasMarkers = val.includes('<<<<<<<') || val.includes('=======') || val.includes('>>>>>>>');
    if (!hasMarkers && val.includes('tok_override_9x77')) {
      G.fileEditDone = true;
      tprint([
        ['entry-tokens.txt saved — conflict resolved.', 'ok'],
        ['', ''],
        ['all three tokens preserved. markers removed.', 'dim'],
        ['', ''],
        ['now stage the resolved file.', 'sys']
      ]);
    } else if (hasMarkers) {
      tprint([
        ['conflict markers still present.', 'err'],
        ['remove the <<<<<<, ======, >>>>>>> lines and keep all three tokens.', 'warn'],
        ['type: edit entry-tokens.txt to try again.', 'dim']
      ]);
    } else {
      tprint([
        ['file saved but tok_override_9x77 is missing.', 'err'],
        ['keep all three tokens — that\'s the combined correct version.', 'warn'],
        ['type: edit entry-tokens.txt to try again.', 'dim']
      ]);
    }
  } else {
    if (val.includes('"maintenance_window": "02:00"')) {
      G.fileEditDone = true;
      tprint([
        ['security-config.json saved.', 'ok'],
        ['', ''],
        ['  "maintenance_window": null  →  "maintenance_window": "02:00"', 'dim'],
        ['', ''],
        ['now stage the change.', 'sys']
      ]);
    } else {
      tprint([
        ['file saved but the change is wrong.', 'err'],
        ['"maintenance_window" should be "02:00", not null.', 'warn'],
        ['type: edit security-config.json to try again.', 'dim']
      ]);
    }
  }
  inp.focus();
}

function cancelFile() {
  document.getElementById('fileEditor').classList.remove('open');
  inp.focus();
}


// ═══════════════════════════════════════════════════════════════════════
// HINT SYSTEM
// ═══════════════════════════════════════════════════════════════════════

function setHintDisplay(lvl, hints) {
  document.getElementById('hintLvl').textContent = `HINT ${lvl + 1} OF ${hints.length}`;
  const bar = document.getElementById('hintProgressBar');
  if (bar) bar.style.width = (((lvl + 1) / hints.length) * 100) + '%';

  // Render hint text — split off trailing "run:" or "type:" command line
  const hintTxt = document.getElementById('hintTxt');
  const text = interp(hints[lvl]);
  const cmdMatch = text.match(/^([\s\S]+)\n\n((?:run|type): .+)$/);
  if (cmdMatch) {
    hintTxt.innerHTML = cmdMatch[1] + '<br><br><span class="hint-cmd">' + cmdMatch[2] + '</span>';
  } else {
    hintTxt.textContent = text;
  }

  const nextBtn = document.getElementById('nextHintBtn');
  nextBtn.classList.remove('reveal-answer');
  nextBtn.textContent = 'DEEPER HINT →';

  if (lvl >= hints.length - 1) {
    nextBtn.style.display = 'none';
    return;
  }
  nextBtn.style.display = '';
  if (lvl === hints.length - 2) {
    nextBtn.textContent = 'REVEAL ANSWER';
    nextBtn.classList.add('reveal-answer');
  }
}

function openHint() {
  const hints = room().hints[G.stageIdx];
  if (!hints) return;
  const lvl = Math.min(G.hintLevel, hints.length - 1);
  setHintDisplay(lvl, hints);
  document.getElementById('hintModal').classList.add('open');
  G.hintsUsed++;
  G.totalHints++;
  // -1 charged once per stage for opening hint at all
  if (G.stageHintLevel < 0) {
    G.stageHintLevel = 0;
    addScore(-1);
  }
}

function moreHint() {
  const hints = room().hints[G.stageIdx];
  G.hintLevel = Math.min(G.hintLevel + 1, hints.length - 1);

  if (G.hintLevel === 1 && G.stageHintLevel < 1) {
    // Advanced to hint 2 for first time this stage
    G.stageHintLevel = 1;
    addScore(-5);
  } else if (G.hintLevel === hints.length - 1 && G.stageHintLevel < hints.length - 1) {
    // Revealed the answer for first time this stage
    G.stageHintLevel = hints.length - 1;
    addScore(-15);
    G.totalHints += 3;
    G.hintsUsed  += 3;
  }

  setHintDisplay(G.hintLevel, hints);
}

function closeHint() {
  document.getElementById('hintModal').classList.remove('open');
  G.hintLevel = 0;
  inp.focus();
}


// ═══════════════════════════════════════════════════════════════════════
// INPUT EVENTS
// ═══════════════════════════════════════════════════════════════════════

inp.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const raw = inp.value.trim();
    if (!raw) return;
    cmdHist.unshift(raw);
    histIdx = -1;
    inp.value = '';
    tcmd(raw);
    parseCmd(raw);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (histIdx < cmdHist.length - 1) inp.value = cmdHist[++histIdx];
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    inp.value = histIdx > 0 ? cmdHist[--histIdx] : (histIdx = -1, '');
  }
});

// Keep focus when clicking terminal panel
document.querySelector('.terminal-panel').addEventListener('click', () => inp.focus());


// ═══════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════

// Initial tree states per room (before any command succeeds)
// Rooms with initialTree property in data.js use that directly; others fall back to r{id}_initial
TREE['r1_initial'] = { branches: [{name:'main', y:90, color:'#1D9E75', commits:[{x:40},{x:100}]}], HEAD: {type:'branch', ref:'main', ci:1, branchY:90} };
TREE['r2_initial'] = TREE['r2_remote'];
TREE['r3_initial'] = TREE['r3_clean'];


// ═══════════════════════════════════════════════════════════════════════
// IMMERSION SYSTEMS
// ═══════════════════════════════════════════════════════════════════════

function flashTerminal() {
  const el = document.getElementById('termOut');
  el.classList.remove('err-flash');
  void el.offsetWidth;
  el.classList.add('err-flash');
  setTimeout(() => el.classList.remove('err-flash'), 500);
}

function startFooterClock() {
  const el = document.getElementById('footerClock');
  if (!el) return;
  function tick() {
    const now = new Date();
    const h = String(now.getUTCHours()).padStart(2, '0');
    const m = String(now.getUTCMinutes()).padStart(2, '0');
    const s = String(now.getUTCSeconds()).padStart(2, '0');
    el.textContent = `${h}:${m}:${s} utc`;
  }
  tick();
  setInterval(tick, 1000);
}

function updateSecurityDots() {
  const dots = document.querySelectorAll('.sec-dot');
  const statusEl = document.getElementById('secStatus');
  // 1 bypassed for rooms 1-2, 2 for rooms 3-4, 3 for rooms 5-6
  const bypassed = Math.floor(G.roomIdx / 2) + 1;
  const probing = Math.min(bypassed + 1, 4);

  dots.forEach((dot, i) => {
    dot.className = 'sec-dot';
    if (i < bypassed) dot.classList.add('active');
    else if (i === bypassed) dot.classList.add('probing');
  });

  if (statusEl) {
    const bStr = bypassed === 1 ? 'layer_01: bypassed'
               : bypassed === 2 ? 'layer_01+02: bypassed'
               :                  'layer_01+02+03: bypassed';
    statusEl.textContent = `${bStr} // layer_0${probing}: probing`;
  }
}

const BOOT_LINES = [
  { text: '> initializing secure tunnel to git_heist_banking_system...', cls: 'dim', pause: 180 },
  { text: '> handshake 0x4f22 — success', cls: 'ok', pause: 140 },
  { text: '> bypassing firewall node layer_01...', cls: 'dim', pause: 200 },
  { text: '> LAYER_01: ACCESS BYPASSED', cls: 'ok', pause: 120 },
  { text: '> WARNING: intrusion_detection_system active on layer_02', cls: 'warn', pause: 160 },
  { text: '> encrypted tunnel established. trace protection: active', cls: 'ok', pause: 120 },
  { text: '> incoming transmission — source: unknown // signal encrypted', cls: 'dim', pause: 80 },
];

function buildEndScreen() {
  const container = document.getElementById('assembledKey');
  if (!container) return;
  container.innerHTML = '';
  G.clues.forEach((clue, i) => {
    const row = document.createElement('div');
    row.className = 'key-row';
    row.innerHTML = `<span class="key-label">[${clue.label}]</span><span class="key-val"></span>`;
    container.appendChild(row);
    const valEl = row.querySelector('.key-val');
    let ci = 0;
    function typeChar() {
      if (ci < clue.value.length) {
        valEl.textContent += clue.value[ci++];
        setTimeout(typeChar, 30);
      }
    }
    setTimeout(typeChar, i * 220);
  });
}

// ═══════════════════════════════════════════════════════════════════════
// VERIFICATION QUIZ
// ═══════════════════════════════════════════════════════════════════════

const CMD_QUIZ_POOL = {
  'git stash': {
    q: "You ran `git stash` to hide your changes. Where do they go?",
    options: ["Permanently deleted", "A private LIFO stack, separate from commits", "A temporary branch", "The staging area"],
    correct: 1,
    explain: "git stash saves to a private stack. git stash list shows everything in it. git stash pop restores the latest."
  },
  'git stash pop': {
    q: "What's the difference between `git stash pop` and `git stash apply`?",
    options: ["No difference", "pop restores and removes the entry; apply restores but keeps it in the list", "apply is faster", "pop only works on the latest stash"],
    correct: 1,
    explain: "pop = restore + delete the stash entry. apply = restore only. Use apply when you want the stash to stay for reuse."
  },
  'git push': {
    q: "When you ran `git push`, what was actually sent to the remote?",
    options: ["All local files", "Your entire git history", "Only the commits the remote didn't already have", "Your working directory changes"],
    correct: 2,
    explain: "git push sends only the delta — commits the remote is missing. Not your working directory, not your whole history."
  },
  'git pull': {
    q: "What does `git pull` do under the hood?",
    options: ["It's just git fetch", "git fetch + git merge combined", "It overwrites local files", "It's git push in reverse"],
    correct: 1,
    explain: "git pull = git fetch (download) + git merge (integrate). You can split these for more control."
  },
  'git revert': {
    q: "Why use `git revert` instead of `git reset` to undo a commit on a shared branch?",
    options: ["git reset doesn't work on commits", "git revert is faster", "git revert adds an undo commit — history stays intact, safe for others who have pulled", "They're identical on shared branches"],
    correct: 2,
    explain: "git revert is non-destructive — it adds a new commit. git reset rewrites history, which breaks anyone who already pulled."
  },
  'git checkout': {
    q: "When you used `git checkout` to switch branches, what actually changed?",
    options: ["Only HEAD moved", "HEAD moved and your working directory updated to match that branch", "Nothing — checkout is read-only", "The remote was updated"],
    correct: 1,
    explain: "git checkout updates HEAD AND rewrites your working directory to reflect the checked-out state."
  },
  'git branch -a': {
    q: "What does the `-a` flag in `git branch -a` add over plain `git branch`?",
    options: ["Alphabetically sorted output", "All authors who created branches", "Remote-tracking branches alongside local ones", "Archived branches"],
    correct: 2,
    explain: "git branch shows local only. -a (all) also shows remotes/origin/* — the local cache of what the remote has."
  },
  'git show': {
    q: "What does `git show <hash>` display?",
    options: ["Current unstaged diff", "The full diff of that specific commit — what changed, in which files", "The full commit list", "The remote URL"],
    correct: 1,
    explain: "git show <hash> = that commit's message, author, and exact line-by-line diff."
  },
  'git diff': {
    q: "With no arguments, what does `git diff` compare?",
    options: ["Two branches", "The last two commits", "Your working directory vs the staging area", "Local vs remote"],
    correct: 2,
    explain: "git diff (no args) = unstaged changes. git diff --cached = staged vs last commit. git diff <branch> = branch comparison."
  },
  'git clean -fd': {
    q: "Why is `git clean -fd` potentially dangerous?",
    options: ["It's not dangerous", "It force-pushes to the remote", "It permanently deletes untracked files — no undo", "It resets staged changes"],
    correct: 2,
    explain: "Untracked files aren't in git history, so clean removes them forever. Run git clean -n first to preview."
  },
  'git restore': {
    q: "What does `git restore <file>` do to an unstaged change?",
    options: ["Stages the file", "Discards the working-directory change, reverting to the last commit", "Creates a file backup", "Moves the change to stash"],
    correct: 1,
    explain: "git restore discards unstaged changes. It's the modern replacement for git checkout -- <file>."
  },
  'git add': {
    q: "What does staging a file with `git add` actually do?",
    options: ["Commits it immediately", "Adds it to the index — marks it for inclusion in the next commit", "Uploads it to the remote", "Creates a copy"],
    correct: 1,
    explain: "Staging adds the file to git's index (staging area). git commit then includes everything currently staged."
  },
  'git clone': {
    q: "What does `git clone` do that `git init` doesn't?",
    options: ["Nothing — they're equivalent", "Creates a copy of an existing remote repo including full history and origin remote", "Initialises git tracking in any folder", "Downloads only the latest commit"],
    correct: 1,
    explain: "git init starts a new empty repo. git clone copies a remote repo with all history and the origin remote already wired up."
  },
  'git remote -v': {
    q: "What does `git remote -v` show?",
    options: ["All local branches", "The verbose git log", "The remote connections and their fetch/push URLs", "Your git config"],
    correct: 2,
    explain: "git remote -v lists each named remote (usually origin) and the URLs git uses to fetch and push."
  },
};

const STATIC_QUIZ = [
  {
    q: "You resolve a merge conflict in a file. What's the next step?",
    options: ["git merge again", "git pull to update", "git add the file, then git commit", "git reset --hard to restart"],
    correct: 2,
    explain: "After manually resolving: git add marks the conflict resolved, then git commit seals the merge."
  },
  {
    q: "What does HEAD mean in a git repo?",
    options: ["The first commit ever made", "The latest commit pushed to the remote", "A pointer to the currently checked-out commit or branch tip", "The main branch"],
    correct: 2,
    explain: "HEAD is just a pointer — usually to your current branch tip. Detached HEAD means it points directly to a commit, not a branch."
  },
  {
    q: "What's the key difference between `git merge` and `git rebase`?",
    options: ["They're identical", "Merge keeps full history with a merge commit; rebase replays commits linearly", "Rebase is always safer", "Merge only works on main"],
    correct: 1,
    explain: "Merge adds a merge commit showing where branches joined. Rebase rewrites commits as if they branched off later — never rebase shared branches."
  },
  {
    q: "When would you stash instead of commit?",
    options: ["When changes are final", "When you want to discard changes", "When work-in-progress isn't commit-ready but you need to switch context", "When the remote is down"],
    correct: 2,
    explain: "Stash is for temporary context-switching — hide WIP, do other work, restore later. Commit when work is logically complete."
  },
  {
    q: "Why is `git push --force` dangerous on a shared branch?",
    options: ["It's not dangerous", "It rewrites remote history, overwriting commits others may have pulled", "It's slower", "It only works on private repos"],
    correct: 1,
    explain: "Force-push overwrites the remote branch tip. Anyone who pulled before now has diverged history. Only force-push branches only you own."
  },
  {
    q: "What does `git log --oneline` show that `git log` doesn't?",
    options: ["More detail per commit", "A compact one-line-per-commit view — hash + message only", "Remote branch info", "Author names"],
    correct: 1,
    explain: "--oneline condenses each commit to one line: short hash + subject. Useful for scanning history quickly."
  },
  {
    q: "If you committed to the wrong branch by mistake, what's the safest fix?",
    options: ["Delete the branch", "git push --force", "git revert on the wrong branch, then cherry-pick or re-commit on the right one", "Nothing you can do"],
    correct: 2,
    explain: "Revert undoes it safely on the wrong branch. Then bring the change to the right branch via cherry-pick or re-doing the work."
  },
];

let quizQuestions  = [];
let quizIdx        = 0;
let quizCorrect    = 0;
let quizTimerInt   = null;
let quizTimeLeft   = 20;
let quizAnswered   = false;

function buildQuiz() {
  // Up to 2 dynamic questions from the player's own cmdLog
  const picked = [];
  const usedKeys = new Set();
  for (const { cmd } of cmdLog) {
    for (const key of Object.keys(CMD_QUIZ_POOL)) {
      if (!usedKeys.has(key) && (cmd === key || cmd.startsWith(key + ' '))) {
        picked.push(CMD_QUIZ_POOL[key]);
        usedKeys.add(key);
        break;
      }
    }
    if (picked.length >= 2) break;
  }

  // Fill to 4 with shuffled static questions
  const shuffled = STATIC_QUIZ.slice().sort(() => 0.5 - Math.random());
  for (const q of shuffled) {
    if (picked.length >= 4) break;
    picked.push(q);
  }

  quizQuestions = picked.slice(0, 4);
  quizIdx       = 0;
  quizCorrect   = 0;

  // Fox intro (typewriter style)
  const speech = document.getElementById('quizFoxSpeech');
  speech.textContent = '';
  const intro = '"I need to know it\'s really you — not someone who got lucky. Prove it."';
  let ci = 0;
  function typeIntro() {
    if (ci < intro.length) { speech.textContent += intro[ci++]; setTimeout(typeIntro, 18); }
    else { setTimeout(() => showQuizQuestion(0), 900); }
  }

  document.getElementById('quizBody').style.display = '';
  document.getElementById('quizResult').style.display = 'none';
  setTimeout(typeIntro, 400);
}

function showQuizQuestion(idx) {
  const q = quizQuestions[idx];
  if (!q) { showQuizResult(); return; }

  quizAnswered = false;
  document.getElementById('quizNum').textContent = `QUESTION ${idx + 1} / ${quizQuestions.length}`;
  document.getElementById('quizQ').textContent   = q.q;

  const fb = document.getElementById('quizFeedback');
  fb.textContent = '';
  fb.className   = 'quiz-feedback';

  const optsEl = document.getElementById('quizOpts');
  optsEl.innerHTML = '';
  ['A','B','C','D'].forEach((letter, i) => {
    if (i >= q.options.length) return;
    const btn = document.createElement('button');
    btn.className = 'quiz-opt-btn';
    btn.innerHTML = `<span class="quiz-opt-letter">${letter}</span>${q.options[i]}`;
    btn.addEventListener('click', () => answerQuiz(i));
    optsEl.appendChild(btn);
  });

  startQuizTimer();
}

function startQuizTimer() {
  stopQuizTimer();
  quizTimeLeft = 20;
  updateQuizTimerUI();
  quizTimerInt = setInterval(() => {
    quizTimeLeft--;
    updateQuizTimerUI();
    if (quizTimeLeft <= 0) answerQuiz(-1); // timeout = wrong
  }, 1000);
}

function stopQuizTimer() {
  clearInterval(quizTimerInt);
  quizTimerInt = null;
}

function updateQuizTimerUI() {
  const numEl  = document.getElementById('quizTimerNum');
  const fillEl = document.getElementById('quizTimerFill');
  if (!numEl || !fillEl) return;
  numEl.textContent  = '0:' + String(quizTimeLeft).padStart(2, '0');
  fillEl.style.width = ((quizTimeLeft / 20) * 100) + '%';
  fillEl.classList.toggle('urgent', quizTimeLeft <= 7);
}

function answerQuiz(chosen) {
  if (quizAnswered) return;
  quizAnswered = true;
  stopQuizTimer();

  const q       = quizQuestions[quizIdx];
  const correct = chosen === q.correct;
  if (correct) { quizCorrect++; addScore(5); }

  // Highlight buttons
  document.querySelectorAll('.quiz-opt-btn').forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('correct');
    else if (i === chosen && !correct) btn.classList.add('wrong');
  });

  // Feedback
  const fb = document.getElementById('quizFeedback');
  const prefix = chosen === -1 ? 'TIME UP — ' : correct ? '✓ CORRECT — ' : '✗ WRONG — ';
  fb.textContent = prefix + q.explain;
  fb.className   = 'quiz-feedback ' + (correct ? 'show-ok' : 'show-err');

  quizIdx++;
  setTimeout(() => {
    if (quizIdx < quizQuestions.length) showQuizQuestion(quizIdx);
    else showQuizResult();
  }, 2600);
}

function showQuizResult() {
  stopQuizTimer();
  document.getElementById('quizBody').style.display = 'none';

  const total = quizQuestions.length;
  const pct   = quizCorrect / total;
  let verdict;
  if (pct === 1)     verdict = '"Perfect. Identity confirmed. You didn\'t just get lucky — you know this. The vault is yours."';
  else if (pct >= 0.5) verdict = '"Close enough. You know the tools that matter. The vault is open."';
  else               verdict = '"Shaky. But you made it this far. The vault opens. Study up."';

  const speech = document.getElementById('quizFoxSpeech');
  speech.textContent = '';
  let ci = 0;
  function typeVerdict() {
    if (ci < verdict.length) { speech.textContent += verdict[ci++]; setTimeout(typeVerdict, 14); }
  }
  setTimeout(typeVerdict, 200);

  document.getElementById('quizResultScore').textContent = `${quizCorrect} / ${total}`;
  document.getElementById('quizResult').style.display = '';
}

function finishQuiz() {
  document.getElementById('quizScreen').classList.remove('open');
  buildEndScreen();
  document.getElementById('endScreen').classList.add('open');
}


function runBootSequence() {
  const container = document.getElementById('bootTerminal');
  const txBody    = document.getElementById('txBody');
  const opRow     = document.getElementById('operativeRow');
  const enterBtn  = document.getElementById('enterBtn');
  const nameInput = document.getElementById('operativeName');
  if (!container) return;

  let idx = 0;
  let skipped = false;

  function hideSkipBtn() {
    const sb = document.getElementById('bootSkipBtn');
    if (sb) { sb.style.visibility = 'hidden'; sb.style.pointerEvents = 'none'; }
  }

  function revealEnd() {
    if (skipped) return;
    hideSkipBtn();
    txBody.style.opacity = '1';
    txBody.style.transform = 'translateY(0)';
    setTimeout(() => {
      opRow.style.opacity = '1';
      opRow.style.transform = 'translateY(0)';
      setTimeout(() => {
        enterBtn.style.opacity = '1';
        enterBtn.style.pointerEvents = '';
        nameInput.focus();
        nameInput.addEventListener('keydown', function(e) {
          if (e.key === 'Enter') startGame();
        });
      }, 300);
    }, 600);
  }

  function skip() {
    if (skipped) return;
    skipped = true;
    hideSkipBtn();
    container.innerHTML = BOOT_LINES.map(l =>
      `<span class="boot-line ${l.cls || 'dim'}">${l.text}</span>`
    ).join('');
    txBody.style.opacity = '1';
    txBody.style.transform = 'translateY(0)';
    opRow.style.opacity = '1';
    opRow.style.transform = 'translateY(0)';
    enterBtn.style.opacity = '1';
    enterBtn.style.pointerEvents = '';
    nameInput.focus();
    nameInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') startGame();
    });
  }

  function nextLine() {
    if (skipped) return;
    if (idx >= BOOT_LINES.length) { revealEnd(); return; }
    const line = BOOT_LINES[idx++];
    const el = document.createElement('span');
    el.className = 'boot-line ' + (line.cls || 'dim');
    container.appendChild(el);

    let ci = 0;
    const txt = line.text;
    function typeChar() {
      if (skipped) return;
      if (ci < txt.length) {
        el.textContent += txt[ci++];
        setTimeout(typeChar, 6);
      } else {
        setTimeout(nextLine, line.pause || 120);
      }
    }
    typeChar();
  }

  nextLine();
  document.addEventListener('keydown', skip, { once: true });
  container.addEventListener('click', skip, { once: true });
  const skipBtn = document.getElementById('bootSkipBtn');
  if (skipBtn) skipBtn.addEventListener('click', skip, { once: true });
}

// ═══════════════════════════════════════════════════════════════════════
// SCORE SUBMISSION + LEADERBOARD
// ═══════════════════════════════════════════════════════════════════════

async function submitScore() {
  const btn = document.getElementById('saveScoreBtn');
  btn.textContent = '[ SAVING... ]';
  btn.disabled = true;

  const totalTime = Math.floor((Date.now() - G.missionStart) / 1000);
  const saved = await saveScore({
    codename:       G.codename,
    totalTime,
    roomsCompleted: G.clues.length,
    hintsUsed:      G.totalHints,
    finalScore:     G.score,
    commandsUsed:   cmdLog.map(e => e.cmd)
  });

  if (saved) {
    btn.style.display = 'none';
    document.getElementById('scoreSaved').style.display = '';
    const board = await getLeaderboard();
    renderLeaderboard(board);
  } else {
    btn.textContent = '[ SAVE FAILED — CHECK CONSOLE ]';
    btn.disabled = false;
    const section = document.getElementById('scoreSection');
    let errNote = section.querySelector('.score-err-note');
    if (!errNote) {
      errNote = document.createElement('div');
      errNote.className = 'score-err-note';
      section.appendChild(errNote);
    }
    errNote.textContent = 'could not write to leaderboard. supabase RLS policies may not be set — check console for details.';
  }
}

function renderLeaderboard(board) {
  const el = document.getElementById('leaderboardRows');
  if (!board || !board.length) {
    el.innerHTML = '<div class="lb-empty">no other scores yet. you\'re the first operative.</div>';
    return;
  }
  el.innerHTML = board.map((row, i) => {
    const t = row.total_time || 0;
    const m = Math.floor(t / 60);
    const s = String(t % 60).padStart(2, '0');
    const rooms = row.rooms_completed || 0;
    const score = row.final_score != null ? row.final_score : '—';
    return `<div class="lb-row">
      <span class="lb-rank">#${i + 1}</span>
      <span class="lb-name">${row.codename}</span>
      <span class="lb-score">${score}</span>
      <span class="lb-rooms">${rooms}/${ROOMS.length}</span>
    </div>`;
  }).join('');
}

runBootSequence();


// ═══════════════════════════════════════════════════════════════════════
// RESIZABLE PANELS
// ═══════════════════════════════════════════════════════════════════════

function initResizable() {
  const panels      = document.getElementById('panels');
  const leftHandle  = document.getElementById('resizeLeft');
  const rightHandle = document.getElementById('resizeRight');
  if (!panels || !leftHandle || !rightHandle) return;

  let dragging = null;
  let startX   = 0;
  let startW   = 0;

  const MIN_SIDE   = 120;
  const MIN_CENTER = 280;

  function getSideWidths() {
    const cols = getComputedStyle(panels).gridTemplateColumns.split(' ');
    return { left: parseFloat(cols[0]), right: parseFloat(cols[4]) };
  }

  function startDrag(side, e) {
    dragging = side;
    startX   = e.clientX;
    startW   = getSideWidths()[side];
    leftHandle.classList.toggle('dragging', side === 'left');
    rightHandle.classList.toggle('dragging', side === 'right');
    document.body.classList.add('resizing-col');
    e.preventDefault();
  }

  leftHandle.addEventListener('mousedown',  e => startDrag('left',  e));
  rightHandle.addEventListener('mousedown', e => startDrag('right', e));

  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const total       = panels.offsetWidth - 2;
    const { left, right } = getSideWidths();
    if (dragging === 'left') {
      const delta = e.clientX - startX;
      const newW  = Math.max(MIN_SIDE, Math.min(startW + delta, total - right - MIN_CENTER));
      panels.style.setProperty('--left-w', newW + 'px');
    } else {
      const delta = startX - e.clientX;
      const newW  = Math.max(MIN_SIDE, Math.min(startW + delta, total - left - MIN_CENTER));
      panels.style.setProperty('--right-w', newW + 'px');
    }
  });

  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = null;
    leftHandle.classList.remove('dragging');
    rightHandle.classList.remove('dragging');
    document.body.classList.remove('resizing-col');
  });
}

initResizable();

let gameStarted = false;
function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  const rawName = (document.getElementById('operativeName').value || '').trim();
  const codename = rawName.replace(/[^a-zA-Z0-9_\-]/g, '').toLowerCase() || 'operative';
  G.codename = codename;
  document.getElementById('operativeTag').textContent = `${codename}@layer-01:~/vault-repo$`;

  document.getElementById('introScreen').style.display = 'none';
  const shell = document.getElementById('gameShell');
  shell.style.display = 'flex';
  G.missionStart = Date.now();
  G.roomStart = Date.now();
  startFooterClock();
  loadRoom();
}



