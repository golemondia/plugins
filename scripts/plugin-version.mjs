#!/usr/bin/env node
// Keeps the plugin version honest. Claude Code only delivers an update when `version` grows, and
// the two manifests (portable + Claude) carry it separately, so:
//   node scripts/plugin-version.mjs check <base-ref>   fail if manifests disagree, or content
//                                                      changed since <base-ref> without a bump
//   node scripts/plugin-version.mjs bump <base-ref>    same test, but bump the patch version in
//                                                      both manifests instead of failing
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const PLUGIN = 'plugins/lemondia';
const MANIFESTS = [`${PLUGIN}/plugin.json`, `${PLUGIN}/.claude-plugin/plugin.json`];
const [mode, baseRef] = process.argv.slice(2);
if (!['check', 'bump'].includes(mode) || !baseRef) {
	console.error('usage: plugin-version.mjs <check|bump> <base-ref>');
	process.exit(2);
}

const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const versions = MANIFESTS.map((path) => read(path).version);
if (new Set(versions).size !== 1) {
	console.error(`Manifest versions disagree: ${MANIFESTS.map((p, i) => `${p}=${versions[i]}`).join(', ')}`);
	process.exit(1);
}
const current = versions[0];

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const changed = git('diff', '--name-only', baseRef, 'HEAD', '--', PLUGIN)
	.split('\n')
	.filter((f) => f && !MANIFESTS.includes(f));
if (changed.length === 0) {
	console.log(`No plugin content change since ${baseRef}; version ${current} stands.`);
	process.exit(0);
}

let previous = null;
try {
	previous = JSON.parse(git('show', `${baseRef}:${MANIFESTS[0]}`)).version;
} catch {
	// Manifest did not exist at the base ref: any version counts as new.
}
if (previous !== current) {
	console.log(`Plugin content changed and version moved ${previous ?? 'none'} -> ${current}.`);
	process.exit(0);
}

if (mode === 'check') {
	console.error(`Plugin content changed (${changed.join(', ')}) but version is still ${current}. Bump it in both manifests.`);
	process.exit(1);
}

const [major, minor, patch] = current.split('.').map(Number);
const next = `${major}.${minor}.${patch + 1}`;
for (const path of MANIFESTS) {
	const manifest = read(path);
	manifest.version = next;
	writeFileSync(path, `${JSON.stringify(manifest, null, '\t')}\n`);
}
console.log(`Bumped ${current} -> ${next} in both manifests.`);
