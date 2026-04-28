import 'dotenv/config';
import http from 'http';
import path from 'path';
import express from 'express';
import cookieParser from 'cookie-parser';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { typeDefs } from './graphql/typeDefs';
import { resolvers } from './graphql/resolvers';
import { buildContext, GraphQLContext } from './graphql/context';
import { corsMiddleware } from './middleware/cors';
import { requestIdMiddleware, morganMiddleware } from './middleware/logger';
import { authMiddleware } from './middleware/auth';
import router from './routes';

const PORT = Number(process.env.PORT ?? 4000);

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  const apolloServer = new ApolloServer<GraphQLContext>({ typeDefs, resolvers });
  await apolloServer.start();

  app.use(corsMiddleware);
  app.use(express.json());
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(morganMiddleware);
  app.use(authMiddleware);

  app.use('/uploads', express.static(path.resolve('./public/uploads')));
  app.use('/', router);
  app.use('/graphql', expressMiddleware(apolloServer, { context: async (args) => buildContext(args) }));

  httpServer.listen(PORT, () => {
    console.log(`[api-gateway] Running at http://localhost:${PORT}`);
    console.log(`[api-gateway] GraphQL at http://localhost:${PORT}/graphql`);
  });
}

bootstrap().catch(console.error);
