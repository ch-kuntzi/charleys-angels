#!/usr/bin/env node
/**
 * Dashboard Auto-Sync Watcher
 * Watches tasks.json for changes and auto-commits/pushes to GitHub.
 * Run in background: node scripts/auto-sync.cjs &
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TASKS_FILE = path.resolve(__dirname, '..', 'public/data/tasks.json');
const REPO_DIR = path.resolve(__dirname, '..');
const DEBOUNCE_MS = 3000; // Wait 3 seconds after last change before pushing

let debounceTimer = null;
let lastHash = '';

function getFileHash() {
    try {
        const content = fs.readFileSync(TASKS_FILE, 'utf-8');
        // Simple hash: length + first/last 100 chars
        return content.length + content.slice(0, 100) + content.slice(-100);
    } catch { return ''; }
}

function syncToGit() {
    const currentHash = getFileHash();
    if (currentHash === lastHash) return; // No actual change

    try {
        execSync(`git -C "${REPO_DIR}" add public/data/tasks.json`, { stdio: 'pipe' });
        execSync(`git -C "${REPO_DIR}" commit -m "[auto-sync] Dashboard update"`, { stdio: 'pipe' });
    } catch (e) {
        // Nothing to commit
        return;
    }

    try {
        execSync(`git -C "${REPO_DIR}" pull --rebase`, { stdio: 'pipe' });
    } catch (e) {
        try { execSync(`git -C "${REPO_DIR}" rebase --abort`, { stdio: 'pipe' }); } catch (e2) { }
    }

    try {
        execSync(`git -C "${REPO_DIR}" push`, { stdio: 'pipe' });
        lastHash = currentHash;
        console.log(`[${new Date().toLocaleTimeString()}] ✅ Synced tasks.json to GitHub`);
    } catch (e) {
        console.log(`[${new Date().toLocaleTimeString()}] ⚠️  Push failed: ${e.message}`);
    }
}

// Watch for changes
console.log('👀 Watching tasks.json for changes...');
lastHash = getFileHash();

fs.watchFile(TASKS_FILE, { interval: 2000 }, () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        console.log(`[${new Date().toLocaleTimeString()}] 📝 Change detected, syncing...`);
        syncToGit();
    }, DEBOUNCE_MS);
});

// Keep process alive
process.on('SIGINT', () => {
    console.log('\n🛑 Auto-sync stopped.');
    fs.unwatchFile(TASKS_FILE);
    process.exit(0);
});
