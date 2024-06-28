import agtree, { AnyRule, Modifier, NetworkRule } from '@adguard/agtree';
import { utils } from './utils';

/**
 * A list of network rule modifiers that are to be scanned for dead domains.
 */
const DOMAIN_MODIFIERS = ['domain', 'denyallow', 'from', 'to'];

/**
 * Regular expression that matches the domain in a network rule pattern.
 */
const PATTERN_DOMAIN_REGEX = ((): RegExp => {
    const startStrings = [
        '||', '//', '://', 'http://', 'https://', '|http://', '|https://',
        'ws://', 'wss://', '|ws://', '|wss://',
    ];

    const startRegex = startStrings.map((str) => {
        return str.replace(/\//g, '\\/').replace(/\|/g, '\\|');
    }).join('|');

    return new RegExp(`^(@@)?(${startRegex})([a-z0-9-.]+)(\\^|\\/)`, 'i');
})();

/**
 * Attempts to extract the domain from the network rule pattern. If the pattern
 * does not contain a domain, returns null.
 *
 * @param ast The rule AST.
 * @returns The domain extracted from the AST.
 */
function extractDomainFromPattern(ast: NetworkRule): string | null {
    if (!ast.pattern) {
        return null;
    }

    // Ignore regular expressions as we cannot be sure if it's for a hostname
    // or not.
    //
    // TODO: Handle the most common cases like (negative lookahead + a list of domains).
    if (ast.pattern.value.startsWith('/') && ast.pattern.value.endsWith('/')) {
        return null;
    }

    const match = ast.pattern.value.match(PATTERN_DOMAIN_REGEX);
    if (match && utils.validDomain(match[3])) {
        const domain = match[3];

        return domain;
    }

    return null;
}

/**
 * Extracts an array of domains from the network rule modifier.
 *
 * @param modifier The modifier that contains the domains.
 * @returns The list of domains extracted from the modifier.
 */
function extractModifierDomains(modifier: Modifier): {
    domain: string;
    negated: boolean;
}[] {
    if (!modifier?.value?.value) {
        return [];
    }

    const domainList = agtree.DomainListParser.parse(modifier.value.value, agtree.PIPE_MODIFIER_SEPARATOR);
    return domainList.children.map((domain) => {
        return {
            domain: domain.value,
            negated: domain.exception,
        };
    });
}

/**
 * Extracts domains from a cosmetic rule AST.
 *
 * @param ast The AST of a cosmetic rule to extract domains from.
 * @returns The list of all domains that are used by this rule.
 */
function extractCosmeticRuleDomains(ast: agtree.CosmeticRule): string[] {
    if (!ast.domains || ast.domains.children.length === 0) {
        return [];
    }

    const domains = ast.domains.children
        .map((domain) => domain.value)
        .filter(utils.validDomain);

    return utils.unique(domains);
}

/**
 * Extracts domains from a network rule AST.
 *
 * @param ast The AST of a network rule to extract domains from.
 * @returns The list of all domains that are used by this rule.
 */
function extractNetworkRuleDomains(ast: agtree.NetworkRule): string[] {
    const domains = [];

    const patternDomain = extractDomainFromPattern(ast);
    if (patternDomain) {
        domains.push(patternDomain);
    }

    if (!ast.modifiers) {
        // No modifiers in the rule, return right away.
        return domains;
    }

    for (let i = 0; i < ast.modifiers.children.length; i += 1) {
        const modifier = ast.modifiers.children[i];

        if (DOMAIN_MODIFIERS.includes(modifier.modifier.value)) {
            const modifierDomains = extractModifierDomains(modifier)
                .map((domain) => domain.domain);

            domains.push(...modifierDomains);
        }
    }

    return utils.unique(domains)
        .filter(utils.validDomain);
}

/**
 * This function goes through the rule AST and extracts domains from it.
 *
 * @param ast The AST of the rule to extract domains from.
 * @returns The list of all domains that are used by this rule.
 */
export function extractRuleDomains(ast: AnyRule): string[] {
    switch (ast.category) {
        case 'Network':
            return extractNetworkRuleDomains(ast);
        case 'Cosmetic':
            return extractCosmeticRuleDomains(ast);
        default:
            return [];
    }
}
