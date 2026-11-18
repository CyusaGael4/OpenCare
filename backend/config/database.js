import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Reduce a connection string to something safe to print.
 * Credentials, query options and database name are deliberately removed.
 */
function describeTarget(uri) {
  try {
    const withoutScheme = uri.split('://')[1] ?? '';
    const authority = withoutScheme.split('/')[0];
    const host = authority.includes('@') ? authority.split('@').pop() : authority;
    return host;
  } catch {
    return '(unparseable host)';
  }
}

/**
 * Turn driver-level failures into a single actionable line for the developer.
 * Atlas misconfiguration is the most common cause, so the hints are specific.
 */
function explainConnectionError(error) {
  const message = String(error?.message ?? '');

  if (error?.code === 18 || /Authentication failed/i.test(message)) {
    return 'Authentication failed. Check MONGODB_USERNAME / MONGODB_PASSWORD in backend/.env (the database user, not your Atlas login).';
  }
  if (/querySrv|ENOTFOUND|EAI_AGAIN/i.test(message) || error?.code === 'ENOTFOUND') {
    return 'The cluster hostname could not be resolved. Check your internet connection, VPN/DNS settings, and that the cluster still exists.';
  }
  if (/ETIMEOUT|server selection timed out|ESERVFAIL/i.test(message) || error?.name === 'MongooseServerSelectionError') {
    return 'No cluster node accepted the connection. Most often this is the Atlas IP Access List — add your current IP (Atlas → Network Access).';
  }
  if (/bad auth|SCRAM/i.test(message)) {
    return 'The database rejected the credentials. Verify the user exists in Atlas → Database Access with readWrite on this cluster.';
  }
  return 'The database connection failed. See the driver message above.';
}

export async function connectDatabase() {
  const target = describeTarget(env.mongoUri);
  const isSrv = env.mongoUri.startsWith('mongodb+srv://');

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected.');
  });
  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected.');
  });

  try {
    await mongoose.connect(env.mongoUri, {
      // The URI may not name a database, so bind it explicitly.
      dbName: env.mongoDbName,
      serverSelectionTimeoutMS: 12_000,
      socketTimeoutMS: 45_000,
      maxPoolSize: 10,
      autoIndex: !env.isProduction,
      ...(isSrv ? {} : { directConnection: false }),
    });
  } catch (error) {
    logger.error(`Could not connect to MongoDB at ${target}.`);
    logger.error(explainConnectionError(error));
    logger.debug(`Driver error: ${error?.message ?? error}`);
    throw error;
  }

  const { host, port, name } = mongoose.connection;
  logger.info(`MongoDB connected → ${host}${port ? `:${port}` : ''}/${name}`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed.');
  }
}

export function databaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting', 'uninitialized'];
  return {
    state: states[mongoose.connection.readyState] ?? 'unknown',
    readyState: mongoose.connection.readyState,
    name: mongoose.connection.name ?? null,
  };
}
