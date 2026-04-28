import 'dotenv/config';
import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { UserService } from './UserService';

const PROTO_PATH = process.env.PROTO_PATH
  ? path.resolve(process.env.PROTO_PATH)
  : path.resolve(__dirname, '../../../proto');

const PORT = process.env.PORT ?? '50051';

const def = protoLoader.loadSync(path.join(PROTO_PATH, 'user.proto'), {
  keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
});
const pkg = grpc.loadPackageDefinition(def) as Record<string, grpc.GrpcObject>;

const server = new grpc.Server();
server.addService(
  (pkg['saloonify'] as Record<string, { service: grpc.ServiceDefinition }>)['UserService'].service,
  UserService,
);

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (err, port) => {
    if (err) { console.error('[user-service] Failed to bind:', err); process.exit(1); }
    console.log(`[user-service] gRPC running on port ${port}`);
  },
);
