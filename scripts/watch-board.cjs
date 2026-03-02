#!/usr/bin/env node
/**
 * watch-board.cjs — Real-time Firestore dashboard watcher for Charley
 *
 * Replaces polling with a persistent Firestore listener.
 * Fires within ~100ms of a new Chris comment — no heartbeat needed.
 *
 * Usage:
 *   node /Users/charley/projects/task-dashboard/scripts/watch-board.cjs
 *
 * Run persistently via launchd (see com.charley.dashboard-watch.plist).
 * Writes new comments to ~/.openclaw/workspace/DASHBOARD_INBOX.md so
 * Charley's agent can read and respond via update-task.cjs comment.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json');
const INBOX_PATH = path.join(process.env.HOME, '.openclaw', 'workspace', 'DASHBOARD_INBOX.md');
const LAST_SEEN_PATH = path.join(__dirname, '..', '.last-watch-seen');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('Missing firebase-service-account.json in scripts/');
    process.exit(1);
}

initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
const db = getFirestore();

// Load the timestamp of the last comment we already handled
function getLastSeen() {
    try {
        return parseInt(fs.readFileSync(LAST_SEEN_PATH, 'utf8').trim(), 10);
    } catch {
        return Date.now(); // First run — only watch for NEW comments from this point
    }
}

function saveLastSeen(ts) {
    fs.writeFileSync(LAST_SEEN_PATH, String(ts));
}

function writeInbox(entries) {
    const timestamp = new Date().toLocaleString();
    const lines = [
        `<!-- auto-generated ${timestamp} -->`,
        '# Dashboard Inbox — New Comments from Chris',
        '',
        ...entries.map(({ taskId, taskTitle, taskAgent, text, commentTs }) => [
            `## ${taskTitle}`,
            `- Task ID: \`${taskId}\``,
            `- Assigned: ${taskAgent}`,
            `- Time: ${new Date(commentTs).toLocaleString()}`,
            `- Message: ${text}`,
            '',
            '**Action:** Reply using:',
            '```',
            `node /Users/charley/projects/task-dashboard/scripts/update-task.cjs comment \\`,
            `  --id "${taskId}" --author "Charley" --text "YOUR REPLY HERE"`,
            '```',
            '',
        ].join('\n')),
    ];
    fs.writeFileSync(INBOX_PATH, lines.join('\n'));
    console.log(`[watch-board] Inbox updated — ${entries.length} new message(s)`);
}

console.log('[watch-board] Listening for dashboard changes...');
let lastSeen = getLastSeen();

const unsubscribe = db.collection('board').doc('state').onSnapshot(
    (snap) => {
        if (!snap.exists) return;

        const data = snap.data();
        const tasks = data?.boardData?.tasks || {};
        const newEntries = [];
        let latestTs = lastSeen;

        for (const [taskId, task] of Object.entries(tasks)) {
            if (task.archived) continue;
            for (const comment of (task.comments || [])) {
                const ts = new Date(comment.timestamp).getTime();
                if (comment.author === 'Chris' && ts > lastSeen) {
                    newEntries.push({
                        taskId,
                        taskTitle: task.title,
                        taskAgent: task.agent,
                        text: comment.text || comment.message || '',
                        commentTs: comment.timestamp,
                    });
                    if (ts > latestTs) latestTs = ts;
                }
            }
        }

        if (newEntries.length > 0) {
            writeInbox(newEntries);
            saveLastSeen(latestTs);
            lastSeen = latestTs;

            // Log each new comment to stdout for OpenClaw to capture
            for (const e of newEntries) {
                console.log(`[watch-board] NEW COMMENT on "${e.taskTitle}" (${e.taskId}): ${e.text}`);
            }
        }
    },
    (err) => {
        console.error('[watch-board] Listener error:', err.message);
    }
);

// Keep process alive
process.on('SIGINT', () => {
    console.log('[watch-board] Shutting down...');
    unsubscribe();
    process.exit(0);
});
