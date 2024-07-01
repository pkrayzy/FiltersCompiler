import { getDomains } from '../wildcard-domain-processor';

describe('getDomains', () => {
    it('extracts wildcard domains from the cosmetic rules', () => {
        const rule = 'example.*##h1';
        const domains = getDomains(rule);
        expect(domains).toEqual(['example.*']);
    });
    it('extracts wildcard domains from the cosmetic rules with exception', () => {
        const rule = '~example.*##h1';
        const domains = getDomains(rule);
        expect(domains).toEqual(['example.*']);
    });
    it('extracts wildcard domains from the network rules domain modifier', () => {
        const rule = '||*/banners/*$image,domain=example.*|test.com';
        const domains = getDomains(rule);
        expect(domains).toEqual(['example.*', 'test.com']);
    });
});
