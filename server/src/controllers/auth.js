import bcrypt from 'bcryptjs';
import { User, Session } from '../models/index.js';
import { createSession, publicUser } from '../services/auth.js';
import { cookieOptions } from '../config/env.js';
import { HttpError } from '../middleware/http.js';

export async function register(req, res) {
  const { password, firstName: suppliedFirst, lastName: suppliedLast, phone, username: suppliedUsername, email, role } = req.validated.body;
  const [firstName, ...lastParts] = (suppliedFirst ? `${suppliedFirst} ${suppliedLast}` : req.validated.body.name).trim().split(/\s+/);
  const lastName = suppliedLast || lastParts.join(' ');
  const username = suppliedUsername || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').slice(0, 24).padEnd(3, '_');
  const user = await User.create({ firstName, lastName, name: `${firstName} ${lastName}`, phone, username, email, role, password: await bcrypt.hash(password, 12) });
  await createSession(user, res);
  res.status(201).json({ data: publicUser(user) });
}
export async function usernameAvailable(req, res) {
  res.json({ data: { available: !(await User.exists({ username: req.validated.query.username })) } });
}
const dummyHash = bcrypt.hashSync('not-a-real-password', 12);
export async function login(req, res) {
  const { username: loginName, password } = req.validated.body;
  const user = await User.findOne(loginName.includes('@') ? { email: loginName.toLowerCase() } : { username: loginName.toLowerCase() }).select('+password');
  const valid = await bcrypt.compare(password, user?.password || dummyHash);
  if (!valid || !user?.active) throw new HttpError(401, 'Invalid username or password');
  await createSession(user, res);
  res.json({ data: publicUser(user) });
}
export async function logout(req, res) {
  await Session.deleteOne({ _id: req.sessionId });
  req.app.get('io')?.in(`session:${req.sessionId}`).disconnectSockets(true);
  res.clearCookie('session', cookieOptions).status(204).end();
}
export async function profile(req, res) {
  req.user.name = req.validated.body.name;
  await req.user.save();
  res.json({ data: publicUser(req.user) });
}
