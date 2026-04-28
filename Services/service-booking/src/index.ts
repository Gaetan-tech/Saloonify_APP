import 'dotenv/config';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { EventBusService } from '@saloonify/event-bus';
import { createBookingService } from './BookingService';

const PROTO_PATH = process.env.PROTO_PATH
  ? path.resolve(process.env.PROTO_PATH)
  : path.resolve(__dirname, '../../../proto');

const PORT = process.env.PORT ?? '50053';
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

const def = protoLoader.loadSync(path.join(PROTO_PATH, 'booking.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const pkg = grpc.loadPackageDefinition(def) as Record<string, grpc.GrpcObject>;

async function main() {
  const eventBus = new EventBusService(REDIS_URL);
  try {
    await eventBus.connect();
    console.log('[booking-service] Connected to Redis');
  } catch {
    console.warn('[booking-service] Redis not available, events will be skipped');
  }

  const server = new grpc.Server();
  server.addService(
    (pkg['saloonify'] as Record<string, { service: grpc.ServiceDefinition }>)['BookingService'].service,
    createBookingService(eventBus),
  );

  server.bindAsync(
    `0.0.0.0:${PORT}`,
    grpc.ServerCredentials.createInsecure(),
    (err, port) => {
      if (err) { console.error('[booking-service] Failed to bind:', err); process.exit(1); }
      console.log(`[booking-service] gRPC running on port ${port}`);
    },
  );
}

main().catch((err) => { console.error('[booking-service] Fatal error:', err); process.exit(1); });
