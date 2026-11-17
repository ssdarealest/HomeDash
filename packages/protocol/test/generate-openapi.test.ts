import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createOpenAPIDocument } from '../src/openapi';

describe('OpenAPI Generator', () => {
  it('should export openapi.json to dist directory for mobile codegen', () => {
    const spec = createOpenAPIDocument();
    const distDir = join(__dirname, '../dist');
    mkdirSync(distDir, { recursive: true });
    writeFileSync(join(distDir, 'openapi.json'), JSON.stringify(spec, null, 2));

    expect(spec.paths).toBeDefined();
    expect(spec.components.schemas).toBeDefined();
  });
});
