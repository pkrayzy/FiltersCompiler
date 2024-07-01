/* eslint-disable no-restricted-syntax */
import path from 'path';

import agtree, {
    AnyRule,
    CosmeticRule, DomainListParser,
    NetworkRule,
    RuleParser,
} from '@adguard/agtree';
import { findFilterFiles, readFile, writeFile } from './file-utils';
import { WildcardDomainsWithTld } from './wildcard-domain-processor';
import { DOMAIN_MODIFIERS } from './domain-extractor';
import { utils } from './utils';

const expandWildcardInNetworkRuleAst = (
    ast: NetworkRule,
    wildcardDomains: WildcardDomainsWithTld,
): NetworkRule | null => {
    if (!ast.modifiers) {
        return ast;
    }

    const modifiers = ast.modifiers.children;

    const newPermittedDomains = new Map();
    const newRestrictedDomains = new Map();

    let hadWildcard = false;
    const newModifiers = [];

    for (const modifier of modifiers) {
        if (!DOMAIN_MODIFIERS.includes(modifier.modifier.value) || !modifier.value) {
            newModifiers.push(modifier);
            continue;
        }

        const domainList = DomainListParser.parse(modifier.value.value, agtree.PIPE_MODIFIER_SEPARATOR);

        for (const domain of domainList.children) {
            if (utils.isDomainWithTldWildcard(domain.value)) {
                hadWildcard = true;
                const nonWildcardDomains = wildcardDomains[domain.value];
                for (const nonWildcardDomain of nonWildcardDomains) {
                    const newDomainValue = {
                        ...domain,
                        value: nonWildcardDomain,
                    };
                    if (domain.exception) {
                        newRestrictedDomains.set(nonWildcardDomain, newDomainValue);
                    } else {
                        newPermittedDomains.set(nonWildcardDomain, newDomainValue);
                    }
                }
                continue;
            }

            if (domain.exception) {
                newRestrictedDomains.set(domain.value, domain);
            } else {
                newPermittedDomains.set(domain.value, domain);
            }
        }

        if (!hadWildcard) {
            return ast;
        }

        const newDomains = [];

        for (const [permittedKey, permittedValue] of newPermittedDomains) {
            if (newRestrictedDomains.has(permittedKey)) {
                newRestrictedDomains.delete(permittedKey);
            } else {
                newDomains.push(permittedValue);
            }
        }

        // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
        for (const [_, restrictedValue] of newRestrictedDomains) {
            newDomains.push(restrictedValue);
        }

        if (newDomains.length === 0) {
            return null;
        }

        const newDomainsModifier = {
            ...modifier,
        };

        domainList.children = newDomains;
        newDomainsModifier.value!.value = DomainListParser.generate(domainList);

        newModifiers.push(newDomainsModifier);
    }

    const newAst = structuredClone(ast);
    newAst.modifiers!.children = newModifiers;

    return newAst;
};

const expandWildcardCosmeticRuleAst = (ast: CosmeticRule, wildcardDomains: WildcardDomainsWithTld): any => {
    const domains = ast.domains.children;

    const newPermittedDomains = new Map();
    const newRestrictedDomains = new Map();

    let hadWildcard = false;
    for (const domain of domains) {
        if (utils.isDomainWithTldWildcard(domain.value)) {
            hadWildcard = true;
            const nonWildcardDomains = wildcardDomains[domain.value];
            nonWildcardDomains.forEach((d) => {
                const newDomain = {
                    ...domain,
                    value: d,
                };
                if (domain.exception) {
                    newRestrictedDomains.set(d, newDomain);
                } else {
                    newPermittedDomains.set(d, newDomain);
                }
            });
        } else {
            // eslint-disable-next-line
            if (domain.exception) {
                newRestrictedDomains.set(domain.value, domain);
            } else {
                newPermittedDomains.set(domain.value, domain);
            }
        }
    }

    if (!hadWildcard) {
        return ast;
    }

    const newDomains = [];

    for (const [permittedKey, permittedValue] of newPermittedDomains) {
        if (newRestrictedDomains.has(permittedKey)) {
            newRestrictedDomains.delete(permittedKey);
        } else {
            newDomains.push(permittedValue);
        }
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention,@typescript-eslint/no-unused-vars
    for (const [_, restrictedValue] of newRestrictedDomains) {
        newDomains.push(restrictedValue);
    }

    if (newDomains.length === 0) {
        return null;
    }

    const newAst = structuredClone(ast);
    newAst.domains.children = newDomains;

    return newAst;
};

const expandWildcardDomainsInAst = (ast: AnyRule, wildcardDomains: WildcardDomainsWithTld): AnyRule | null => {
    switch (ast.category) {
        case 'Network':
            return expandWildcardInNetworkRuleAst(ast, wildcardDomains);
        case 'Cosmetic':
            return expandWildcardCosmeticRuleAst(ast, wildcardDomains);
        case 'Comment':
            return ast;
        default:
            throw new Error(`Unsupported rule category: ${ast.category}`);
    }
};

export function expandWildcardsInRule(rule: string, wildcardDomains: WildcardDomainsWithTld): string | null {
    const ast = RuleParser.parse(rule);

    const astWithExpandedWildcardDomain = expandWildcardDomainsInAst(ast, wildcardDomains);
    if (astWithExpandedWildcardDomain === null) {
        return null;
    }

    if (ast === astWithExpandedWildcardDomain) {
        return rule;
    }

    return RuleParser.generate(astWithExpandedWildcardDomain);
}

function patchWildcards(filterContent: string, wildcardDomains: WildcardDomainsWithTld): string {
    const rules = filterContent.split(/\r?\n/);
    const newRules = [];
    for (const rule of rules) {
        const newRule = expandWildcardsInRule(rule, wildcardDomains);
        if (newRule !== null) {
            newRules.push(newRule);
        }
    }
    return newRules.join('\n');
}

const WILDCARD_DOMAINS_FILE = 'wildcard_domains.json';

export async function patchPlatforms(platformsDir: string): Promise<void> {
    const filters = await findFilterFiles(path.resolve(__dirname, platformsDir), /filters\/\d+(_optimized)?\.txt/);

    const wildcardDomainsFilename = path.resolve(__dirname, WILDCARD_DOMAINS_FILE);
    const wildcardDomainsJson = await readFile(wildcardDomainsFilename);
    const wildcardDomains = JSON.parse(wildcardDomainsJson);

    const filter = await readFile(filters[0]);
    const updatedFilter = patchWildcards(filter, wildcardDomains);
    await writeFile(`${filters[0]}_copy`, updatedFilter);
}
