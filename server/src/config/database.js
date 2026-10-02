import mongoose from 'mongoose';
import dns from 'node:dns';
import { env } from './env.js';

let connectionPromise;

if (env.DNS_SERVERS) {
  dns.setServers(env.DNS_SERVERS.split(',').map(value => value.trim()).filter(Boolean));
}

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 })
      .then(() => mongoose.connection)
      .catch(error => { connectionPromise = undefined; throw error; });
  }
  return connectionPromise;
}
