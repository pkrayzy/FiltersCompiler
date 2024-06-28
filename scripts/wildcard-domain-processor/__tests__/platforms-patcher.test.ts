import { patchRule } from '../platforms-patcher';

describe('platforms-patcher', () => {
    describe('patchRule', () => {
        it('should patch the rule', () => {
            const rule = 'example.*##h1';
            const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
            const patchedRule = patchRule(rule, wildcardDomains);
            expect(patchedRule).toEqual('example.com,example.org##h1');
        });
    });
});
