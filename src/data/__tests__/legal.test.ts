import { describe, expect, it } from 'vitest';
import { TERMS_VERSION } from '../../lib/account';
import vercel from '../../../vercel.json';

const pages = import.meta.glob<string>('../../../public/{privacy,terms}.html', { query: '?raw', import: 'default', eager: true });
const env = import.meta.glob<string>('../../../.env.production', { query: '?raw', import: 'default', eager: true });

describe('Privacy Policy and Terms pages', () => {
  it('both exist', () => {
    expect(Object.keys(pages)).toHaveLength(2);
  });
  for (const [name, html] of Object.entries(pages)) {
    it(`${name} has no placeholders left`, () => {
      expect(html).not.toMatch(/__[A-Z]+__/);
    });
    it(`${name} shows the version people agree to in the app`, () => {
      expect(html).toContain(`Terms version ${TERMS_VERSION}`);
    });
  }
});

describe('security headers', () => {
  it("let the app reach its own Supabase project, and nothing else", () => {
    const url = Object.values(env)[0]?.match(/^VITE_SUPABASE_URL=(\S+)/m)?.[1];
    const csp = vercel.headers.flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy')?.value ?? '';
    expect(url).toMatch(/^https:\/\/\w+\.supabase\.co$/);
    expect(csp).toContain(`connect-src 'self' ${url};`);
    expect(csp).toContain("frame-ancestors 'none'");
  });
});
