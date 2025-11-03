import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { a2aApiDirectoryRoute } from './routes/a2aroutehandler';
import { apiDirectoryAgent } from './agents/api-directory-agent';

export const mastra = new Mastra({
  agents: { apiDirectoryAgent },
  storage: new LibSQLStore({ url: ":memory:" }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'debug',
  }),
  observability: {
    default: { enabled: true },
  },
  server: {
    build: {
      openAPIDocs: true,
      swaggerUI: true,
    },
    apiRoutes: [a2aApiDirectoryRoute]
  }
});
