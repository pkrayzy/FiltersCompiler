// FIXME possibly no-console can be removed
/* eslint-disable no-await-in-loop,no-restricted-syntax,no-console */
import { promises as fs } from 'fs';
import * as path from 'path';
import { RuleParser } from '@adguard/agtree';
// There is no type definition available for the following import.
// @ts-ignore
import { findDeadDomains } from '@adguard/dead-domains-linter/src/urlfilter';

import { extractRuleDomains } from './domain-extractor';
import { utils } from './utils';
import { TOP_LEVEL_DOMAIN_LIST } from './top-tld';
import { readFile, writeFile } from './file-utils';

/**
 * Recursively searches a directory for files named 'filter.txt' and returns their full paths.
 * @param dir - The directory to start the search from.
 * @returns A promise that resolves to an array of full paths of the found files.
 * @throws Will throw an error if the directory cannot be read.
 */
async function findFilterFiles(dir: string): Promise<string[]> {
    const FILTER_FILENAME = 'filter.txt';

    let results: string[] = [];

    try {
        const files = await fs.readdir(dir, { withFileTypes: true });

        for (const file of files) {
            const fullPath = path.join(dir, file.name);

            if (file.isDirectory()) {
                // If the item is a directory, recursively search it
                const subDirFiles = await findFilterFiles(fullPath);
                results = results.concat(subDirFiles);
            } else if (file.isFile() && file.name === FILTER_FILENAME) {
                // If the item is a file named 'filter.txt', add its full path to the results
                results.push(fullPath);
            }
        }
    } catch (e) {
        // eslint-disable-next-line no-console
        console.log(`Error processing directory ${dir}: ${e}`);
        throw e;
    }

    return results;
}

/**
 * Parses a rule and extracts domains from it.
 * @param rule - The rule to extract domains from.
 * @returns An array of domains extracted from the rule.
 * @throws Will log an error if the rule cannot be parsed.
 */
export const getDomains = (rule: string): string[] => {
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
};

/**
 * Extracts wildcard domains from the content of a filter.
 * @param filterContent - The content of the filter.
 * @returns A set of wildcard domains extracted from the filter content.
 */
const getWildcardDomains = (filterContent: string): Set<string> => {
    const rules = filterContent.split(/\r?\n/);
    const wildcardDomains = new Set<string>();
    for (const rule of rules) {
        const domains = getDomains(rule);
        const wildcardDomainsList = domains.filter((domain) => utils.isDomainWithTldWildcard(domain));
        wildcardDomainsList.forEach((domain) => wildcardDomains.add(domain));
    }
    return wildcardDomains;
};

/**
 * A map of wildcard domains with all possible TLDs.
 */
type WildcardDomainsWithTld = { [key: string]: string[] };

/**
 * Supplements the wildcard domains with all possible TLDs.
 * @param wildcardDomains - The set of wildcard domains to supplement.
 */
function supplementWithTld(wildcardDomains: Set<string>): WildcardDomainsWithTld {
    const wildcardDomainsWithTld: WildcardDomainsWithTld = {};
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
 * Validates the domains by finding dead domains.
 * @param wildcardDomainsWithTld The wildcard domains with all possible TLDs.
 * @returns A promise that resolves to a map of wildcard domains with their dead domains.
 */
async function validateDomains(wildcardDomainsWithTld: WildcardDomainsWithTld): Promise<WildcardDomainsWithTld> {
    const start = performance.now();
    console.log('start finding dead domains', start);
    const validatedWildcardDomains: { [key: string]: string[] } = {};
    let counter = 0;
    for (const [key, value] of Object.entries(wildcardDomainsWithTld)) {
        // FIXME remove this line
        if (counter > 5) {
            continue;
        }
        validatedWildcardDomains[key] = await findDeadDomains(value);
        counter += 1;
    }
    console.log('end finding dead domains', performance.now() - start);
    console.log(validatedWildcardDomains);
    return validatedWildcardDomains;
}

/**
 * Processes wildcard domains by finding, validating, and writing them to a JSON file.
 * @param filtersDir - The directory to search for filter files.
 * @param wildcardDomainsJson - The path to the JSON file where the validated wildcard domains will be written.
 * @throws Will throw an error if there are issues reading or writing files, or if dead domains cannot be found.
 */
export const wildcardDomainProcessor = async (filtersDir: string, wildcardDomainsJson: string): Promise<void> => {
    const filterFiles = await findFilterFiles(path.resolve(__dirname, filtersDir));

    const wildcardDomains = new Set<string>();
    for (const filterFile of filterFiles) {
        const filterContent = await readFile(filterFile);
        const filterWildcardDomains = getWildcardDomains(filterContent);
        filterWildcardDomains.forEach((domain) => wildcardDomains.add(domain));
    }

    const wildcardDomainsWithTld = supplementWithTld(wildcardDomains);
    const validatedWildcardDomains = await validateDomains(wildcardDomainsWithTld);

    const json = JSON.stringify(validatedWildcardDomains);
    await writeFile(wildcardDomainsJson, json);
};
