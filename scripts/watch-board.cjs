#!/usr/bin/env node
/**
 * watch-board.cjs — Real-time Firestore dashboard watcher for Charley
 *
 * Fires within ~100ms of a new Chris comment. Sends ONE Telegram ping per
 * batch of new comments, then waits before processing again (debounced).
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json');
const INBOX_PATH = path.join(process.env.HOME, '.openclaw', 'workspace', 'DASHBOARD_INBOX.md');
const LAST_SEEN_PATH = path.join(__dirname, '..', '.last-watch-seen');

const BOT_TOKEN = '8662628307:AAHUxBAEjY-f8LoVVoULU9fkmNMFSNVb690';
const CHAT_ID = '8520154558';

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('Missing firebase-service-account.json in scripts/');
    process.exit(1);
}

initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
const db = getFirestore();

function getLastSeen() {
    try { return parseInt(fs.readFileSync(LAST_SEEN_PATH, 'utf8').trim(), 10); }
    catch { return Date.now(); }
}

function saveLastSeen(ts) {
    fs.writeFileSync(LAST_SEEN_PATH, String(ts));
}

function writeInbox(entries) {
    const lines = [
        `<!-- auto-generated ${new Date().toLocaleString()} -->`,
        '# Dashboard Inbox — New Comments from Chris',
        '',
        ...entries.map(({ taskId, taskTitle, taskAgent, text, commentTs }) => [
            `## ${taskTitle}`,
            `- Task ID: \`${taskId}\``,
            `- Assigned: ${taskAgent}`,
            `- Time: ${new Date(commentTs).toLocaleString()}`,
            `- Message: ${text}`,
            '',
            '**Reply using:**',
            '```',
            `node /Users/charley/projects/task-dashboard/scripts/update-task.cjs comment \\`,
            `  --id "${taskId}" --author "Charley" --text "YOUR REPLY HERE"`,
            '```',
            '',
        ].join('\n')),
    ];
    fs.writeFileSync(INBOX_PATH, lines.join('\n'));
}

async function pingCharley(entries) {
    const count = entries.length;
    const message = `Chris left ${count} new comment${count > 1 ? 's' : ''} on a task card. Read the file /Users/charley/.openclaw/workspace/DASHBOARD_INBOX.md and reply on each card listed using: node /Users/charley/projects/task-dashboard/scripts/update-task.cjs comment --id "<id>" --author "Charley" --text "<reply>". Do not send a Telegram message.`;
    try {
        const res = await fetch('http://127.0.0.1:18789/hooks/agent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer dashboard-watcher-hook-token-2026',
            },
            body: JSON.stringify({
                message,
                name: 'Dashboard',
                deliver: false,
            }),
        });
        if (res.ok) {
            console.log('[watch-board] Charley triggered via /hooks/agent');
        } else {
            console.warn('[watch-board] Agent trigger failed:', res.status, await res.text());
        }
    } catch (err) {
        console.warn('[watch-board] Agent trigger error:', err.message);
    }
}

console.log('[watch-board] Listening for dashboard changes...');

let lastSeen = getLastSeen();
const processed = new Set();    // Tracks comment fingerprints already handled
let debounceTimer = null;       // Prevents rapid-fire duplicate processing
let pendingEntries = [];

function flushPending() {
    if (pendingEntries.length === 0) return;
    const toSend = [...pendingEntries];
    pendingEntries = [];

    // Find the latest timestamp in this batch
    const latestTs = Math.max(...toSend.map(e => new Date(e.commentTs).getTime()));

    writeInbox(toSend);
    saveLastSeen(latestTs);
    lastSeen = latestTs;

    pingCharley(toSend);

    for (const e of toSend) {
        console.log(`[watch-board] NEW: "${e.taskTitle}" (${e.taskId}): ${e.text}`);
    }
}

db.collection('board').doc('state').onSnapshot(
    (snap) => {
        if (!snap.exists) return;

        const data = snap.data();
        const tasks = data?.boardData?.tasks || {};
        let gotNew = false;

        for (const [taskId, task] of Object.entries(tasks)) {
            if (task.archived) continue;
            for (const comment of (task.comments || [])) {
                const ts = new Date(comment.timestamp).getTime();
                const fingerprint = `${taskId}:${comment.timestamp}`;
                if (comment.author === 'Chris' && ts > lastSeen && !processed.has(fingerprint)) {
                    processed.add(fingerprint);
                    pendingEntries.push({
                        taskId,
                        taskTitle: task.title,
                        taskAgent: task.agent,
                        text: comment.text || comment.message || '',
                        commentTs: comment.timestamp,
                    });
                    gotNew = true;
                }
            }
        }

        if (gotNew) {
            // Debounce: wait 2s so rapid Firestore callbacks collapse into one ping
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(flushPending, 2000);
        }
    },
    (err) => console.error('[watch-board] Listener error:', err.message)
);

process.on('SIGINT', () => {
    console.log('[watch-board] Shutting down...');
    process.exit(0);
});
