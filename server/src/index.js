import { createServer } from 'node:http';
import dns from 'node:dns';
import mongoose from 'mongoose';
import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { attachSockets } from './sockets/index.js';

if (env.DNS_SERVERS) dns.setServers(env.DNS_SERVERS.split(',').map(value => value.trim()).filter(Boolean));
await connectDatabase();
const app = createApp();
const server = createServer(app);
const io = attachSockets(server);
app.set('io', io);
server.listen(env.PORT, () => console.log(`HostelHub API listening on port ${env.PORT}`));
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  const timeout = setTimeout(() => process.exit(1), 10000);
  timeout.unref();
  io.close();
  server.close(async () => { await mongoose.disconnect(); clearTimeout(timeout); process.exit(0); });
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
