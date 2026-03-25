import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { ApiKey, ApiKeyRole } from '../entities/api-key.entity';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Injectable()
export class ApiKeyService {
  constructor(
    @InjectRepository(ApiKey)
    private readonly repo: Repository<ApiKey>,
  ) {}

  /** Validate a raw key and return the matching ApiKey entity, or null if invalid. */
  async validate(rawKey: string): Promise<ApiKey | null> {
    const prefix = rawKey.substring(0, 12);

    // Narrow candidates by prefix, then bcrypt-compare to find the exact match
    const candidates = await this.repo
      .createQueryBuilder('k')
      .addSelect('k.keyHash')
      .where('k.keyPrefix = :prefix', { prefix })
      .andWhere('k.isActive = true')
      .getMany();

    for (const candidate of candidates) {
      if (await bcrypt.compare(rawKey, candidate.keyHash)) {
        if (candidate.expiresAt && candidate.expiresAt < new Date()) {
          return null; // expired
        }
        void this.repo.update(candidate.id, { lastUsedAt: new Date() });
        return candidate;
      }
    }

    return null;
  }

  /** Create a new API key. Returns the raw key (shown once) + the stored record. */
  async create(
    dto: CreateApiKeyDto,
  ): Promise<{ key: string; record: ApiKey }> {
    const rawKey = `nhk_${randomBytes(24).toString('hex')}`;
    return this.saveKey(rawKey, dto);
  }

  /**
   * Seed / re-seed the master key from an explicit raw value.
   * Used by ApiKeySeedService on startup.
   */
  async upsertSeedKey(rawKey: string): Promise<void> {
    await this.repo.delete({ name: '__master_seed__' });
    await this.saveKey(rawKey, {
      name: '__master_seed__',
      serviceId: 'master',
      role: ApiKeyRole.ADMIN,
    });
  }

  async findAll(): Promise<ApiKey[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { isActive: false });
  }

  async hasAdminKey(): Promise<boolean> {
    const count = await this.repo.count({
      where: { role: ApiKeyRole.ADMIN, isActive: true },
    });
    return count > 0;
  }

  // ─── private ─────────────────────────────────────────────────────────────

  private async saveKey(
    rawKey: string,
    dto: Pick<CreateApiKeyDto, 'name' | 'serviceId' | 'role' | 'expiresAt'>,
  ): Promise<{ key: string; record: ApiKey }> {
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 12);

    const record = this.repo.create({
      name: dto.name,
      serviceId: dto.serviceId,
      keyHash,
      keyPrefix,
      role: dto.role ?? ApiKeyRole.SERVICE,
      expiresAt: dto.expiresAt ?? null,
    });

    await this.repo.save(record);
    return { key: rawKey, record };
  }
}
