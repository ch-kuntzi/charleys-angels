#!/usr/bin/env node
/**
 * One-time script: migrates public/data/tasks.json → Firestore
 * Run once after setting up Firebase:
 *   node scripts/seed-firestore.cjs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const fs = require('fs');

const SERVICE_ACCOUNT_PATH = path.join(__dirname, 'firebase-service-account.json');
const TASKS_FILE = path.join(__dirname, '..', 'public', 'data', 'tasks.json');

if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
    console.error('❌ Missing firebase-service-account.json in scripts/');
    process.exit(1);
}

initializeApp({ credential: cert(require(SERVICE_ACCOUNT_PATH)) });
const db = getFirestore();

async function seed() {
    console.log('📖 Reading tasks.json...');
    const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
    const data = JSON.parse(raw);

    const payload = {
        boardData: data.boardData,
        categories: data.categories || ['Bug', 'Feature', 'Research', 'Admin', 'Urgent'],
        activity: data.activity || [],
        _lastModified: Date.now(),
    };

    console.log(`📋 Seeding ${Object.keys(data.boardData?.tasks || {}).length} tasks to Firestore...`);
    await db.collection('board').doc('state').set(payload);
    console.log('✅ Done! Firestore is now seeded with your current board data.');
    console.log('   All browsers will sync to Firestore from this point forward.');
    process.exit(0);
}

seed().catch(err => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
