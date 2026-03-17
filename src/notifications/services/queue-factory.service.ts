import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { getQueueToken } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueFactoryService {
  private readonly logger = new Logger(QueueFactoryService.name);

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Obtiene la cola dedicada al proveedor dinámicamente (ej: 'whatsapp-queue').
   * Si el módulo no configuró una, hace un "fallback" a la cola universal.
   */
  getQueue(providerName: string): Queue {
    try {
      const queueToken = getQueueToken(`${providerName}-queue`);

      // Intenta resolver la inyección desde el contenedor de Nest de forma dinámica
      const specializedQueue = this.moduleRef.get<Queue>(queueToken, {
        strict: false,
      });

      if (specializedQueue) {
        return specializedQueue;
      }
    } catch {
      // Excepción esperada: Significa que no existe el provider '{x}-queue'
    }

    // Fallback: Retorna la cola por defecto genérica
    const defaultToken = getQueueToken('notifications-queue');
    return this.moduleRef.get<Queue>(defaultToken, { strict: false });
  }
}
