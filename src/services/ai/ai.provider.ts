import type { AiProvider } from './ai.types.js';
import { AnthropicProvider } from './anthropic.provider.js';
import { OpenAiProvider } from './openai.provider.js';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/AppError.js';
export function aiProvider(): AiProvider {
  if (env.AI_PROVIDER === 'openai') return new OpenAiProvider();
  if (env.AI_PROVIDER === 'anthropic') return new AnthropicProvider();
  throw new AppError('Unsupported AI provider', 503, 'AI_PROVIDER_UNAVAILABLE');
}
