import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Android Notification Listener Platform Channel', () => {
  it('should define MethodChannel and parser in notification_listener_channel.dart', () => {
    const channelPath = path.resolve(__dirname, '../lib/data/platform/notification_listener_channel.dart');
    expect(fs.existsSync(channelPath)).toBe(true);
    const content = fs.readFileSync(channelPath, 'utf8');
    expect(content).toContain('com.homedash.app/notification_listener');
    expect(content).toContain('class NotificationListenerChannel');
    expect(content).toContain('parseTransactionPayload');
  });

  it('should have native Android Kotlin implementation file', () => {
    const ktPath = path.resolve(__dirname, '../android/app/src/main/kotlin/com/homedash/app/NotificationListenerServiceImpl.kt');
    expect(fs.existsSync(ktPath)).toBe(true);
    const content = fs.readFileSync(ktPath, 'utf8');
    expect(content).toContain('class NotificationListenerServiceImpl');
    expect(content).toContain('NotificationListenerService');
  });
});
