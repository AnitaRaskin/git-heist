// ═══════════════════════════════════════════════════════════════════════
// SVG TREE RENDERER  v3  — animated transitions + action strip
// ═══════════════════════════════════════════════════════════════════════

const NS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs || {})) el.setAttribute(k, v);
  return el;
}

// ─── State tracking ──────────────────────────────────────────────────────
let _prevState = null;

// ─── Transition description ──────────────────────────────────────────────

function _describeTransition(prev, next) {
  if (!prev || !next) return null;

  const prevBr  = prev.branches || [];
  const nextBr  = next.branches || [];
  const prevNames = new Set(prevBr.map(b => b.name));

  // New branches
  const newBranches = nextBr.filter(b => !prevNames.has(b.name));
  if (newBranches.length) {
    const remote = newBranches.filter(b => b.dashed);
    const local  = newBranches.filter(b => !b.dashed);
    if (remote.length && !local.length)
      return `↳ tracking: ${remote.map(b => b.name).join(', ')}`;
    return `↳ new branch: ${newBranches.map(b => b.name).join(', ')}`;
  }

  // New commits on existing branches
  for (const nb of nextBr) {
    const pb = prevBr.find(b => b.name === nb.name);
    if (pb && nb.commits.length > pb.commits.length) {
      const c = nb.commits[nb.commits.length - 1];
      return `↳ commit on ${nb.name}${c?.msg ? ` — "${c.msg}"` : ''}`;
    }
  }

  // Extras diff
  const prevExt = new Set((prev.extras || []).map(e => e.type));
  const nextExt = new Set((next.extras || []).map(e => e.type));

  if (!prevExt.has('staged-indicator')   && nextExt.has('staged-indicator'))   return '↳ changes staged';
  if (prevExt.has('staged-indicator')    && !nextExt.has('staged-indicator'))   return '↳ changes committed';
  if (!prevExt.has('stash-indicator')    && nextExt.has('stash-indicator'))     return '↳ stash saved';
  if (prevExt.has('stash-indicator')     && !nextExt.has('stash-indicator'))    return '↳ stash applied';
  if (!prevExt.has('conflict-indicator') && nextExt.has('conflict-indicator'))  return '↳ merge conflict — resolve to continue';
  if (prevExt.has('conflict-indicator')  && !nextExt.has('conflict-indicator')) return '↳ conflict resolved';

  // Remote box appeared
  const prevRemotes = (prev.extras || []).filter(e => e.type === 'remote-box');
  const nextRemotes = (next.extras || []).filter(e => e.type === 'remote-box');
  if (nextRemotes.length > prevRemotes.length) {
    const r = nextRemotes[nextRemotes.length - 1];
    return `↳ remote: ${r.label}`;
  }
  if (prevRemotes.length > nextRemotes.length) return '↳ fork created';

  // Revert label appeared
  const hadRevert = (prev.extras || []).some(e => e.type === 'revert-label');
  const hasRevert = (next.extras || []).some(e => e.type === 'revert-label');
  if (!hadRevert && hasRevert) return '↳ commit reverted';

  // HEAD switched branch
  const ph = prev.HEAD, nh = next.HEAD;
  if (ph?.type === 'branch' && nh?.type === 'branch' && ph.ref !== nh.ref)
    return `↳ switched to ${nh.ref}`;
  if (ph?.type === 'branch'   && nh?.type === 'detached') return '↳ HEAD detached';
  if (ph?.type === 'detached' && nh?.type === 'branch')   return `↳ back on ${nh.ref}`;

  // HEAD advanced on same branch
  if (ph?.type === 'branch' && nh?.type === 'branch' && ph.ref === nh.ref && ph.ci !== nh.ci)
    return `↳ HEAD advanced on ${nh.ref}`;

  return null;
}

