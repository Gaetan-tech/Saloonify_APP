import 'dotenv/config';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { EventBusService } from '@saloonify/event-bus';
import { createSalonService } from './SalonService';

const PROTO_PATH = process.env.PROTO_PATH
  ? path.resolve(process.env.PROTO_PATH)
  : path.resolve(__dirname, '../../../proto');

const PORT = process.env.PORT ?? '50052';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const def = protoLoader.loadSync(path.join(PROTO_PATH, 'salon.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const pkg = grpc.loadPackageDefinition(def) as Record<string, grpc.GrpcObject>;

async function main() {
  const eventBus = new EventBusService(REDIS_URL);
  try {
    await eventBus.connect();
    console.log('[salon-service] Connected to Redis');
  } catch {
    console.warn('[salon-service] Redis not available, events will be skipped');
  }

  const server = new grpc.Server();
  server.addService(
    (pkg['saloonify'] as Record<string, { service: grpc.ServiceDefinition }>)['SalonService'].service,
    createSalonService(eventBus),
  );

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) { console.error('[salon-service] Failed to bind:', err); process.exit(1); }
      console.log(`[salon-service] gRPC running on port ${port}`);
    },
  );
}

main().catch((err) => { console.error('[salon-service] Fatal error:', err); process.exit(1); });
