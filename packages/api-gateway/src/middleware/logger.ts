import morgan from 'morgan';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
});

export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = (req.headers['x-request-id'] as string) ?? uuidv4();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

morgan.token('request-id', (req: Request) => req.requestId ?? '-');
morgan.token('user-id', (req: Request) => req.user?.id ?? 'anonymous');
morgan.token('user-role', (req: Request) => req.user?.role ?? '-');

export const morganMiddleware = morgan(
  ':request-id :method :url :status :response-time ms — user::user-id role::user-role',
  {
    stream: {
      write: (message: string) => {
        winstonLogger.http(message.trim());
      },
    },
  },
);