function _updateActionStrip(msg) {
  const el = document.getElementById('treeActionStrip');
  if (!el) return;
  if (!msg) { el.textContent = ''; el.className = 'tree-action-strip'; return; }
  el.textContent = msg;
  el.className = 'tree-action-strip';
  void el.offsetWidth; // force reflow to restart animation
  el.classList.add('flash');
}

// ─── Tooltip ────────────────────────────────────────────────────────────

let _ttBound = false;

function setupTooltip(svg) {
  if (_ttBound) return;
  _ttBound = true;
  const tt = document.getElementById('treeTooltip');
  if (!tt) return;

  svg.addEventListener('mousemove', e => {
    const hit = e.target.closest('[data-tip]');
    if (!hit) { tt.style.display = 'none'; return; }
    const parts = (hit.dataset.tip || '').split('|');
    tt.innerHTML = parts.map((p, i) =>
      `<span class="tt-${i === 0 ? 'main' : 'sub'}">${p.trim()}</span>`
    ).join('');
    tt.style.display = 'block';
    const r = svg.getBoundingClientRect();
    let tx = e.clientX - r.left + 14;
    let ty = e.clientY - r.top  - 42;
    if (tx + 170 > r.width)  tx = e.clientX - r.left - 175;
    if (ty < 0)               ty = e.clientY - r.top  + 16;
    tt.style.left = tx + 'px';
    tt.style.top  = ty + 'px';
  });
  svg.addEventListener('mouseleave', () => { if (tt) tt.style.display = 'none'; });
}


// ─── Main render ────────────────────────────────────────────────────────

