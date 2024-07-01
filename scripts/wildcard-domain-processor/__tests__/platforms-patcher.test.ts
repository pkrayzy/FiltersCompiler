import { expandWildcardsInRule } from '../wildcard-expander';

describe('platforms-patcher', () => {
    describe('expandWildcardsInRule', () => {
        describe('patch cosmetic rules', () => {
            it('should expand wildcard', () => {
                const rule = 'example.*##h1';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual('example.com,example.org##h1');
            });

            it('should expand wildcard and not lose non wildcard', () => {
                const rule = 'example.*,test.com##h1';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual('example.com,example.org,test.com##h1');
            });

            it('should expand restrictive wildcard', () => {
                const rule = '~example.*##h1';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual('~example.com,~example.org##h1');
            });

            it('should return null if wildcardDomains were empty', () => {
                const rule = 'example.*##h1';
                const wildcardDomains = { 'example.*': [] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual(null);
            });

            it('if has restricted and permitted domains, they destroy each other', () => {
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const ruleWithPermittedWildcard = 'example.*,~example.org##h1';
                const patchedRuleWithPermittedWildcard = expandWildcardsInRule(
                    ruleWithPermittedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithPermittedWildcard).toEqual('example.com##h1');

                const ruleWithRestrictedWildcard = '~example.*,example.org##h1';
                const patchedRuleWithRestrictedWildcard = expandWildcardsInRule(
                    ruleWithRestrictedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithRestrictedWildcard).toEqual('~example.com##h1');
            });

            // eslint-disable-next-line max-len
            it('returns null if after expanding wildcard and destroying permitted and restricted no domains left', () => {
                const ruleWithPermittedWildcard = 'example.*,~example.com##h1';
                const ruleWithRestrictedWildcard = '~example.*,example.com##h1';
                const wildcardDomains = { 'example.*': ['example.com'] };
                const patchedRuleWithPermittedWildcard = expandWildcardsInRule(
                    ruleWithPermittedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithPermittedWildcard).toEqual(null);

                const patchedRuleWithRestrictedWildcard = expandWildcardsInRule(
                    ruleWithRestrictedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithRestrictedWildcard).toEqual(null);
            });

            it('should expand wildcard without duplicates', () => {
                const rule = 'example.*,example.org##h1';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual('example.com,example.org##h1');
            });
        });

        describe('patch network rules', () => {
            it('should expand wildcard', () => {
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };

                const rule = 'test$domain=example.*';
                const expandedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(expandedRule).toEqual('test$domain=example.com|example.org');

                const denyallowRule = 'test$denyallow=example.*';
                const expandedDenyallowRule = expandWildcardsInRule(denyallowRule, wildcardDomains);
                expect(expandedDenyallowRule).toEqual('test$denyallow=example.com|example.org');

                const toRule = 'test$to=example.*';
                const expandedToRule = expandWildcardsInRule(toRule, wildcardDomains);
                expect(expandedToRule).toEqual('test$to=example.com|example.org');

                const fromRule = 'test$from=example.*';
                const expandedFromRule = expandWildcardsInRule(fromRule, wildcardDomains);
                expect(expandedFromRule).toEqual('test$from=example.com|example.org');
            });

            it('should expand wildcard and not lose non wildcard', () => {
                const rule = 'test$domain=example.*|test.com';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const expandedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(expandedRule).toEqual('test$domain=example.com|example.org|test.com');
            });

            it('should expand restrictive wildcard', () => {
                const rule = 'test$domain=~example.*';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual('test$domain=~example.com|~example.org');
            });

            it('should return null if wildcardDomains were empty', () => {
                const rule = 'test$domain=example.*';
                const wildcardDomains = { 'example.*': [] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual(null);
            });

            it('if has restricted and permitted domains, they destroy each other', () => {
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const ruleWithPermittedWildcard = 'test$domain=example.*|~example.org';
                const patchedRuleWithPermittedWildcard = expandWildcardsInRule(
                    ruleWithPermittedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithPermittedWildcard).toEqual('test$domain=example.com');

                const ruleWithRestrictedWildcard = 'test$domain=~example.*|example.org';
                const patchedRuleWithRestrictedWildcard = expandWildcardsInRule(
                    ruleWithRestrictedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithRestrictedWildcard).toEqual('test$domain=~example.com');
            });

            // eslint-disable-next-line max-len
            it('returns null if after expanding wildcard and destroying permitted and restricted no domains left', () => {
                const wildcardDomains = { 'example.*': ['example.com'] };
                const ruleWithPermittedWildcard = 'test$domain=example.*|~example.com';
                const patchedRuleWithPermittedWildcard = expandWildcardsInRule(
                    ruleWithPermittedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithPermittedWildcard).toEqual(null);

                const ruleWithRestrictedWildcard = 'test$domain=~example.*|example.com';
                const patchedRuleWithRestrictedWildcard = expandWildcardsInRule(
                    ruleWithRestrictedWildcard,
                    wildcardDomains,
                );
                expect(patchedRuleWithRestrictedWildcard).toEqual(null);
            });

            it('should expand wildcard without duplicates', () => {
                const rule = 'test$domain=example.*|example.org';
                const wildcardDomains = { 'example.*': ['example.com', 'example.org'] };
                const patchedRule = expandWildcardsInRule(rule, wildcardDomains);
                expect(patchedRule).toEqual('test$domain=example.com|example.org');
            });
        });
    });
});
