export * from './client';
export * from './auth';
export * from './generation';
export * from './content';
export * from './platforms';
export * from './analytics';
export * from './billing';

// Re-export all API modules for convenience
import { authApi } from './auth';
import { generationApi } from './generation';
import { contentApi } from './content';
import { platformsApi } from './platforms';
import { analyticsApi } from './analytics';
import { billingApi } from './billing';

export const api = {
  auth: authApi,
  generation: generationApi,
  content: contentApi,
  platforms: platformsApi,
  analytics: analyticsApi,
  billing: billingApi,
};

// Export types
export type * from './auth';
export type * from './generation';
export type * from './content';
export type * from './platforms';
export type * from './analytics';
export type * from './billing';