function renderTree(stateKey) {
  const svg = document.getElementById('gitTree');
  if (!svg) return;
  svg.innerHTML = '';
  _ttBound = false;
  setupTooltip(svg);

  const state     = TREE[stateKey];
  const prevState = _prevState;

  if (!state) {
    const t = svgEl('text', {
      x: '20', y: '30', fill: '#333',
      'font-size': '10', 'font-family': 'JetBrains Mono, Courier New'
    });
    t.textContent = stateKey ? `loading: ${stateKey}` : 'initializing...';
    svg.appendChild(t);
    _updateActionStrip(null);
    return;
  }

  // ── What existed before (for animation diff) ──────────────────────────
  const prevCommitKeys  = new Set();
  const prevBranchNames = new Set();
  for (const b of (prevState?.branches || [])) {
    prevBranchNames.add(b.name);
    for (const c of b.commits) prevCommitKeys.add(`${b.name}:${c.x}`);
  }
  const prevExtTypes = new Set((prevState?.extras || []).map(e => e.type));

  // Where HEAD was before
  const prevHeadBranch = (prevState?.branches || []).find(b =>
    b.name === prevState?.HEAD?.ref || b.y === prevState?.HEAD?.branchY
  );
  const prevHeadX = prevHeadBranch?.commits[prevState?.HEAD?.ci ?? -1]?.x;
  const prevHeadY = prevHeadBranch?.y;

  // ── Defs ──────────────────────────────────────────────────────────────
  const defs = svgEl('defs', {});

  const mk = svgEl('marker', { id: 'arr', markerWidth: '7', markerHeight: '5', refX: '3', refY: '2.5', orient: 'auto' });
  mk.appendChild(svgEl('polygon', { points: '0 0,7 2.5,0 5', fill: '#3d4943' }));
  defs.appendChild(mk);

  const flt = svgEl('filter', { id: 'head-glow', x: '-60%', y: '-60%', width: '220%', height: '220%' });
  const blr = svgEl('feGaussianBlur', { in: 'SourceGraphic', stdDeviation: '2.8', result: 'blur' });
  const mrg = svgEl('feMerge', {});
  mrg.appendChild(svgEl('feMergeNode', { in: 'blur' }));
  mrg.appendChild(svgEl('feMergeNode', { in: 'SourceGraphic' }));
  flt.appendChild(blr);
  flt.appendChild(mrg);
  defs.appendChild(flt);

  svg.appendChild(defs);

  const branches = state.branches || [];
  const h        = state.HEAD;

  // ── Resolve HEAD commit ───────────────────────────────────────────────
  let headBranch = null, headCommit = null, headCI = -1;
  if (h && h.type === 'branch') {
    headBranch = branches.find(b =>
      b.name === h.ref || (h.branchY !== undefined && b.y === h.branchY)
    );
    if (headBranch && h.ci !== undefined) {
      headCI     = h.ci;
      headCommit = headBranch.commits[h.ci];
    }
  }

  // ── Branch connectors (vertical lines at shared x) ────────────────────
  branches.forEach((branch, bi) => {
    if (branch.commits.length === 0) return;
    const firstX       = branch.commits[0].x;
    const isBranchNew  = !prevBranchNames.has(branch.name);
    for (let oi = 0; oi < bi; oi++) {
      const other = branches[oi];
      if (other.commits.some(c => c.x === firstX)) {
        const line = svgEl('line', {
          x1: firstX, y1: other.y + 6,
          x2: firstX, y2: branch.y - 6,
          stroke: branch.dashed ? '#2a3830' : branch.color,
          'stroke-width': '1',
          'stroke-dasharray': '3,2',
          opacity: branch.dashed ? '0.2' : '0.4'
        });
        if (isBranchNew && prevState) line.classList.add('tree-elem-new');
        svg.appendChild(line);
        break;
      }
    }
  });

  // ── Branches: lines + commits ─────────────────────────────────────────
  branches.forEach(branch => {
    const cs           = branch.commits;
    const isActive     = branch === headBranch;
    const color        = branch.color;
    const isBranchNew  = !prevBranchNames.has(branch.name);

    // Horizontal line segments
    for (let i = 0; i < cs.length - 1; i++) {
      const lineLen = Math.abs(cs[i + 1].x - cs[i].x);
      const isSegNew = isBranchNew ||
        !prevCommitKeys.has(`${branch.name}:${cs[i].x}`) ||
        !prevCommitKeys.has(`${branch.name}:${cs[i + 1].x}`);

      const lineAttrs = {
        x1: cs[i].x,   y1: branch.y,
        x2: cs[i+1].x, y2: branch.y,
        stroke: color,
        'stroke-width':   branch.dashed ? '1' : '1.5',
        opacity: branch.dashed ? '0.3' : '0.8'
      };
      if (branch.dashed) lineAttrs['stroke-dasharray'] = '5,4';

      const line = svgEl('line', lineAttrs);

      if (isSegNew && prevState && !branch.dashed) {
        line.classList.add('tree-line-new');
        line.style.setProperty('--line-len', lineLen);
      } else if (isSegNew && prevState) {
        line.classList.add('tree-elem-new');
      }
      svg.appendChild(line);
    }

    // Commit circles
    cs.forEach((c, ci) => {
      const isHead      = isActive && ci === headCI;
      const commitKey   = `${branch.name}:${c.x}`;
      const isNewCommit = !prevCommitKeys.has(commitKey);
      const tip         = `${branch.name} | commit ${ci + 1} / ${cs.length}`;
      const g           = svgEl('g', { 'data-tip': tip });

      // Invisible hit area
      g.appendChild(svgEl('circle', {
        cx: c.x, cy: branch.y, r: '11',
        fill: 'transparent', stroke: 'none'
      }));

      // Outer pulse ring – HEAD only
      if (isHead) {
        g.appendChild(svgEl('circle', {
          cx: c.x, cy: branch.y, r: '13',
          fill: 'none', stroke: color,
          'stroke-width': '1', opacity: '0',
          class: 'head-pulse-ring'
        }));
      }

      // Main commit circle
      g.appendChild(svgEl('circle', {
        cx: c.x, cy: branch.y,
        r: isHead ? '7' : '5.5',
        fill: '#0a0c0b',
        stroke: color,
        'stroke-width': isHead ? '2' : (branch.dashed ? '1' : '1.5'),
        opacity: branch.dashed ? '0.45' : '1',
        ...(isHead ? { filter: 'url(#head-glow)' } : {})
      }));

      // Inner dot – HEAD only
      if (isHead) {
        g.appendChild(svgEl('circle', {
          cx: c.x, cy: branch.y, r: '2.5',
          fill: color, opacity: '0.9'
        }));
      }

      if (isNewCommit && prevState) g.classList.add('commit-appear');

      // HEAD moved to this commit — flash it
      if (isHead && prevState && (c.x !== prevHeadX || branch.y !== prevHeadY)) {
        g.classList.add('head-flash');
      }

      svg.appendChild(g);
    });

    // Branch label chip
    if (cs.length === 0) return;
    const last  = cs[cs.length - 1];
    const lx    = last.x + 11;
    const chipW = Math.max(branch.name.length * 5.3 + 14, 32);
    const chipY = branch.y - 8;
    const chipG = svgEl('g', { 'data-tip': `${branch.name}${isActive ? ' | current' : ''}` });

    chipG.appendChild(svgEl('rect', {
      x: lx - 2, y: chipY, width: chipW, height: 14, rx: '2',
      fill: isActive ? color : 'transparent',
      opacity: isActive ? '0.13' : '0',
      stroke: isActive ? color : 'none',
      'stroke-width': '0.5',
      'stroke-opacity': isActive ? '0.4' : '0'
    }));

    const lbl = svgEl('text', {
      x: lx + 3, y: branch.y + 4,
      fill: color,
      'font-size':   isActive ? '8' : '7.5',
      'font-family': 'JetBrains Mono, Courier New',
      'font-weight': isActive ? '700' : '400',
      opacity: branch.dashed ? '0.4' : (isActive ? '1' : '0.6')
    });
    lbl.textContent = branch.name;
    chipG.appendChild(lbl);

    if (isBranchNew && prevState) chipG.classList.add('tree-elem-new');
    svg.appendChild(chipG);
  });

  // ── HEAD indicator ────────────────────────────────────────────────────
  if (h) {
    if (h.type === 'detached') {
      const { cx, cy } = h;
      svg.appendChild(svgEl('circle', {
        cx, cy, r: '13',
        fill: 'none', stroke: '#ffb4ab',
        'stroke-width': '1', opacity: '0',
        class: 'head-pulse-ring'
      }));
      svg.appendChild(svgEl('polygon', {
        points: `${cx},${cy-8} ${cx+6},${cy} ${cx},${cy+8} ${cx-6},${cy}`,
        fill: 'rgba(255,180,171,0.12)', stroke: '#ffb4ab', 'stroke-width': '1.5'
      }));
      const dt = svgEl('text', {
        x: cx, y: cy - 18,
        fill: '#ffb4ab', 'font-size': '8',
        'font-family': 'JetBrains Mono, Courier New',
        'text-anchor': 'middle', 'font-weight': '700'
      });
      dt.textContent = '◈ HEAD (detached)';
      svg.appendChild(dt);

    } else if (headBranch && headCommit) {
      const cx    = headCommit.x;
      const cy    = headBranch.y;
      const color = headBranch.color;

      svg.appendChild(svgEl('line', {
        x1: cx, y1: cy - 22, x2: cx, y2: cy - 10,
        stroke: color, 'stroke-width': '1',
        'stroke-dasharray': '2,2', opacity: '0.45'
      }));

      const chipW = 36, chipH = 14;
      const chipX = cx - chipW / 2;
      const chipY = cy - 37;
      svg.appendChild(svgEl('rect', {
        x: chipX, y: chipY, width: chipW, height: chipH, rx: '3',
        fill: color, opacity: '0.18',
        stroke: color, 'stroke-width': '0.5', 'stroke-opacity': '0.5'
      }));
      const ht = svgEl('text', {
        x: cx, y: chipY + 9.5,
        fill: color, 'font-size': '8.5',
        'font-family': 'JetBrains Mono, Courier New',
        'text-anchor': 'middle', 'font-weight': '700'
      });
      ht.textContent = 'HEAD';
      svg.appendChild(ht);
    }
  }

  // ── Extras ────────────────────────────────────────────────────────────
  (state.extras || []).forEach(ex => {

    if (ex.type === 'remote-box') {
      const isNew = !(prevState?.extras || []).some(e => e.type === 'remote-box' && e.label === ex.label);
      const g = svgEl('g', { 'data-tip': ex.label });
      g.appendChild(svgEl('rect', {
        x: ex.x, y: ex.y, width: '96', height: '22', rx: '3',
        fill: ex.color, opacity: '0.07',
        stroke: ex.color, 'stroke-width': '1', 'stroke-opacity': '0.45'
      }));
      const t = svgEl('text', {
        x: ex.x + 7, y: ex.y + 14,
        fill: ex.color, 'font-size': '7.5',
        'font-family': 'JetBrains Mono, Courier New', opacity: '0.8'
      });
      t.textContent = ex.label;
      g.appendChild(t);
      if (isNew && prevState) g.classList.add('tree-elem-new');
      svg.appendChild(g);
      return;
    }

    if (ex.type === 'arrow') {
      svg.appendChild(svgEl('line', {
        x1: ex.x1, y1: ex.y1, x2: ex.x2, y2: ex.y2,
        stroke: '#3d4943', 'stroke-width': '1',
        'stroke-dasharray': '3,3', 'marker-end': 'url(#arr)'
      }));
      return;
    }

    if (ex.type === 'revert-label') {
      const t = svgEl('text', {
        x: ex.x - 3, y: ex.y - 14,
        fill: '#68dbae', 'font-size': '8',
        'font-family': 'JetBrains Mono, Courier New',
        'text-anchor': 'middle', 'font-weight': '700'
      });
      t.textContent = '↩ revert';
      svg.appendChild(t);
      return;
    }

    const PILLS = {
      'staged-indicator':   { icon: '●', text: 'changes staged',        color: '#68dbae' },
      'dirty-indicator':    { icon: '⚠', text: 'working tree dirty',    color: '#ffb4ab' },
      'stash-indicator':    { icon: '◎', text: 'stash@{0}: WIP saved',  color: '#c8a87a' },
      'conflict-indicator': { icon: '✕', text: 'CONFLICT: merge failed',color: '#ffb4ab' },
    };
    const pill = PILLS[ex.type];
    if (!pill) return;

    const isNew  = !prevExtTypes.has(ex.type);
    const pillW  = pill.text.length * 5.4 + 28;
    const g      = svgEl('g', { 'data-tip': pill.text });
    g.appendChild(svgEl('rect', {
      x: ex.x, y: ex.y - 10,
      width: pillW, height: 17, rx: '3',
      fill: pill.color, opacity: '0.09',
      stroke: pill.color, 'stroke-width': '0.5', 'stroke-opacity': '0.5'
    }));
    const t = svgEl('text', {
      x: ex.x + 7, y: ex.y + 3,
      fill: pill.color, 'font-size': '8.5',
      'font-family': 'JetBrains Mono, Courier New', opacity: '0.9'
    });
    t.textContent = `${pill.icon}  ${pill.text}`;
    g.appendChild(t);
    if (isNew && prevState) g.classList.add('tree-elem-new');
    svg.appendChild(g);
  });

  // ── Auto-fit viewBox ──────────────────────────────────────────────────
  try {
    const box = svg.getBBox();
    if (box.width > 0 && box.height > 0) {
      const px = 14, py = 16;
      svg.setAttribute('viewBox',
        `${box.x - px} ${box.y - py} ${box.width + px * 2} ${box.height + py * 2}`
      );
    }
  } catch (e) {
    // getBBox unavailable (hidden element) — keep default viewBox
  }

  // ── Commit & update action strip ──────────────────────────────────────
  const msg = _describeTransition(prevState, state);
  _prevState = state;
  _updateActionStrip(msg);
}
