export function createOpenAPIDocument() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'Family OS API',
      version: '0.1.0',
      description: 'Open-core, local-first Family OS backend API and sync endpoints.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          responses: {
            '200': {
              description: 'Server status and current timestamp',
            },
          },
        },
      },
      '/sync/push': {
        post: {
          summary: 'Push offline local mutations',
          responses: {
            '200': {
              description: 'Applied count and updated cursor',
            },
          },
        },
      },
      '/vault/break-glass/initiate': {
        post: {
          summary: 'Initiate 48-hour Break-Glass emergency vault unlock',
          responses: {
            '200': {
              description: 'Break-glass request pending cooldown',
            },
          },
        },
      },
    },
    components: {
      schemas: {},
    },
  };
}
