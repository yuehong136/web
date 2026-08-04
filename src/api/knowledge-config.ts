import { API_BASE_URL } from '@/constants'

/**
 * Knowledge RESTful APIs live under the SDK-style `/api` base path.
 *
 * Keep this transport detail in one module so dataset, document, metadata,
 * and generation clients do not depend on one another for configuration.
 */
export const knowledgeRestConfig = { baseURL: `${API_BASE_URL}/api` }
