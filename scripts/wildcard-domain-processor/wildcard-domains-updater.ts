/* eslint-disable no-await-in-loop,no-restricted-syntax,no-console */
import * as path from 'path';
import { RuleParser } from '@adguard/agtree';
// There is no type definition available for the following import.
// @ts-ignore
import { findDeadDomains } from '@adguard/dead-domains-linter/src/urlfilter';
import { extractRuleDomains } from './domain-extractor';
import { utils } from './utils';
import { TOP_LEVEL_DOMAIN_LIST } from './top-tld';
import { findFilterFiles, readFile, writeFile } from './file-utils';

/**
 * Parses a rule and extracts domains from it.
 * @param rule - The rule to extract domains from.
 * @returns An array of domains extracted from the rule.
 * @throws Will log an error if the rule cannot be parsed.
 */
export function getDomains(rule: string): string[] {
    let ruleAst;
    try {
        ruleAst = RuleParser.parse(rule);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Unable to parse rule: "${rule}", because of the error: ${e}`);
        return [];
    }
    const domains = extractRuleDomains(ruleAst);
    return domains;
}

/**
 * Extracts wildcard domains from the content of a filter.
 * @param filterContent - The content of the filter.
 * @returns A set of wildcard domains extracted from the filter content.
 */
function getWildcardDomains(filterContent: string): Set<string> {
    const rules = filterContent.split(/\r?\n/);
    const wildcardDomains = new Set<string>();
    for (const rule of rules) {
        const domains = getDomains(rule);
        const wildcardDomainsList = domains.filter((domain) => utils.isWildcardDomain(domain));
        wildcardDomainsList.forEach((domain) => wildcardDomains.add(domain));
    }
    return wildcardDomains;
}

/**
 * A map of wildcard domains with all possible TLDs.
 */
export type WildcardDomains = Record<string, string[]>;

/**
 * Supplements the wildcard domains with all possible TLDs from the list.
 * @param wildcardDomains - The set of wildcard domains to supplement.
 * @returns A map of wildcard domains with all possible TLDs.
 */
function supplementWithTld(wildcardDomains: Set<string>): WildcardDomains {
    const wildcardDomainsWithTld: WildcardDomains = {};
    for (const wildcardDomain of wildcardDomains) {
        const baseWithoutWildcard = wildcardDomain.slice(0, -2);
        wildcardDomainsWithTld[wildcardDomain] = [];
        for (const tld of TOP_LEVEL_DOMAIN_LIST) {
            wildcardDomainsWithTld[wildcardDomain].push(`${baseWithoutWildcard}.${tld}`);
        }
    }
    return wildcardDomainsWithTld;
}

/**
 * Filters out dead domains from a list of domains.
 * @param value - The list of domains to filter.
 * @returns A list of alive domains.
 */
async function getAliveDomains(value: string[]): Promise<string[]> {
    const deadDomains = new Set(await findDeadDomains(value));
    const aliveDomains = value.filter((domain) => !deadDomains.has(domain));
    return aliveDomains;
}

/**
 * Updates a JSON file with a key-value pair.
 * @param filename - The name of the JSON file.
 * @param key - The key to update in the JSON file.
 * @param value - The value to set for the key in the JSON file.
 * @returns A promise that resolves when the file is updated.
 */
async function updateJsonFile(filename: string, key: string, value: string[]): Promise<void> {
    const filePath = path.resolve(__dirname, filename);
    const json = await readFile(filePath);
    const parsedJson = JSON.parse(json);
    parsedJson[key] = value;
    const data = JSON.stringify(parsedJson, null, 4);
    await writeFile(filePath, data);
}

/**
 * Processes wildcard domains by finding, validating, and writing them to a JSON file.
 * @param filtersDir - The directory to search for filter files.
 * @param wildcardDomainsJsonFilename - The path to the JSON file where the validated wildcard domains will be written.
 * @throws Will throw an error if there are issues reading or writing files, or if dead domains cannot be found.
 */
export const updateWildcardDomains = async (
    filtersDir: string,
    wildcardDomainsJsonFilename: string,
): Promise<void> => {
    const filterFiles = await findFilterFiles(path.resolve(__dirname, filtersDir), 'filter.txt');

    const wildcardDomains = new Set<string>();
    for (const filterFile of filterFiles) {
        const filterContent = await readFile(filterFile);
        const filterWildcardDomains = getWildcardDomains(filterContent);
        filterWildcardDomains.forEach((domain) => wildcardDomains.add(domain));
    }

    const wildcardDomainsWithTld = supplementWithTld(wildcardDomains);
    console.log('Totally found wildcard domains length:', Object.keys(wildcardDomainsWithTld).length);

    const start = performance.now();
    console.log('start finding dead domains', start);
    const validatedWildcardDomains: { [key: string]: string[] } = {};
    for (const [key, value] of Object.entries(wildcardDomainsWithTld)) {
        const aliveDomains = await getAliveDomains(value);
        // validation of one wildcard domain might take a while
        // that's why we update the json file after each wildcard domain validation
        await updateJsonFile(wildcardDomainsJsonFilename, key, aliveDomains);
        validatedWildcardDomains[key] = aliveDomains;
    }

    // TODO add removal of the domains that should be removed from the list of wildcard domains
    console.log('end finding dead domains', performance.now() - start);
};
