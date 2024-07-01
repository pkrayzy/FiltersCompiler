/* eslint-disable no-console */
import { Command } from 'commander';

import { updateWildcardDomains } from './wildcard-domains-updater';
import { expandWildcardDomains } from './wildcard-expander';

const FILTERS_DIR = '../../filters';
const WILDCARD_DOMAINS_JSON_FILENAME = 'wildcard_domains.json';
const PLATFORMS_DIR = '../../platforms';

const program = new Command();

program
    .command('update-wildcard-domains')
    .description('Run wildcard domain processor')
    .action(async () => {
        try {
            // TODO this should be automated in the future
            await updateWildcardDomains(FILTERS_DIR, WILDCARD_DOMAINS_JSON_FILENAME);
        } catch (e) {
            console.error(e);
        }
    });

program
    .command('expand-wildcard-domains')
    .description('Run patch platforms to expand wildcards')
    .action(async () => {
        try {
            await expandWildcardDomains(PLATFORMS_DIR);
        } catch (e) {
            console.error(e);
        }
    });

// Only run the command-line interface if the script is executed directly
if (require.main === module) {
    program.parse(process.argv);
}

export {
    updateWildcardDomains,
    expandWildcardDomains,
};
