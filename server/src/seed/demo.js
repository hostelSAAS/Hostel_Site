import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User, Hostel, Conversation, Message } from '../models/index.js';

if (env.NODE_ENV === 'production') throw new Error('Demo seeding is disabled in production');
const password = process.env.SEED_PASSWORD || 'Password123!';
if (password.length < 10 || Buffer.byteLength(password) > 72) throw new Error('SEED_PASSWORD must be 10-72 bytes');
try {
  await connectDatabase();
  const accounts = {};
  for (const role of ['STUDENT', 'OWNER', 'ADMIN']) {
    const email = `${role.toLowerCase()}@example.com`;
    accounts[role] = await User.findOneAndUpdate(
      { email },
      { $setOnInsert: { name: `Demo ${role.toLowerCase()}`, email, role, password: await bcrypt.hash(password, 12) }, $set: { username: role.toLowerCase() } },
      { upsert: true, new: true, runValidators: true },
    );
  }
  const owner = accounts.OWNER._id;
  let hostel = await Hostel.findOne({ owner, name: 'Demo Olive House' });
  hostel ||= await Hostel.create({ owner, name: 'Demo Olive House', description: 'A quiet student residence near campus.', city: 'Lahore', address: 'Gulberg III', price: 28500, beds: 12, amenities: ['WiFi', 'Laundry'], status: 'APPROVED' });
  if (!await Hostel.exists({ owner, name: 'Demo Campus House' })) await Hostel.create({ owner, name: 'Demo Campus House', description: 'A listing waiting for review.', city: 'Lahore', address: 'Johar Town', price: 22000, beds: 6, status: 'PENDING' });
  await User.updateOne({ _id: accounts.STUDENT._id }, { $addToSet: { favorites: hostel._id } });
  const conversation = await Conversation.findOneAndUpdate({ hostel: hostel._id, student: accounts.STUDENT._id }, { $setOnInsert: { owner } }, { upsert: true, new: true });
  if (!await Message.exists({ conversation: conversation._id })) await Message.create({ conversation: conversation._id, sender: accounts.STUDENT._id, recipient: owner, text: 'Is a room available for a visit this week?' });
  console.log(`Demo accounts: student, owner, admin. Password: ${process.env.SEED_PASSWORD ? 'SEED_PASSWORD' : 'Password123!'}; existing passwords are unchanged.`);
} finally { await mongoose.disconnect(); }
