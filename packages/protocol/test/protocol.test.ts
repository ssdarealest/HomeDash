import { describe, it, expect } from 'vitest';
import {
  BreakGlassInitiateSchema,
  SyncPushRequestSchema,
  VaultItemCreateSchema,
} from '../src/index';
import { createOpenAPIDocument } from '../src/openapi';

describe('Shared Protocol & Schema Validation', () => {
  it('should validate Break-Glass initiation schema', () => {
    const valid = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    };
    expect(BreakGlassInitiateSchema.safeParse(valid).success).toBe(true);

    const invalid = { householdId: 'not-a-uuid' };
    expect(BreakGlassInitiateSchema.safeParse(invalid).success).toBe(false);
  });

  it('should validate Sync Push request payload', () => {
    const validSyncPush = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      mutations: [
        {
          entityTable: 'grocery_items',
          entityId: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          operation: 'INSERT',
          recordPayload: { name: 'Fresh Milk', quantity: '2 gallons' },
          hlcTimestamp: '2026-11-17T12:00:00.000Z_00000001_mobile1',
        },
      ],
    };
    const parsed = SyncPushRequestSchema.safeParse(validSyncPush);
    expect(parsed.success).toBe(true);
  });

  it('should validate Vault Item creation schema with envelope fields', () => {
    const validVaultItem = {
      householdId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      title: 'Grandma Passport',
      category: 'national_id',
      encryptedPayload: 'YmFzZTY0cGF5bG9hZA==',
      payloadNonce: 'YmFzZTY0bm9uY2UxMjM0NTY3OA==',
      encryptedDek: 'YmFzZTY0ZGVrMTIzNDU2Nzg5MA==',
      dekNonce: 'YmFzZTY0ZGVrbm9uY2UxMjM0NTY=',
    };
    expect(VaultItemCreateSchema.safeParse(validVaultItem).success).toBe(true);
  });

  it('should generate valid OpenAPI specification metadata with populated schemas', () => {
    const spec = createOpenAPIDocument() as any;
    expect(spec.openapi).toMatch(/^3\./);
    expect(spec.info.title).toBe('Family OS API');
    expect(spec.paths).toBeDefined();
    expect(spec.paths['/health']).toBeDefined();
    expect(spec.paths['/sync/push']).toBeDefined();
    expect(spec.paths['/vault/break-glass/initiate']).toBeDefined();

    // Verify schemas are populated for Dart / Mobile codegen
    expect(spec.components).toBeDefined();
    expect(spec.components.schemas).toBeDefined();
    expect(spec.components.schemas.SyncPushRequest).toBeDefined();
    expect(spec.components.schemas.SyncPushResponse).toBeDefined();
    expect(spec.components.schemas.BreakGlassInitiate).toBeDefined();
    expect(spec.components.schemas.VaultItemCreate).toBeDefined();
    expect(spec.components.schemas.VaultItem).toBeDefined();
  });
});
