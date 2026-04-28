import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const PROTO_PATH = process.env.PROTO_PATH
  ? path.resolve(process.env.PROTO_PATH)
  : path.resolve(__dirname, '../../../../proto');

const USER_SERVICE_HOST    = process.env.USER_SERVICE_HOST    ?? 'localhost:50051';
const SALON_SERVICE_HOST   = process.env.SALON_SERVICE_HOST   ?? 'localhost:50052';
const BOOKING_SERVICE_HOST = process.env.BOOKING_SERVICE_HOST ?? 'localhost:50053';
const REVIEW_SERVICE_HOST  = process.env.REVIEW_SERVICE_HOST  ?? 'localhost:50054';

function loadProto(file: string) {
  const def = protoLoader.loadSync(path.join(PROTO_PATH, file), {
    keepCase: true, longs: String, enums: String, defaults: true, oneofs: true,
  });
  return grpc.loadPackageDefinition(def) as Record<string, grpc.GrpcObject>;
}

const creds = grpc.credentials.createInsecure();
type GrpcService = new (host: string, creds: grpc.ChannelCredentials) => grpc.Client;

const userPkg    = loadProto('user.proto');
const salonPkg   = loadProto('salon.proto');
const bookingPkg = loadProto('booking.proto');
const reviewPkg  = loadProto('review.proto');

export const userClient    = new ((userPkg['saloonify']    as Record<string, GrpcService>)['UserService'])(USER_SERVICE_HOST, creds);
export const salonClient   = new ((salonPkg['saloonify']   as Record<string, GrpcService>)['SalonService'])(SALON_SERVICE_HOST, creds);
export const bookingClient = new ((bookingPkg['saloonify'] as Record<string, GrpcService>)['BookingService'])(BOOKING_SERVICE_HOST, creds);
export const reviewClient  = new ((reviewPkg['saloonify']  as Record<string, GrpcService>)['ReviewService'])(REVIEW_SERVICE_HOST, creds);

export function call<TReq, TRes>(client: grpc.Client, method: string, request: TReq): Promise<TRes> {
  return new Promise((resolve, reject) => {
    (client as unknown as Record<string, (req: TReq, cb: (err: grpc.ServiceError | null, res: TRes) => void) => void>)[method](
      request,
      (err, res) => { if (err) return reject(err); resolve(res); },
    );
  });
}
