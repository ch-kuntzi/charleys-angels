#!/usr/bin/env node
/**
 * Dashboard Task Manager — CLI for Charley's agents
 * 
 * Usage:
 *   node scripts/update-task.cjs add --title "Fix login" --agent Coder --priority High --category Bug
 *   node scripts/update-task.cjs move --id task-123 --column "In Progress"
 *   node scripts/update-task.cjs complete --id task-123
 *   node scripts/update-task.cjs list
 * 
 * Writes directly to Firestore — all browsers update within ~100ms.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Missing firebase-service-account.json in scripts/. See README for setup.');
    process.exit(1);
}

initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
const db = getFirestore();
const BOARD_REF = db.collection('board').doc('state');

async function loadData() {
    const snap = await BOARD_REF.get();
    if (!snap.exists) {
        console.error('❌ No board data found in Firestore. Run the seed script first.');
        process.exit(1);
    }
    return snap.data();
}

async function saveData(data) {
    data._lastModified = Date.now();
    await BOARD_REF.set(data);
}


async function addTask({ title, description = '', agent = 'Charley', priority = 'Medium', category = 'Feature', dueDate = '', column = 'column-1' }) {
    const data = await loadData();
    const id = `task-${Date.now()}`;

    data.boardData.tasks[id] = {
        id,
        title,
        description,
        agent,
        priority,
        timestamp: new Date().toLocaleString(),
        tags: [category],
        dueDate,
        dueTime: '07:00',
        comments: [],
        attachments: [],
        reviewLink: '',
        archived: false,
    };

    if (data.boardData.columns[column]) {
        data.boardData.columns[column].taskIds.push(id);
    }

    data.activity = data.activity || [];
    data.activity.unshift({
        id: Date.now(),
        action: 'created',
        details: `"${title}" assigned to ${agent}`,
        timestamp: new Date().toLocaleString(),
    });

    await saveData(data);
    console.log(`📋 Created task ${id}: "${title}"`);
    return id;
}

async function moveTask(taskId, columnTitle) {
    const data = await loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    const targetCol = Object.values(data.boardData.columns).find(c =>
        c.title.toLowerCase() === columnTitle.toLowerCase()
    );
    if (!targetCol) { console.error(`❌ Column "${columnTitle}" not found`); return; }

    for (const col of Object.values(data.boardData.columns)) {
        col.taskIds = col.taskIds.filter(id => id !== taskId);
    }
    targetCol.taskIds.push(taskId);

    data.activity = data.activity || [];
    data.activity.unshift({
        id: Date.now(),
        action: 'moved',
        details: `"${task.title}" → ${targetCol.title}`,
        timestamp: new Date().toLocaleString(),
    });

    await saveData(data);
    console.log(`📦 Moved "${task.title}" → ${targetCol.title}`);
}

async function completeTask(taskId) {
    await moveTask(taskId, 'Deployed');
}

async function listTasks() {
    const data = await loadData();
    const { columns, columnOrder, tasks } = data.boardData;
    for (const colId of columnOrder) {
        const col = columns[colId];
        console.log(`\n📂 ${col.title} (${col.taskIds.length})`);
        for (const tid of col.taskIds) {
            const t = tasks[tid];
            if (t) console.log(`   ${t.id} | ${t.priority} | ${t.agent} | ${t.title}`);
        }
    }
}

async function addComment(taskId, message, author = 'Charley') {
    const data = await loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    task.comments = task.comments || [];
    task.comments.push({
        id: Date.now(),
        author,
        text: message,
        message,
        timestamp: new Date().toISOString(),
    });

    await saveData(data);
    console.log(`💬 Added comment to "${task.title}"`);
}

async function viewTask(taskId) {
    const data = await loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    let currentColumn = 'Unknown';
    for (const col of Object.values(data.boardData.columns)) {
        if (col.taskIds.includes(taskId)) { currentColumn = col.title; break; }
    }

    console.log(`\n📋 ${task.title}`);
    console.log(`   ID:       ${task.id}`);
    console.log(`   Agent:    ${task.agent}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Column:   ${currentColumn}`);
    console.log(`   Due:      ${task.dueDate || 'Not set'}`);
    if (task.description) console.log(`   Desc:     ${task.description}`);

    if (task.comments && task.comments.length > 0) {
        console.log(`\n   💬 Conversation (${task.comments.length}):`);
        for (const c of task.comments) {
            const text = c.text || c.message || '';
            console.log(`   [${c.timestamp}] ${c.author}: ${text}`);
            if (c.attachment) {
                console.log(`     📎 ${c.attachment.name} → ${c.attachment.localPath || c.attachment.url}`);
            }
        }
    } else {
        console.log(`\n   💬 No comments yet`);
    }

    if (task.attachments && task.attachments.length > 0) {
        console.log(`\n   📎 Attachments (${task.attachments.length}):`);
        for (const a of task.attachments) {
            console.log(`     ${a.name} (${a.type}) → ${a.localPath || a.url}`);
        }
    }

    if (task.deliveryMethod) console.log(`   📦 Delivery: ${task.deliveryMethod}`);
    if (task.thinkingLevel) console.log(`   🧠 Thinking: ${task.thinkingLevel}`);
}

function pullLatest() {
    try {
        execSync(`git -C "${path.join(__dirname, '..')}" pull --rebase`, { stdio: 'pipe' });
    } catch (err) {
        // Silent fail — might be offline
    }
}

async function updateTask(taskId, fields) {
    const data = await loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    const updatable = ['title', 'description', 'priority', 'agent', 'dueDate', 'reviewLink'];
    const changes = [];
    for (const key of updatable) {
        if (fields[key] !== undefined) {
            task[key] = fields[key];
            changes.push(`${key}="${fields[key]}"`);
        }
    }
    if (fields.category) {
        task.tags = [fields.category];
        changes.push(`category="${fields.category}"`);
    }

    if (fields.status) {
        const targetCol = Object.values(data.boardData.columns).find(c =>
            c.title.toLowerCase() === fields.status.toLowerCase()
        );
        if (targetCol) {
            for (const col of Object.values(data.boardData.columns)) {
                col.taskIds = col.taskIds.filter(id => id !== taskId);
            }
            targetCol.taskIds.push(taskId);
            changes.push(`status="${targetCol.title}"`);
            data.activity = data.activity || [];
            data.activity.unshift({
                id: Date.now(),
                action: 'moved',
                details: `"${task.title}" → ${targetCol.title}`,
                timestamp: new Date().toLocaleString(),
            });
        } else {
            console.warn(`⚠️  Column "${fields.status}" not found — status not changed`);
        }
    }

    if (changes.length === 0) {
        console.log('No fields to update. Use --description, --title, --priority, --agent, --dueDate, --category, --status, --reviewLink');
        return;
    }

    await saveData(data);
    console.log(`✏️  Updated "${task.title}": ${changes.join(', ')}`);
}

const LAST_CHECK_FILE = path.join(__dirname, '..', '.last-dashboard-check');

function getLastCheckTime() {
    try {
        return new Date(fs.readFileSync(LAST_CHECK_FILE, 'utf8').trim());
    } catch {
        // First time — treat as 24 hours ago
        return new Date(Date.now() - 86400000);
    }
}

function saveLastCheckTime() {
    fs.writeFileSync(LAST_CHECK_FILE, new Date().toISOString());
}

async function dashboardCheck() {
    const data = await loadData();
    const { columns, columnOrder, tasks } = data.boardData;
    const lastCheck = getLastCheckTime();

    console.log(`\n🔍 Dashboard Check (since ${lastCheck.toLocaleString()})`);
    console.log('─'.repeat(50));

    let hasUpdates = false;
    const flagged = [];
    const withNewComments = [];

    for (const [id, task] of Object.entries(tasks)) {
        if (task.archived) continue;
        for (const c of (task.comments || [])) {
            const commentTime = new Date(c.timestamp);
            if (commentTime > lastCheck) {
                const text = c.text || c.message || '';
                if (text.includes('🚀') || text.includes('Start this now')) {
                    flagged.push({ task, comment: c, text });
                } else {
                    withNewComments.push({ task, comment: c, text });
                }
            }
        }
    }

    if (flagged.length > 0) {
        console.log(`\n🚀 FLAGGED — START NOW (${flagged.length}):`);
        for (const f of flagged) {
            console.log(`   ${f.task.id} | ${f.task.priority} | ${f.task.agent} | ${f.task.title}`);
            console.log(`     💬 [${f.comment.author}]: ${f.text}`);
        }
        hasUpdates = true;
    }

    if (withNewComments.length > 0) {
        console.log(`\n💬 NEW MESSAGES (${withNewComments.length}):`);
        for (const m of withNewComments) {
            console.log(`   ${m.task.id} | ${m.task.agent} | ${m.task.title}`);
            console.log(`     [${m.comment.author}]: ${m.text}`);
        }
        hasUpdates = true;
    }

    const newActivity = (data.activity || []).filter(a => new Date(a.timestamp) > lastCheck);
    if (newActivity.length > 0) {
        console.log(`\n📊 ACTIVITY LOG (${newActivity.length} new):`);
        for (const a of newActivity.slice(0, 10)) console.log(`   [${a.action}] ${a.details}`);
        hasUpdates = true;
    }

    if (!hasUpdates) console.log('\n✅ No new updates since last check.');

    console.log('\n📋 BOARD STATUS:');
    for (const colId of columnOrder) {
        const col = columns[colId];
        if (col.taskIds.length > 0) {
            console.log(`   ${col.title}: ${col.taskIds.length} task(s)`);
            for (const tid of col.taskIds) {
                const t = tasks[tid];
                if (t) {
                    const urgent = (t.tags || []).includes('Urgent') ? ' ⚡URGENT' : '';
                    const deliveryMap = { 'nlm-infographic': ' 📊Infographic', 'nlm-audio': ' 🎙️Audio', 'nlm-slides': ' 📑Slides', 'nlm-mindmap': ' 🧠MindMap', 'nlm-summary': ' 📝Summary', 'comment': ' 💬Comment', 'notebook': ' 📓NLM' };
                    const delivery = deliveryMap[t.deliveryMethod] || '';
                    const thinking = t.thinkingLevel === 'deep' ? ' 🔬Deep' : t.thinkingLevel === 'quick' ? ' ⚡Quick' : '';
                    console.log(`     ${t.priority}${urgent}${delivery}${thinking} | ${t.title} (${t.agent})`);
                }
            }
        }
    }

    saveLastCheckTime();
    console.log(`\n✅ Check complete. Next check will show updates after ${new Date().toLocaleString()}`);
}

// CLI
const [, , command, ...args] = process.argv;
const flags = {};
let currentFlag = null;
for (let i = 0; i < args.length; i++) {
    if (args[i]?.startsWith('--')) {
        currentFlag = args[i].slice(2);
        flags[currentFlag] = '';
    } else if (currentFlag) {
        flags[currentFlag] = flags[currentFlag] ? flags[currentFlag] + ' ' + args[i] : args[i];
    }
}

(async () => {
    switch (command) {
        case 'add': await addTask(flags); break;
        case 'move': await moveTask(flags.id, flags.column || flags.to); break;
        case 'complete': await completeTask(flags.id); break;
        case 'comment': await addComment(flags.id, flags.text || flags.message, flags.author); break;
        case 'view': await viewTask(flags.id); break;
        case 'update': await updateTask(flags.id, flags); break;
        case 'check': await dashboardCheck(); break;
        case 'list': await listTasks(); break;
        default: console.log(`Usage: node update-task.cjs <add|move|complete|comment|view|update|check|list> [--flags]`);
    }
    process.exit(0);
})();
