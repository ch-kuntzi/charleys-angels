#!/usr/bin/env node
/**
 * Dashboard Task Manager — CLI for Charley's agents
 * 
 * Usage:
 *   node scripts/update-task.js add --title "Fix login" --agent Coder --priority High --category Bug
 *   node scripts/update-task.js move --id task-123 --column "In Progress"
 *   node scripts/update-task.js complete --id task-123
 *   node scripts/update-task.js list
 * 
 * After updating, the script auto-commits and pushes to GitHub.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DATA_FILE = path.join(__dirname, '..', 'public', 'data', 'tasks.json');

function loadData() {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2) + '\n');
}

function commitAndPush(message) {
    try {
        execSync(`git -C "${path.dirname(DATA_FILE)}/.." add public/data/tasks.json`, { stdio: 'pipe' });
        execSync(`git -C "${path.dirname(DATA_FILE)}/.." commit -m "${message}"`, { stdio: 'pipe' });
        execSync(`git -C "${path.dirname(DATA_FILE)}/.." push`, { stdio: 'pipe' });
        console.log(`✅ Pushed: ${message}`);
    } catch (err) {
        console.log('⚠️  Saved locally (git push failed)');
    }
}

function addTask({ title, description = '', agent = 'Charley', priority = 'Medium', category = 'Feature', dueDate = '', column = 'column-1' }) {
    const data = loadData();
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

    saveData(data);
    commitAndPush(`[dashboard] Add task: ${title}`);
    console.log(`📋 Created task ${id}: "${title}"`);
    return id;
}

function moveTask(taskId, columnTitle) {
    const data = loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    // Find target column
    const targetCol = Object.values(data.boardData.columns).find(c =>
        c.title.toLowerCase() === columnTitle.toLowerCase()
    );
    if (!targetCol) { console.error(`❌ Column "${columnTitle}" not found`); return; }

    // Remove from current column
    for (const col of Object.values(data.boardData.columns)) {
        col.taskIds = col.taskIds.filter(id => id !== taskId);
    }

    // Add to target column
    targetCol.taskIds.push(taskId);

    data.activity = data.activity || [];
    data.activity.unshift({
        id: Date.now(),
        action: 'moved',
        details: `"${task.title}" → ${targetCol.title}`,
        timestamp: new Date().toLocaleString(),
    });

    saveData(data);
    commitAndPush(`[dashboard] Move "${task.title}" to ${targetCol.title}`);
    console.log(`📦 Moved "${task.title}" → ${targetCol.title}`);
}

function completeTask(taskId) {
    moveTask(taskId, 'Deployed');
}

function listTasks() {
    const data = loadData();
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

function addComment(taskId, message, author = 'Charley') {
    const data = loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    task.comments = task.comments || [];
    task.comments.push({
        id: Date.now(),
        author,
        message,
        timestamp: new Date().toLocaleString(),
    });

    saveData(data);
    commitAndPush(`[dashboard] Comment on "${task.title}"`);
    console.log(`💬 Added comment to "${task.title}"`);
}

function viewTask(taskId) {
    pullLatest();
    const data = loadData();
    const task = data.boardData.tasks[taskId];
    if (!task) { console.error(`❌ Task ${taskId} not found`); return; }

    // Find which column it's in
    let currentColumn = 'Unknown';
    for (const col of Object.values(data.boardData.columns)) {
        if (col.taskIds.includes(taskId)) {
            currentColumn = col.title;
            break;
        }
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

function updateTask(taskId, fields) {
    pullLatest();
    const data = loadData();
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

    if (changes.length === 0) {
        console.log('No fields to update. Use --description, --title, --priority, --agent, --dueDate, --category');
        return;
    }

    saveData(data);
    commitAndPush(`[dashboard] Update "${task.title}": ${changes.join(', ')}`);
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

function dashboardCheck() {
    pullLatest();
    const data = loadData();
    const { columns, columnOrder, tasks } = data.boardData;
    const lastCheck = getLastCheckTime();

    console.log(`\n🔍 Dashboard Check (since ${lastCheck.toLocaleString()})`);
    console.log('─'.repeat(50));

    // Collect tasks with new activity
    let hasUpdates = false;

    // Check for 🚀 flagged tasks first
    const flagged = [];
    const withNewComments = [];

    for (const [id, task] of Object.entries(tasks)) {
        if (task.archived) continue;
        const comments = task.comments || [];

        for (const c of comments) {
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

    // Check activity log for new entries
    const newActivity = (data.activity || []).filter(a => new Date(a.timestamp) > lastCheck);
    if (newActivity.length > 0) {
        console.log(`\n📊 ACTIVITY LOG (${newActivity.length} new):`);
        for (const a of newActivity.slice(0, 10)) {
            console.log(`   [${a.action}] ${a.details}`);
        }
        hasUpdates = true;
    }

    if (!hasUpdates) {
        console.log('\n✅ No new updates since last check.');
    }

    // Show current board summary
    console.log('\n📋 BOARD STATUS:');
    for (const colId of columnOrder) {
        const col = columns[colId];
        if (col.taskIds.length > 0) {
            console.log(`   ${col.title}: ${col.taskIds.length} task(s)`);
            for (const tid of col.taskIds) {
                const t = tasks[tid];
                if (t) {
                    const urgent = (t.tags || []).includes('Urgent') ? ' ⚡URGENT' : '';
                    const delivery = t.deliveryMethod === 'notebook' ? ' 📓NLM' : t.deliveryMethod === 'comment' ? ' 📝' : '';
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
for (let i = 0; i < args.length; i += 2) {
    if (args[i]?.startsWith('--')) {
        flags[args[i].slice(2)] = args[i + 1];
    }
}

switch (command) {
    case 'add':
        addTask(flags);
        break;
    case 'move':
        moveTask(flags.id, flags.column);
        break;
    case 'complete':
        completeTask(flags.id);
        break;
    case 'comment':
        addComment(flags.id, flags.message, flags.author);
        break;
    case 'view':
        viewTask(flags.id);
        break;
    case 'update':
        updateTask(flags.id, flags);
        break;
    case 'check':
        dashboardCheck();
        break;
    case 'list':
        pullLatest();
        listTasks();
        break;
    default:
        console.log(`Usage: node update-task.cjs <add|move|complete|comment|view|update|check|list> [--flags]`);
}
