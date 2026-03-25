import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ApiKeyRole } from '../entities/api-key.entity';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IS_ADMIN_ONLY_KEY } from '../decorators/admin-only.decorator';
import { ApiKeyService } from '../services/api-key.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly apiKeyService: ApiKeyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<Request>();
    // EventSource cannot send custom headers — accept key via query param as fallback
    const rawKey =
      (request.headers['x-api-key'] as string | undefined) ??
      (request.query['api_key'] as string | undefined);

    if (!rawKey) {
      throw new UnauthorizedException('X-Api-Key header (or ?api_key= query param) is required.');
    }

    const apiKey = await this.apiKeyService.validate(rawKey);
    if (!apiKey) {
      throw new UnauthorizedException('Invalid or expired API key.');
    }

    // Attach to request so controllers and decorators can access it
    (request as Request & { apiKey: typeof apiKey }).apiKey = apiKey;

    const isAdminOnly = this.reflector.getAllAndOverride<boolean>(
      IS_ADMIN_ONLY_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isAdminOnly && apiKey.role !== ApiKeyRole.ADMIN) {
      throw new ForbiddenException('Admin API key required.');
    }

    return true;
  }
}
