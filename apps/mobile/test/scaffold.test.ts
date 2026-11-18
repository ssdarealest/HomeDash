import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Flutter Mobile Package Scaffolding', () => {
  it('should have a valid pubspec.yaml with Material 3 and Drift dependencies', () => {
    const pubspecPath = path.resolve(__dirname, '../pubspec.yaml');
    expect(fs.existsSync(pubspecPath)).toBe(true);
    const content = fs.readFileSync(pubspecPath, 'utf8');
    expect(content).toContain('name: homedash_mobile');
    expect(content).toContain('sdk: flutter');
    expect(content).toContain('drift:');
  });

  it('should have analysis_options.yaml with strict linter rules', () => {
    const analysisPath = path.resolve(__dirname, '../analysis_options.yaml');
    expect(fs.existsSync(analysisPath)).toBe(true);
    const content = fs.readFileSync(analysisPath, 'utf8');
    expect(content).toContain('include: package:flutter_lints/flutter.yaml');
  });

  it('should have a valid main.dart entrypoint', () => {
    const mainPath = path.resolve(__dirname, '../lib/main.dart');
    expect(fs.existsSync(mainPath)).toBe(true);
    const content = fs.readFileSync(mainPath, 'utf8');
    expect(content).toContain('void main()');
    expect(content).toContain('HomeDashApp');
  });
});
