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
    case 'list':
        listTasks();
        break;
    default:
        console.log(`Usage: node update-task.js <add|move|complete|comment|list> [--flags]`);
}
