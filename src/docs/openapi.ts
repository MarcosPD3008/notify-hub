export interface OpenApiDocument {
  openapi: '3.0.0';
  info: {
    title: string;
    version: string;
    description: string;
  };
  paths: Record<string, unknown>;
  components: {
    schemas: Record<string, unknown>;
  };
}

export function createOpenApiDocument(qrStreamPath: string): OpenApiDocument {
  return {
    openapi: '3.0.0',
    info: {
      title: 'MICRO.Notify API',
      version: '1.0.0',
      description:
        'Microservicio de notificaciones con arquitectura Provider/Adapter.',
    },
    paths: {
      '/health': {
        get: {
          summary: 'Healthcheck del servicio',
          responses: {
            '200': {
              description: 'Estado del servicio y proveedores',
            },
          },
        },
      },
      '/auth/qr': {
        get: {
          summary: 'Obtiene el último QR de autenticación de WhatsApp',
          responses: {
            '200': {
              description: 'HTML con QR en texto',
            },
          },
        },
      },
      '/send': {
        post: {
          summary: 'Envia notificaciones por provider',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SendNotificationRequest',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Mensaje enviado',
            },
            '400': {
              description: 'Payload inválido',
            },
          },
        },
      },
      [qrStreamPath]: {
        get: {
          summary: 'SSE stream del último QR de WhatsApp',
          responses: {
            '200': {
              description: 'Evento SSE con el QR actual y actualizaciones',
            },
          },
        },
      },
    },
    components: {
      schemas: {
        SendNotificationRequest: {
          type: 'object',
          required: ['provider', 'data'],
          properties: {
            provider: {
              type: 'string',
              example: 'whatsapp',
            },
            data: {
              oneOf: [
                {
                  $ref: '#/components/schemas/WhatsappSendData',
                },
              ],
            },
          },
        },
        WhatsappSendData: {
          type: 'object',
          required: ['to', 'message'],
          properties: {
            to: {
              type: 'array',
              items: { type: 'string' },
              example: ['1234', '5678'],
            },
            message: {
              type: 'string',
              example: 'Hola',
            },
          },
        },
      },
    },
  };
}
