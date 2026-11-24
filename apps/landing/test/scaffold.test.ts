import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import App from '../src/App';
import viteConfig from '../vite.config';

describe('apps/landing scaffold', () => {
  it('has valid package.json with correct name and downward protocol dependency', () => {
    const pkgPath = path.resolve(__dirname, '../package.json');
    expect(fs.existsSync(pkgPath)).toBe(true);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    expect(pkg.name).toBe('@homedash/landing');
    expect(pkg.dependencies).toHaveProperty('@homedash/protocol');
    expect(pkg.dependencies).toHaveProperty('react');
    expect(pkg.dependencies).toHaveProperty('lucide-react');
  });

  it('configures vite dev server on port 5174', () => {
    expect(viteConfig).toBeDefined();
    const config = typeof viteConfig === 'function' ? (viteConfig as any)({}) : viteConfig;
    expect(config.server?.port).toBe(5174);
  });

  it('exports App component successfully', () => {
    expect(App).toBeDefined();
    expect(typeof App).toBe('function');
  });
});
