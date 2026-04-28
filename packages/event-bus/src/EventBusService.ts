import Redis from 'ioredis';

export type EventHandler = (data: Record<string, unknown>) => void | Promise<void>;

export class EventBusService {
  private publisher: Redis;
  private subscriber: Redis;
  private handlers = new Map<string, EventHandler[]>();

  constructor(redisUrl: string) {
    this.publisher = new Redis(redisUrl, { lazyConnect: true });
    this.subscriber = new Redis(redisUrl, { lazyConnect: true });

    this.subscriber.on('message', async (channel: string, message: string) => {
      const handlers = this.handlers.get(channel) ?? [];
      let data: Record<string, unknown> = {};
      try {
        data = JSON.parse(message) as Record<string, unknown>;
      } catch {
        data = { raw: message };
      }
      for (const handler of handlers) {
        try {
          await handler(data);
        } catch (err) {
          console.error(`[EventBus] Handler error for ${channel}:`, err);
        }
      }
    });
  }

  async connect(): Promise<void> {
    await this.publisher.connect();
    await this.subscriber.connect();
    console.log('[EventBus] Connected to Redis');
  }

  async publish(event: string, data: Record<string, unknown>): Promise<void> {
    await this.publisher.publish(event, JSON.stringify(data));
  }

  subscribe(event: string, handler: EventHandler): void {
    const existing = this.handlers.get(event) ?? [];
    existing.push(handler);
    this.handlers.set(event, existing);
    this.subscriber.subscribe(event).catch(console.error);
  }

  async disconnect(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }
}

export const EVENTS = {
  BOOKING_CREATED: 'booking.created',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
  BOOKING_TERMINATED: 'booking.terminated',
  REVIEW_ADDED: 'review.added',
  SALON_UPDATED: 'salon.updated',
} as const;
