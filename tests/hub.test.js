import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dir = dirname(fileURLToPath(import.meta.url));
const html  = readFileSync(resolve(__dir, '../index.html'), 'utf8');
const { document } = new JSDOM(html).window;

// ─── helpers ──────────────────────────────────────────────────────────

function text(selector) {
  return document.querySelector(selector)?.textContent?.trim() ?? null;
}
function attr(selector, attribute) {
  return document.querySelector(selector)?.getAttribute(attribute) ?? null;
}
function count(selector) {
  return document.querySelectorAll(selector).length;
}


// ─── page shell ───────────────────────────────────────────────────────

describe('Page shell', () => {
  test('title contains VAULT_ZERO', () => {
    assert.match(document.title, /VAULT_ZERO/);
  });
  test('has a top-bar brand element with VAULT_ZERO', () => {
    const brand = text('.hub-topbar-brand');
    assert.equal(brand, 'VAULT_ZERO');
  });
  test('hero heading contains "Escape Room"', () => {
    const h1 = text('.hub-hero-title');
    assert.match(h1, /Escape Room/i);
  });
  test('hero tag element exists for typing animation', () => {
    assert.ok(document.getElementById('heroTag'), '#heroTag missing');
  });
  test('telemetry clock element exists', () => {
    assert.ok(document.getElementById('teleClock'), '#teleClock missing');
  });
  test('footer contains brand name', () => {
    assert.match(text('footer') ?? '', /VAULT_ZERO/i);
  });
});


// ─── hero stats ───────────────────────────────────────────────────────

describe('Hero stats', () => {
  test('shows 3 missions', () => {
    const nums = [...document.querySelectorAll('.hub-stat-num')].map(el => el.textContent.trim());
    assert.ok(nums.includes('3'), `expected "3" in stat numbers, got: ${nums}`);
  });
  test('shows 1 active', () => {
    const nums = [...document.querySelectorAll('.hub-stat-num')].map(el => el.textContent.trim());
    assert.ok(nums.includes('1'), `expected "1" in stat numbers, got: ${nums}`);
  });
  test('shows 2 encrypted', () => {
    const nums = [...document.querySelectorAll('.hub-stat-num')].map(el => el.textContent.trim());
    assert.ok(nums.includes('2'), `expected "2" in stat numbers, got: ${nums}`);
  });
});


// ─── active mission card ──────────────────────────────────────────────

describe('Active mission card (Git Heist)', () => {
  const card = () => document.querySelector('.mission-card--active');

  test('active card exists', () => {
    assert.ok(card(), '.mission-card--active not found');
  });
  test('links to git-heist.html', () => {
    assert.equal(attr('.mission-card--active', 'href'), 'git-heist.html');
  });
  test('mission ID shows MISSION_001', () => {
    assert.match(text('.mission-card--active .mission-id') ?? '', /MISSION_001/);
  });
  test('title is "Git Heist"', () => {
    assert.match(text('.mission-card--active .mission-title') ?? '', /Git Heist/i);
  });
  test('badge shows Active', () => {
    assert.match(text('.mission-card--active .mission-badge') ?? '', /Active/i);
  });
  test('lists "9 rooms" in meta', () => {
    const meta = text('.mission-card--active .mission-meta') ?? '';
    assert.match(meta, /9 rooms/i);
  });
  test('tool tags include git log, git branch, git stash', () => {
    const tags = [...document.querySelectorAll('.mission-card--active .mission-tools-tags span')]
      .map(el => el.textContent.trim());
    assert.ok(tags.some(t => /git log/i.test(t)),    `"git log" not in tools: ${tags}`);
    assert.ok(tags.some(t => /git branch/i.test(t)), `"git branch" not in tools: ${tags}`);
    assert.ok(tags.some(t => /git stash/i.test(t)),  `"git stash" not in tools: ${tags}`);
  });
  test('CTA text is "Enter the Repo"', () => {
    assert.match(text('.mission-card--active .mission-cta') ?? '', /Enter the Repo/i);
  });
  test('preview terminal shows a git log command', () => {
    const terminal = text('.mission-card--active .fp-terminal') ?? '';
    assert.match(terminal, /git log/i);
  });
});


// ─── upcoming / locked missions ───────────────────────────────────────

describe('Upcoming missions', () => {
  const upcomingCards = () => document.querySelectorAll('.hub-upcoming-grid .mission-card');

  test('exactly 2 upcoming cards', () => {
    assert.equal(count('.hub-upcoming-grid .mission-card'), 2);
  });
  test('both have Encrypted badge', () => {
    const badges = [...document.querySelectorAll('.hub-upcoming-grid .mission-badge')]
      .map(el => el.textContent.trim());
    badges.forEach((b, i) => assert.match(b, /Encrypted/i, `card ${i} badge: "${b}"`));
  });
  test('mission 002 is "Operation: Goldstream"', () => {
    const titles = [...document.querySelectorAll('.hub-upcoming-grid .mission-title')]
      .map(el => el.textContent.trim());
    assert.ok(titles.some(t => /Goldstream/i.test(t)), `Goldstream not found in: ${titles}`);
  });
  test('mission 003 is "Colony Zero"', () => {
    const titles = [...document.querySelectorAll('.hub-upcoming-grid .mission-title')]
      .map(el => el.textContent.trim());
    assert.ok(titles.some(t => /Colony Zero/i.test(t)), `Colony Zero not found in: ${titles}`);
  });
  test('mission 002 shows MISSION_002 id', () => {
    const ids = [...document.querySelectorAll('.hub-upcoming-grid .mission-id')]
      .map(el => el.textContent.trim());
    assert.ok(ids.some(id => /MISSION_002/.test(id)), `MISSION_002 not found in: ${ids}`);
  });
  test('mission 003 shows MISSION_003 id', () => {
    const ids = [...document.querySelectorAll('.hub-upcoming-grid .mission-id')]
      .map(el => el.textContent.trim());
    assert.ok(ids.some(id => /MISSION_003/.test(id)), `MISSION_003 not found in: ${ids}`);
  });
  test('locked cards do not have an href (not clickable links)', () => {
    const lockedLinks = [...document.querySelectorAll('.hub-upcoming-grid a')];
    assert.equal(lockedLinks.length, 0, 'locked missions should not be anchor tags');
  });
  test('locked CTA text says Encrypted', () => {
    const ctas = [...document.querySelectorAll('.hub-upcoming-grid .mission-cta')]
      .map(el => el.textContent.trim());
    ctas.forEach((c, i) => assert.match(c, /Encrypted/i, `card ${i} cta: "${c}"`));
  });
});


// ─── inline JS hooks ──────────────────────────────────────────────────

describe('Inline script elements', () => {
  test('typing animation targets #heroTag', () => {
    const scripts = [...document.querySelectorAll('script')]
      .map(s => s.textContent).join('');
    assert.match(scripts, /heroTag/);
  });
  test('clock targets #teleClock', () => {
    const scripts = [...document.querySelectorAll('script')]
      .map(s => s.textContent).join('');
    assert.match(scripts, /teleClock/);
  });
});
