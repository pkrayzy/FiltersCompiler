import path from 'path';

import {
    AnyRule, CosmeticRule, NetworkRule, RuleParser,
} from '@adguard/agtree';
import { findFilterFiles, readFile, writeFile } from './file-utils';
import { WildcardDomainsWithTld } from './wildcard-domain-processor';
import { extractRuleDomains } from './domain-extractor';
import { utils } from './utils';

const patchNetworkRule = (ast: NetworkRule, wildcardDomains: WildcardDomainsWithTld): any => {
    if (!ast.modifiers) {
        return ast;
    }

    const updatedModifiersChildren = [];
    for (let i = 0; i < ast.modifiers.children.length; i += 1) {
        const modifier = ast.modifiers.children[i];

        if (modifier.modifier.value === 'domain') {
            const domain = modifier.value.value;
            if (utils.isDomainWithTldWildcard(domain)) {

            }
        }
    }
};

const patchCosmeticRule = (ast: CosmeticRule, wildcardDomains: WildcardDomainsWithTld): any => {
    const domains = ast.domains;
    for (let domain in domains.children) {
        if (utils.isDomainWithTldWildcard(domain.value)) {

        }
    }
};

const patchDomainsInAst = (ast: AnyRule, wildcardDomains: WildcardDomainsWithTld): any => {
    switch (ast.category) {
        case 'Network':
            return patchNetworkRule(ast, wildcardDomains);
        case 'Cosmetic':
            return patchCosmeticRule(ast, wildcardDomains);
        default:
            throw new Error(`Unsupported rule category: ${ast.category}`);
    }
};

export function patchRule(rule: string, wildcardDomains: WildcardDomainsWithTld): string {
    const ast = RuleParser.parse(rule);
    console.log({ ast });

    const patchedAst = patchDomainsInAst(ast, wildcardDomains);
    const domains = extractRuleDomains(ast);
    for (const domain of domains) {
        if (wildcardDomains[domain]) {
        }
    }
    return '';
}

function patchWildcards(filterContent: string, wildcardDomains: WildcardDomainsWithTld): string {
    const rules = filterContent.split(/\r?\n/);
    const patchedRule = patchRule(rules[0], wildcardDomains);
    return '';
}

const WILDCARD_DOMAINS_FILE = 'wildcard_domains.json';

export async function patchPlatforms(platformsDir: string): Promise<void> {
    const filters = await findFilterFiles(path.resolve(__dirname, platformsDir), /filters\/\d+(_optimized)?\.txt/);

    const wildcardDomainsFilename = path.resolve(__dirname, WILDCARD_DOMAINS_FILE);
    const wildcardDomainsJson = await readFile(wildcardDomainsFilename);
    const wildcardDomains = JSON.parse(wildcardDomainsJson);

    const filter = await readFile(filters[0]);
    const updatedFilter = patchWildcards(filter, wildcardDomains);
    await writeFile(filters[0], updatedFilter);
}
