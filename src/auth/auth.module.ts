import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './entities/api-key.entity';
import { ApiKeyService } from './services/api-key.service';
import { ApiKeySeedService } from './services/api-key-seed.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { ApiKeysController } from './controllers/api-keys.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey])],
  controllers: [ApiKeysController],
  providers: [ApiKeyService, ApiKeySeedService, ApiKeyGuard],
  exports: [ApiKeyGuard, ApiKeyService],
})
export class AuthModule {}
