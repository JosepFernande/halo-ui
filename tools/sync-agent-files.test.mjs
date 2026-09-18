// Node built-in test runner: `node --test tools/sync-agent-files.test.mjs`
//
// Covers the pure core of the agent-files sync script so the logic is
// testable without touching the real project tree.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { diffClaudeFromAgents, diffSkills, applyOps } from './sync-agent-files.mjs';

function makeTempRepo() {
  const dir = mkdtempSync(join(tmpdir(), 'sync-agent-files-'));
  return dir;
}

// --- diffClaudeFromAgents ---

test('diffClaudeFromAgents returns op when CLAUDE.md does not exist', () => {
  const repo = makeTempRepo();
  try {
    writeFileSync(join(repo, 'AGENTS.md'), 'agents content');

    const ops = diffClaudeFromAgents(repo, 'AGENTS.md', 'CLAUDE.md');

    assert.equal(ops.length, 1);
    assert.equal(ops[0].content, 'agents content');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffClaudeFromAgents returns empty when CLAUDE.md is already in sync', () => {
  const repo = makeTempRepo();
  try {
    writeFileSync(join(repo, 'AGENTS.md'), 'same content');
    writeFileSync(join(repo, 'CLAUDE.md'), 'same content');

    const ops = diffClaudeFromAgents(repo, 'AGENTS.md', 'CLAUDE.md');

    assert.equal(ops.length, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffClaudeFromAgents detects drifted CLAUDE.md', () => {
  const repo = makeTempRepo();
  try {
    writeFileSync(join(repo, 'AGENTS.md'), 'new content');
    writeFileSync(join(repo, 'CLAUDE.md'), 'old content');

    const ops = diffClaudeFromAgents(repo, 'AGENTS.md', 'CLAUDE.md');

    assert.equal(ops.length, 1);
    assert.equal(ops[0].content, 'new content');
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffClaudeFromAgents returns empty when AGENTS.md does not exist', () => {
  const repo = makeTempRepo();
  try {
    // AGENTS.md does not exist
    const ops = diffClaudeFromAgents(repo, 'AGENTS.md', 'CLAUDE.md');
    assert.equal(ops.length, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

// --- diffSkills ---

test('diffSkills returns copy ops for new skills', () => {
  const repo = makeTempRepo();
  try {
    const skillsDir = join(repo, 'skills');
    mkdirSync(join(skillsDir, 'my-skill'), { recursive: true });
    writeFileSync(join(skillsDir, 'my-skill', 'SKILL.md'), 'skill content');

    const { copy, remove } = diffSkills(repo, skillsDir, ['.claude', '.agents']);

    assert.equal(copy.length, 2); // 1 file x 2 destinations
    assert.equal(remove.length, 0);
    assert.ok(copy.every((op) => op.content.equals(Buffer.from('skill content'))));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffSkills detects stale skills in destination', () => {
  const repo = makeTempRepo();
  try {
    const skillsDir = join(repo, 'skills');
    mkdirSync(skillsDir, { recursive: true });
    // Source has no skills, but destination has a stale one
    mkdirSync(join(repo, '.claude', 'skills', 'old-skill'), { recursive: true });
    writeFileSync(join(repo, '.claude', 'skills', 'old-skill', 'SKILL.md'), 'stale');

    const { copy, remove } = diffSkills(repo, skillsDir, ['.claude']);

    assert.equal(copy.length, 0);
    assert.equal(remove.length, 1);
    assert.ok(remove[0].includes('old-skill'));
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffSkills skips skills already in sync', () => {
  const repo = makeTempRepo();
  try {
    const skillsDir = join(repo, 'skills');
    mkdirSync(join(skillsDir, 'my-skill'), { recursive: true });
    writeFileSync(join(skillsDir, 'my-skill', 'SKILL.md'), 'same');

    mkdirSync(join(repo, '.claude', 'skills', 'my-skill'), { recursive: true });
    writeFileSync(join(repo, '.claude', 'skills', 'my-skill', 'SKILL.md'), 'same');

    const { copy, remove } = diffSkills(repo, skillsDir, ['.claude']);

    assert.equal(copy.length, 0);
    assert.equal(remove.length, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffSkills handles nested skill files', () => {
  const repo = makeTempRepo();
  try {
    const skillsDir = join(repo, 'skills');
    mkdirSync(join(skillsDir, 'my-skill', 'references'), { recursive: true });
    writeFileSync(join(skillsDir, 'my-skill', 'SKILL.md'), 'skill');
    writeFileSync(join(skillsDir, 'my-skill', 'references', 'doc.md'), 'ref');

    const { copy, remove } = diffSkills(repo, skillsDir, ['.agents']);

    assert.equal(copy.length, 2); // SKILL.md + references/doc.md
    assert.equal(remove.length, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test('diffSkills returns empty when source skills dir does not exist', () => {
  const repo = makeTempRepo();
  try {
    const skillsDir = join(repo, 'skills');
    const { copy, remove } = diffSkills(repo, skillsDir, ['.claude']);
    assert.equal(copy.length, 0);
    assert.equal(remove.length, 0);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

// --- applyOps ---

test('applyOps writes files and removes stale entries', () => {
  const repo = makeTempRepo();
  try {
    mkdirSync(join(repo, '.claude'));
    mkdirSync(join(repo, '.claude', 'stale-dir'));
    writeFileSync(join(repo, '.claude', 'stale-dir', 'file.md'), 'gone');

    const writeOps = [
      {
        src: '/fake/src.md',
        dest: join(repo, '.claude', 'new-file.md'),
        content: Buffer.from('hello'),
      },
    ];
    const removeOps = [join(repo, '.claude', 'stale-dir')];

    const { written, removed } = applyOps(writeOps, removeOps);

    assert.equal(written, 1);
    assert.equal(removed, 1);
    assert.equal(readFileSync(join(repo, '.claude', 'new-file.md'), 'utf8'), 'hello');
    assert.equal(existsSync(join(repo, '.claude', 'stale-dir')), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
