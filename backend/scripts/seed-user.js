import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { putUser, putEvent, putStamp } from '../src/lib/dynamo.js';
dotenv.config();

const TABLE = process.env.DYNAMODB_TABLE_USERS || 'CareerPassportUsers';
const TABLE_EVENTS = process.env.DYNAMODB_TABLE_EVENTS || 'CareerPassportEvents';
const TABLE_STAMPS = process.env.DYNAMODB_TABLE_STAMPS || 'CareerPassportStamps';
const email = process.env.SEED_EMAIL || 'org@example.com';
const password = process.env.SEED_PASSWORD || 'password123';
const name = process.env.SEED_NAME || 'Org Admin';

async function seed() {
  try {
    // ユーザー（組織）のシード
    const passwordHash = await bcrypt.hash(password, 10);
    const user = { 
      email, 
      passwordHash, 
      name, 
      role: 'org', 
      createdAt: new Date().toISOString() 
    };
    await putUser(TABLE, user);
    console.log('Seeded user:', email);

    // イベントのサンプルデータ
    const events = [
      {
        eventId: 'event-001',
        orgEmail: email,
        title: 'キャリアセミナー2024',
        description: '就活生向けキャリアセミナー',
        satisfactionScore: 4.5,
        createdAt: new Date().toISOString()
      },
      {
        eventId: 'event-002',
        orgEmail: email,
        title: 'インターンシップ説明会',
        description: '夏季インターンシップの説明会',
        satisfactionScore: 4.2,
        createdAt: new Date().toISOString()
      },
      {
        eventId: 'event-003',
        orgEmail: email,
        title: '業界研究ワークショップ',
        description: 'IT業界の研究ワークショップ',
        satisfactionScore: null,
        createdAt: new Date().toISOString()
      }
    ];

    for (const event of events) {
      await putEvent(TABLE_EVENTS, event);
      console.log('Seeded event:', event.eventId);
    }

    // スタンプのサンプルデータ
    const stamps = [
      // event-001 の参加者
      { stampId: 'stamp-001', eventId: 'event-001', orgEmail: email, studentEmail: 'student1@example.com', issuedAt: new Date().toISOString() },
      { stampId: 'stamp-002', eventId: 'event-001', orgEmail: email, studentEmail: 'student2@example.com', issuedAt: new Date().toISOString() },
      { stampId: 'stamp-003', eventId: 'event-001', orgEmail: email, studentEmail: 'student3@example.com', issuedAt: new Date().toISOString() },
      // event-002 の参加者
      { stampId: 'stamp-004', eventId: 'event-002', orgEmail: email, studentEmail: 'student1@example.com', issuedAt: new Date().toISOString() },
      { stampId: 'stamp-005', eventId: 'event-002', orgEmail: email, studentEmail: 'student4@example.com', issuedAt: new Date().toISOString() },
      // event-003 の参加者
      { stampId: 'stamp-006', eventId: 'event-003', orgEmail: email, studentEmail: 'student2@example.com', issuedAt: new Date().toISOString() },
      { stampId: 'stamp-007', eventId: 'event-003', orgEmail: email, studentEmail: 'student5@example.com', issuedAt: new Date().toISOString() }
    ];

    for (const stamp of stamps) {
      await putStamp(TABLE_STAMPS, stamp);
      console.log('Seeded stamp:', stamp.stampId);
    }

    console.log('Seed completed successfully');
  } catch (err) {
    console.error('seed error', err);
    process.exit(1);
  }
}

seed();
