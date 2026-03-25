import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ApiKey } from '../entities/api-key.entity';

/** Injects the validated ApiKey from the current request. */
export const CurrentApiKey = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): ApiKey => {
    const request = ctx.switchToHttp().getRequest<{ apiKey: ApiKey }>();
    return request.apiKey;
  },
);
