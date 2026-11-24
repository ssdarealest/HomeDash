export * from './types';
export * from './quickstart';
export * from './environment-variables';
export * from './cryptography';
export * from './api-reference';

import { quickstartDoc } from './quickstart';
import { environmentVariablesDoc } from './environment-variables';
import { cryptographyDoc } from './cryptography';
import { apiReferenceDoc } from './api-reference';
import type { DocArticle } from './types';

export const allDocumentationArticles: DocArticle[] = [
  quickstartDoc,
  environmentVariablesDoc,
  cryptographyDoc,
  apiReferenceDoc,
];
