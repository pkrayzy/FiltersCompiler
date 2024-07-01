import { wildcardDomainProcessor } from './wildcard-domain-processor';
import { patchPlatforms } from './wildcard-expander';

// FIXME check if this variable already used somewhere
const FILTERS_DIR = '../../filters';
const WILDCARD_DOMAINS_JSON = 'wildcard_domains.json';
const PLATFORMS_DIR = '../../platforms';

(async (): Promise<void> => {
    try {
        // await wildcardDomainProcessor(FILTERS_DIR, WILDCARD_DOMAINS_JSON);
        await patchPlatforms(PLATFORMS_DIR);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
    }
})();
