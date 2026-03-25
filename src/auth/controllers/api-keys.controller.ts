import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { Post } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { AdminOnly } from '../decorators/admin-only.decorator';
import { ApiKeyService } from '../services/api-key.service';
import { ApiKeyCreatedDto, CreateApiKeyDto } from '../dto/create-api-key.dto';
import { ApiKey } from '../entities/api-key.entity';

@ApiTags('Auth — API Keys')
@ApiSecurity('X-Api-Key')
@AdminOnly()
@Controller('auth/keys')
export class ApiKeysController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Key created — raw value shown once',
    type: ApiKeyCreatedDto,
  })
  async create(@Body() dto: CreateApiKeyDto): Promise<ApiKeyCreatedDto> {
    const { key, record } = await this.apiKeyService.create(dto);
    return {
      key,
      id: record.id,
      name: record.name,
      serviceId: record.serviceId,
      role: record.role,
      expiresAt: record.expiresAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all API keys (admin only)' })
  @ApiResponse({ status: 200, type: [ApiKey] })
  async findAll(): Promise<ApiKey[]> {
    return this.apiKeyService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke an API key (admin only)' })
  @ApiResponse({ status: 204 })
  async revoke(@Param('id') id: string): Promise<void> {
    await this.apiKeyService.revoke(id);
  }
}
