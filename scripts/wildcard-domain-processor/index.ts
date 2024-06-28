import { wildcardDomainProcessor } from './wildcard-domain-processor';

const FILTERS_DIR = '../../filters';
const WILDCARD_DOMAINS_JSON = 'wildcard_domains.json';

(async (): Promise<void> => {
    try {
        await wildcardDomainProcessor(FILTERS_DIR, WILDCARD_DOMAINS_JSON);
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e);
    }
})();
