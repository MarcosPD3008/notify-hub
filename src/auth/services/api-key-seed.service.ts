import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { ApiKeyService } from './api-key.service';

@Injectable()
export class ApiKeySeedService implements OnModuleInit {
  private readonly logger = new Logger(ApiKeySeedService.name);

  constructor(private readonly apiKeyService: ApiKeyService) {}

  async onModuleInit(): Promise<void> {
    const masterKey = process.env.MASTER_API_KEY;

    if (masterKey) {
      await this.apiKeyService.upsertSeedKey(masterKey);
      this.logger.log('Master API key loaded from MASTER_API_KEY env variable.');
      return;
    }

    // No env key configured — auto-generate if no admin key exists yet
    const hasAdmin = await this.apiKeyService.hasAdminKey();
    if (!hasAdmin) {
      const rawKey = `nhk_${randomBytes(24).toString('hex')}`;
      await this.apiKeyService.upsertSeedKey(rawKey);

      this.logger.warn('='.repeat(62));
      this.logger.warn('  MASTER_API_KEY not set — auto-generated admin key:');
      this.logger.warn(`  ${rawKey}`);
      this.logger.warn('  Add to .env as MASTER_API_KEY to reuse across restarts.');
      this.logger.warn('='.repeat(62));
    }
  }
}
