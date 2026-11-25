import { describe, expect, it } from 'vitest';
import { systemAusUserAgent } from './geraet';

describe('Geräteerkennung', () => {
  it('erkennt ein iPad, das sich als Mac meldet', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15';
    const r = systemAusUserAgent(ua, 5);
    expect(r.geraet).toBe('iPad');
    expect(r.browser).toBe('Safari 16.6');
    expect(r.system).toContain('iPadOS 16');
  });

  it('erkennt einen Mac ohne Touch als Mac', () => {
    const ua = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15';
    expect(systemAusUserAgent(ua, 0).geraet).toBe('Mac');
  });

  it('liest iOS-Versionen aus älteren iPad-Kennungen', () => {
    const ua = 'Mozilla/5.0 (iPad; CPU OS 12_5_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1';
    const r = systemAusUserAgent(ua, 5);
    expect(r.geraet).toBe('iPad');
    expect(r.system).toBe('iOS/iPadOS 12.5.7');
  });

  it('erkennt Chrome auf Android', () => {
    const ua = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36';
    const r = systemAusUserAgent(ua, 5);
    expect(r.geraet).toBe('Android-Gerät');
    expect(r.browser).toBe('Chrome 131.0.0.0');
  });
});
