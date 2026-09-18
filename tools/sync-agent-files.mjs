#!/usr/bin/env node
/**
 * Sync agent-facing files (skills and CLAUDE.md) as real file copies — never
 * symlinks.
 *
 * Symlinks degrade to plain-text files containing the relative path on Windows
 * filesystems mounted under WSL (/mnt/c), making skills undiscoverable by
 * agents that expect real files. Real copies work identically on every
 * filesystem and for every contributor who clones the repo.
 *
 * Source of truth:
 *   - AGENTS.md (repo root) — copied to CLAUDE.md (repo root)
 *   - skills/<name>/** (skill directories)
 *
 * Destinations:
 *   - CLAUDE.md (repo root, copy of AGENTS.md)
 *   - .claude/skills/<name>/** and .agents/skills/<name>/** (skill dirs)
 *
 * Usage: node tools/sync-agent-files.mjs
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = resolve(scriptDir, '..');

const AGENTS_FILE = 'AGENTS.md';
const CLAUDE_FILE = 'CLAUDE.md';
const SKILLS_SOURCE = join(repoRoot, 'skills');
const DESTINATION_ROOTS = ['.claude', '.agents'];

/**
 * Pure: given a source (AGENTS.md) and destination (CLAUDE.md) at the repo
 * root, return a { src, dest, content } operation if the content differs from
 * what is already on disk (write-only-if-changed). Returns an empty array if
 * they are already in sync or the source does not exist.
 */
export function diffClaudeFromAgents(repoRoot, agentsFile, claudeFile) {
  const src = join(repoRoot, agentsFile);
  const dest = join(repoRoot, claudeFile);
  if (!existsSync(src)) return [];
  const content = readFileSync(src, 'utf8');
  if (existsSync(dest) && readFileSync(dest, 'utf8') === content) return [];
  return [{ src, dest, content }];
}

/**
 * Pure: given a skills source directory and a list of destination roots,
 * return { copy, remove } operations.
 *
 * - copy: { src, dest } for files whose content differs from the destination
 * - remove: absolute paths in destinations that no longer exist in source
 */
export function diffSkills(repoRoot, skillsSource, destinationRoots) {
  const copyOps = [];
  const removeOps = [];

  if (!existsSync(skillsSource)) return { copy: copyOps, remove: removeOps };

  const sourceSkills = readdirSync(skillsSource, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  for (const destRoot of destinationRoots) {
    const destSkillsDir = join(repoRoot, destRoot, 'skills');

    // Collect files to copy
    for (const skillName of sourceSkills) {
      const srcDir = join(skillsSource, skillName);
      const destDir = join(destSkillsDir, skillName);
      collectCopyOps(srcDir, destDir, copyOps);
    }

    // Collect stale files/dirs to remove
    if (existsSync(destSkillsDir)) {
      const destEntries = readdirSync(destSkillsDir, { withFileTypes: true });
      for (const entry of destEntries) {
        if (!sourceSkills.includes(entry.name)) {
          removeOps.push(join(destSkillsDir, entry.name));
        }
      }
    }
  }

  return { copy: copyOps, remove: removeOps };
}

/** Recursively collect copy operations for files that differ. */
function collectCopyOps(srcDir, destDir, ops) {
  if (!existsSync(srcDir)) return;
  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);
    if (entry.isDirectory()) {
      collectCopyOps(srcPath, destPath, ops);
    } else if (entry.isFile()) {
      const content = readFileSync(srcPath);
      if (existsSync(destPath)) {
        const existing = readFileSync(destPath);
        if (content.equals(existing)) continue;
      }
      ops.push({ src: srcPath, dest: destPath, content });
    }
  }
}

/**
 * Apply write operations (files) and remove operations (stale dirs/files).
 * Returns a summary of what changed.
 */
export function applyOps(writeOps, removeOps) {
  let written = 0;
  let removed = 0;

  for (const op of writeOps) {
    mkdirSync(dirname(op.dest), { recursive: true });
    writeFileSync(op.dest, op.content);
    written++;
  }

  for (const path of removeOps) {
    rmSync(path, { recursive: true, force: true });
    removed++;
  }

  return { written, removed };
}

// `file://${process.argv[1]}` only matches import.meta.url on POSIX — on
// Windows process.argv[1] uses backslashes while import.meta.url is always a
// normalized file:/// URL, so that naive comparison silently never matches.
// pathToFileURL().href normalizes both sides on every platform.
const isMainModule = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  try {
    const claudeOps = diffClaudeFromAgents(repoRoot, AGENTS_FILE, CLAUDE_FILE);
    const { copy: skillCopyOps, remove: skillRemoveOps } = diffSkills(
      repoRoot,
      SKILLS_SOURCE,
      DESTINATION_ROOTS,
    );

    const allWriteOps = [
      ...claudeOps,
      ...skillCopyOps.map((op) => ({ src: op.src, dest: op.dest, content: op.content })),
    ];

    if (allWriteOps.length === 0 && skillRemoveOps.length === 0) {
      console.log('Agent files are already in sync.');
      process.exit(0);
    }

    const { written, removed } = applyOps(allWriteOps, skillRemoveOps);

    const parts = [];
    if (written > 0) parts.push(`synced ${written} file(s)`);
    if (removed > 0) parts.push(`removed ${removed} stale entry/entries`);
    console.log(`Agent files updated: ${parts.join(', ')}.`);
    process.exit(0);
  } catch (err) {
    console.error(`Failed to sync agent files: ${err.message}`);
    process.exit(1);
  }
}
