import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { UserSchema, HouseholdMemberSchema } from './auth';
import {
  SyncPushRequestSchema,
  SyncPushResponseSchema,
  SyncPullRequestSchema,
  SyncPullResponseSchema,
} from './sync';
import {
  VaultItemSchema,
  VaultItemCreateSchema,
  BreakGlassInitiateSchema,
  BreakGlassVetoSchema,
} from './vault';

// Register schemas with OpenAPI metadata
export const OpenApiUser = UserSchema.openapi('User');
export const OpenApiHouseholdMember = HouseholdMemberSchema.openapi('HouseholdMember');
export const OpenApiSyncPushRequest = SyncPushRequestSchema.openapi('SyncPushRequest');
export const OpenApiSyncPushResponse = SyncPushResponseSchema.openapi('SyncPushResponse');
export const OpenApiSyncPullRequest = SyncPullRequestSchema.openapi('SyncPullRequest');
export const OpenApiSyncPullResponse = SyncPullResponseSchema.openapi('SyncPullResponse');
export const OpenApiVaultItem = VaultItemSchema.openapi('VaultItem');
export const OpenApiVaultItemCreate = VaultItemCreateSchema.openapi('VaultItemCreate');
export const OpenApiBreakGlassInitiate = BreakGlassInitiateSchema.openapi('BreakGlassInitiate');
export const OpenApiBreakGlassVeto = BreakGlassVetoSchema.openapi('BreakGlassVeto');

export function createOpenAPIDocument(): Record<string, any> {
  const app = new OpenAPIHono();

  // Health route
  app.openapi(
    createRoute({
      method: 'get',
      path: '/health',
      summary: 'Health check',
      responses: {
        200: {
          description: 'Server status and current timestamp',
          content: {
            'application/json': {
              schema: z.object({
                status: z.string(),
                timestamp: z.string(),
              }).openapi('HealthStatus'),
            },
          },
        },
      },
    }),
    (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() })
  );

  // Sync push route
  app.openapi(
    createRoute({
      method: 'post',
      path: '/sync/push',
      summary: 'Push offline local mutations',
      request: {
        body: {
          content: {
            'application/json': {
              schema: OpenApiSyncPushRequest,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Applied count and updated cursor',
          content: {
            'application/json': {
              schema: OpenApiSyncPushResponse,
            },
          },
        },
      },
    }),
    (c) => c.json({ appliedCount: 0, newHighwaterMark: 0, serverTimestamp: new Date().toISOString(), serverHlc: '0000-00-00T00:00:00.000Z:0000:server' })
  );

  // Sync pull route
  app.openapi(
    createRoute({
      method: 'post',
      path: '/sync/pull',
      summary: 'Pull remote changes from CDC sync cursor',
      request: {
        body: {
          content: {
            'application/json': {
              schema: OpenApiSyncPullRequest,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Sync changes delta',
          content: {
            'application/json': {
              schema: OpenApiSyncPullResponse,
            },
          },
        },
      },
    }),
    (c) => c.json({ changes: [], newCursor: 0, hasMore: false, serverHlc: '0000-00-00T00:00:00.000Z:0000:server' })
  );

  // Break-glass initiate route
  app.openapi(
    createRoute({
      method: 'post',
      path: '/vault/break-glass/initiate',
      summary: 'Initiate 48-hour Break-Glass emergency vault unlock',
      request: {
        body: {
          content: {
            'application/json': {
              schema: OpenApiBreakGlassInitiate,
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Break-glass request pending cooldown',
          content: {
            'application/json': {
              schema: z.object({
                requestId: z.string().uuid(),
                status: z.literal('pending_cooldown'),
                cooldownExpiresAt: z.string().datetime(),
              }).openapi('BreakGlassStatus'),
            },
          },
        },
      },
    }),
    (c) =>
      c.json({
        requestId: '00000000-0000-0000-0000-000000000000',
        status: 'pending_cooldown' as const,
        cooldownExpiresAt: new Date().toISOString(),
      })
  );

  // Vault items route
  app.openapi(
    createRoute({
      method: 'post',
      path: '/vault/items',
      summary: 'Store envelope-encrypted zero-knowledge vault item',
      request: {
        body: {
          content: {
            'application/json': {
              schema: OpenApiVaultItemCreate,
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Created vault item',
          content: {
            'application/json': {
              schema: OpenApiVaultItem,
            },
          },
        },
      },
    }),
    (c) => c.json({} as any, 201)
  );

  return app.getOpenAPIDocument({
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
  });
}
