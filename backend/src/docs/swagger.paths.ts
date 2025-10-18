/**
 * Swagger API Path Definitions
 * This file contains all endpoint documentation for Swagger/OpenAPI
 */

export const swaggerPaths = {
  // ============================================================================
  // HEALTH & INFO
  // ============================================================================
  '/health': {
    get: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Check if the API is running and healthy',
      security: [],
      responses: {
        200: {
          description: 'API is healthy',
          content: {
            'application/json': {
              example: {
                status: 'healthy',
                timestamp: '2025-10-14T00:00:00.000Z',
                uptime: 12345,
                environment: 'development',
              },
            },
          },
        },
      },
    },
  },

  '/': {
    get: {
      tags: ['Health'],
      summary: 'API information',
      description: 'Get basic API information and available endpoints',
      security: [],
      responses: {
        200: {
          description: 'API information',
          content: {
            'application/json': {
              example: {
                message: 'Kaia Backend API',
                version: '1.0.0',
                status: 'running',
                documentation: '/api/docs',
                endpoints: {
                  auth: '/api/auth',
                  events: '/api/events',
                  mcps: '/api/mcps',
                  voice: '/api/voice',
                  messages: '/api/messages',
                  location: '/api/location',
                  users: '/api/users',
                },
              },
            },
          },
        },
      },
    },
  },

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  '/api/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register new user',
      description: 'Create a new user account',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'name'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                password: { type: 'string', minLength: 8, example: 'StrongPass123' },
                name: { type: 'string', example: 'John' },
                lastName: { type: 'string', example: 'Doe' },
                phone: { type: 'string', example: '+34612345678' },
                birthDate: { type: 'string', format: 'date-time' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Usuario registrado exitosamente' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      tokens: { $ref: '#/components/schemas/AuthTokens' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        409: {
          description: 'Email already exists',
          content: {
            'application/json': {
              example: {
                success: false,
                error: {
                  code: 'ALREADY_EXISTS',
                  message: 'El email ya está registrado',
                },
              },
            },
          },
        },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Login',
      description: 'Authenticate user and get JWT tokens',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email', example: 'user@example.com' },
                password: { type: 'string', example: 'StrongPass123' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Login exitoso' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      tokens: { $ref: '#/components/schemas/AuthTokens' },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
          content: {
            'application/json': {
              example: {
                success: false,
                error: {
                  code: 'INVALID_CREDENTIALS',
                  message: 'Credenciales inválidas',
                },
              },
            },
          },
        },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/auth/refresh': {
    post: {
      tags: ['Auth'],
      summary: 'Refresh token',
      description: 'Get new access token using refresh token',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['refreshToken'],
              properties: {
                refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Token refreshed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Token refrescado' },
                  data: {
                    type: 'object',
                    properties: {
                      tokens: { $ref: '#/components/schemas/AuthTokens' },
                    },
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid refresh token',
          content: {
            'application/json': {
              example: {
                success: false,
                error: {
                  code: 'INVALID_TOKEN',
                  message: 'Token inválido o expirado',
                },
              },
            },
          },
        },
      },
    },
  },

  '/api/auth/profile': {
    get: {
      tags: ['Auth'],
      summary: 'Get current user profile',
      description: 'Get authenticated user information',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'User profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  // ============================================================================
  // EVENTS
  // ============================================================================
  '/api/events': {
    get: {
      tags: ['Events'],
      summary: 'List events',
      description: 'Get list of user events with optional filters',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          schema: { type: 'string', enum: ['MEDICAL', 'MEETING', 'PERSONAL', 'WORK', 'BIRTHDAY', 'OTHER'] },
          description: 'Filter by event type',
        },
        {
          name: 'startDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'Filter events after this date',
        },
        {
          name: 'endDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'Filter events before this date',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50 },
          description: 'Maximum number of results',
        },
      ],
      responses: {
        200: {
          description: 'List of events',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      events: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Event' },
                      },
                      total: { type: 'integer', example: 42 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
    post: {
      tags: ['Events'],
      summary: 'Create event',
      description: 'Create a new calendar event',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'startTime'],
              properties: {
                title: { type: 'string', example: 'Team Meeting' },
                description: { type: 'string', example: 'Weekly sync with the team' },
                type: { type: 'string', enum: ['MEDICAL', 'MEETING', 'PERSONAL', 'WORK', 'BIRTHDAY', 'OTHER'], example: 'MEETING' },
                startTime: { type: 'string', format: 'date-time', example: '2025-10-15T10:00:00Z' },
                endTime: { type: 'string', format: 'date-time', example: '2025-10-15T11:00:00Z' },
                allDay: { type: 'boolean', example: false },
                location: { type: 'string', example: 'Office' },
                participants: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['john@example.com', 'jane@example.com'],
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Event created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Evento creado exitosamente' },
                  data: {
                    type: 'object',
                    properties: {
                      event: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/events/{id}': {
    get: {
      tags: ['Events'],
      summary: 'Get event by ID',
      description: 'Get a specific event',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ID',
        },
      ],
      responses: {
        200: {
          description: 'Event details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      event: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    put: {
      tags: ['Events'],
      summary: 'Update event',
      description: 'Update an existing event',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                startTime: { type: 'string', format: 'date-time' },
                endTime: { type: 'string', format: 'date-time' },
                location: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Event updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Evento actualizado' },
                  data: {
                    type: 'object',
                    properties: {
                      event: { $ref: '#/components/schemas/Event' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    delete: {
      tags: ['Events'],
      summary: 'Delete event',
      description: 'Delete an event',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Event ID',
        },
      ],
      responses: {
        200: {
          description: 'Event deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Evento eliminado' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/events/range': {
    get: {
      tags: ['Events'],
      summary: 'Get events by date range',
      description: 'Get all events within a specific date range',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'startDate',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date-time' },
          description: 'Start date',
          example: '2025-10-01T00:00:00Z',
        },
        {
          name: 'endDate',
          in: 'query',
          required: true,
          schema: { type: 'string', format: 'date-time' },
          description: 'End date',
          example: '2025-10-31T23:59:59Z',
        },
      ],
      responses: {
        200: {
          description: 'Events in range',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      events: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Event' },
                      },
                      total: { type: 'integer', example: 12 },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  // ============================================================================
  // MESSAGES
  // ============================================================================
  '/api/messages': {
    get: {
      tags: ['Messages'],
      summary: 'List messages',
      description: 'Get list of user messages',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'List of messages',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                      },
                      total: { type: 'integer', example: 50 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
    post: {
      tags: ['Messages'],
      summary: 'Send message',
      description: 'Send a new message to a contact',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['contactId', 'content'],
              properties: {
                contactId: { type: 'string', example: 'abc-123' },
                content: { type: 'string', example: 'Hello, how are you?' },
                messageType: { type: 'string', enum: ['TEXT', 'VOICE', 'LOCATION'], default: 'TEXT' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Message sent',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mensaje enviado' },
                  data: {
                    type: 'object',
                    properties: {
                      message: { $ref: '#/components/schemas/Message' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/messages/conversations': {
    get: {
      tags: ['Messages'],
      summary: 'Get conversations',
      description: 'Get list of all conversations with latest message',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'List of conversations',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      conversations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            contactId: { type: 'string' },
                            contactName: { type: 'string' },
                            lastMessage: { $ref: '#/components/schemas/Message' },
                            unreadCount: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/messages/conversation/{contactId}': {
    get: {
      tags: ['Messages'],
      summary: 'Get conversation',
      description: 'Get all messages in a conversation with a specific contact',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'contactId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
      ],
      responses: {
        200: {
          description: 'Conversation messages',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/messages/unread': {
    get: {
      tags: ['Messages'],
      summary: 'Get unread messages',
      description: 'Get all unread messages for the authenticated user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Unread messages',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                      },
                      total: { type: 'integer', example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/messages/unread/count': {
    get: {
      tags: ['Messages'],
      summary: 'Get unread count',
      description: 'Get count of unread messages',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Unread count',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      count: { type: 'integer', example: 5 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/messages/search': {
    get: {
      tags: ['Messages'],
      summary: 'Search messages',
      description: 'Search messages by query string',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Search query',
          example: 'meeting',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 20 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      messages: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/messages/stats': {
    get: {
      tags: ['Messages'],
      summary: 'Get message statistics',
      description: 'Get messaging statistics for the user',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Message statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalMessages: { type: 'integer', example: 150 },
                      sentMessages: { type: 'integer', example: 80 },
                      receivedMessages: { type: 'integer', example: 70 },
                      unreadMessages: { type: 'integer', example: 5 },
                      conversations: { type: 'integer', example: 12 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/messages/{id}/read': {
    post: {
      tags: ['Messages'],
      summary: 'Mark message as read',
      description: 'Mark a specific message as read',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Message ID',
        },
      ],
      responses: {
        200: {
          description: 'Message marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mensaje marcado como leído' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/messages/conversation/{contactId}/read': {
    post: {
      tags: ['Messages'],
      summary: 'Mark conversation as read',
      description: 'Mark all messages in a conversation as read',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'contactId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
      ],
      responses: {
        200: {
          description: 'Conversation marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Conversación marcada como leída' },
                  data: {
                    type: 'object',
                    properties: {
                      updatedCount: { type: 'integer', example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/messages/{id}/retry': {
    post: {
      tags: ['Messages'],
      summary: 'Retry failed message',
      description: 'Retry sending a failed message',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Message ID',
        },
      ],
      responses: {
        200: {
          description: 'Message retry successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mensaje reenviado' },
                  data: {
                    type: 'object',
                    properties: {
                      message: { $ref: '#/components/schemas/Message' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/messages/{id}': {
    delete: {
      tags: ['Messages'],
      summary: 'Delete message',
      description: 'Delete a specific message',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Message ID',
        },
      ],
      responses: {
        200: {
          description: 'Message deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Mensaje eliminado' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  // ============================================================================
  // VOICE
  // ============================================================================
  '/api/voice/process': {
    post: {
      tags: ['Voice'],
      summary: 'Process voice command',
      description: 'Process a voice command and execute the corresponding action',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['text'],
              properties: {
                text: { type: 'string', example: 'Recordarme reunión mañana a las 3pm' },
                language: { type: 'string', default: 'es', example: 'es' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Command processed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      intent: { type: 'string', example: 'CREATE_EVENT' },
                      confidence: { type: 'number', example: 0.95 },
                      entities: { type: 'object' },
                      action: { type: 'string', example: 'Event created successfully' },
                      result: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/voice/history': {
    get: {
      tags: ['Voice'],
      summary: 'Get voice command history',
      description: 'Get list of processed voice commands',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'Voice command history',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      commands: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/VoiceSession' },
                      },
                      total: { type: 'integer', example: 123 },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/voice/stats': {
    get: {
      tags: ['Voice'],
      summary: 'Get voice statistics',
      description: 'Get voice command usage statistics',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Voice statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalCommands: { type: 'integer', example: 123 },
                      successfulCommands: { type: 'integer', example: 110 },
                      failedCommands: { type: 'integer', example: 13 },
                      averageConfidence: { type: 'number', example: 0.87 },
                      mostUsedIntents: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            intent: { type: 'string' },
                            count: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/voice/accuracy': {
    get: {
      tags: ['Voice'],
      summary: 'Get accuracy by intent',
      description: 'Get voice recognition accuracy breakdown by intent type',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Accuracy statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      byIntent: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            intent: { type: 'string', example: 'CREATE_EVENT' },
                            accuracy: { type: 'number', example: 0.92 },
                            total: { type: 'integer', example: 45 },
                            successful: { type: 'integer', example: 41 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/voice/intents': {
    get: {
      tags: ['Voice'],
      summary: 'Get common intents',
      description: 'Get list of most commonly used voice command intents',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Common intents',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      intents: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            intent: { type: 'string', example: 'CREATE_EVENT' },
                            count: { type: 'integer', example: 45 },
                            percentage: { type: 'number', example: 36.5 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  // ============================================================================
  // LOCATION
  // ============================================================================
  '/api/location': {
    get: {
      tags: ['Location'],
      summary: 'Get last location',
      description: 'Get user\'s most recent location',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Last location',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      location: {
                        type: 'object',
                        properties: {
                          latitude: { type: 'number', example: 40.416775 },
                          longitude: { type: 'number', example: -3.703790 },
                          address: { type: 'string', example: 'Madrid, Spain' },
                          timestamp: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    post: {
      tags: ['Location'],
      summary: 'Update location',
      description: 'Update user\'s current location',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: { type: 'number', example: 40.416775 },
                longitude: { type: 'number', example: -3.703790 },
                accuracy: { type: 'number', example: 10 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Location updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Ubicación actualizada' },
                  data: {
                    type: 'object',
                    properties: {
                      address: { type: 'string', example: 'Madrid, Spain' },
                      nearbyGeofences: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/location/history': {
    get: {
      tags: ['Location'],
      summary: 'Get location history',
      description: 'Get user\'s location history',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'startDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'Start date',
        },
        {
          name: 'endDate',
          in: 'query',
          schema: { type: 'string', format: 'date-time' },
          description: 'End date',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 100 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'Location history',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      locations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            latitude: { type: 'number' },
                            longitude: { type: 'number' },
                            address: { type: 'string' },
                            timestamp: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/location/stats': {
    get: {
      tags: ['Location'],
      summary: 'Get location statistics',
      description: 'Get location tracking statistics',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Location statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalLocations: { type: 'integer', example: 500 },
                      lastUpdate: { type: 'string', format: 'date-time' },
                      mostVisitedPlaces: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            address: { type: 'string' },
                            visits: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/location/route': {
    post: {
      tags: ['Location'],
      summary: 'Calculate route',
      description: 'Calculate route between two points',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['origin', 'destination'],
              properties: {
                origin: {
                  type: 'object',
                  required: ['latitude', 'longitude'],
                  properties: {
                    latitude: { type: 'number', example: 40.416775 },
                    longitude: { type: 'number', example: -3.703790 },
                  },
                },
                destination: {
                  type: 'object',
                  required: ['latitude', 'longitude'],
                  properties: {
                    latitude: { type: 'number', example: 40.453054 },
                    longitude: { type: 'number', example: -3.688344 },
                  },
                },
                mode: { type: 'string', enum: ['driving', 'walking', 'transit'], default: 'driving' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Route calculated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      distance: { type: 'number', example: 5.2, description: 'Distance in km' },
                      duration: { type: 'number', example: 15, description: 'Duration in minutes' },
                      steps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            instruction: { type: 'string' },
                            distance: { type: 'number' },
                            duration: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/location/geocode': {
    post: {
      tags: ['Location'],
      summary: 'Geocode address',
      description: 'Convert address to coordinates',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['address'],
              properties: {
                address: { type: 'string', example: 'Puerta del Sol, Madrid' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Address geocoded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      latitude: { type: 'number', example: 40.416775 },
                      longitude: { type: 'number', example: -3.703790 },
                      formattedAddress: { type: 'string', example: 'Puerta del Sol, Madrid, Spain' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/location/reverse-geocode': {
    post: {
      tags: ['Location'],
      summary: 'Reverse geocode',
      description: 'Convert coordinates to address',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['latitude', 'longitude'],
              properties: {
                latitude: { type: 'number', example: 40.416775 },
                longitude: { type: 'number', example: -3.703790 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Coordinates reverse geocoded',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      address: { type: 'string', example: 'Puerta del Sol, Madrid, Spain' },
                      city: { type: 'string', example: 'Madrid' },
                      country: { type: 'string', example: 'Spain' },
                      postalCode: { type: 'string', example: '28013' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/location/geofences': {
    get: {
      tags: ['Location'],
      summary: 'List geofences',
      description: 'Get list of user geofences',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'List of geofences',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      geofences: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string', example: 'Home' },
                            latitude: { type: 'number' },
                            longitude: { type: 'number' },
                            radius: { type: 'number', example: 100, description: 'Radius in meters' },
                            active: { type: 'boolean' },
                          },
                        },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/location/geofence': {
    post: {
      tags: ['Location'],
      summary: 'Create geofence',
      description: 'Create a new geofence',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'latitude', 'longitude', 'radius'],
              properties: {
                name: { type: 'string', example: 'Home' },
                latitude: { type: 'number', example: 40.416775 },
                longitude: { type: 'number', example: -3.703790 },
                radius: { type: 'number', example: 100, description: 'Radius in meters' },
                enterNotification: { type: 'boolean', default: true },
                exitNotification: { type: 'boolean', default: true },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Geofence created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Geofence creada' },
                  data: {
                    type: 'object',
                    properties: {
                      geofence: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          latitude: { type: 'number' },
                          longitude: { type: 'number' },
                          radius: { type: 'number' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/location/geofence/{id}': {
    delete: {
      tags: ['Location'],
      summary: 'Delete geofence',
      description: 'Delete a geofence',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Geofence ID',
        },
      ],
      responses: {
        200: {
          description: 'Geofence deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Geofence eliminada' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/location/nearby': {
    get: {
      tags: ['Location'],
      summary: 'Find nearby places',
      description: 'Find places near current location',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          schema: { type: 'string', example: 'restaurant' },
          description: 'Place type',
        },
        {
          name: 'radius',
          in: 'query',
          schema: { type: 'number', default: 1000 },
          description: 'Search radius in meters',
        },
      ],
      responses: {
        200: {
          description: 'Nearby places',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      places: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            address: { type: 'string' },
                            distance: { type: 'number', description: 'Distance in meters' },
                            type: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/location/closest': {
    get: {
      tags: ['Location'],
      summary: 'Find closest place',
      description: 'Find closest place of a specific type',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'type',
          in: 'query',
          required: true,
          schema: { type: 'string', example: 'hospital' },
          description: 'Place type',
        },
      ],
      responses: {
        200: {
          description: 'Closest place',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      place: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          address: { type: 'string' },
                          distance: { type: 'number', description: 'Distance in meters' },
                          coordinates: {
                            type: 'object',
                            properties: {
                              latitude: { type: 'number' },
                              longitude: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/location/near/{placeId}': {
    get: {
      tags: ['Location'],
      summary: 'Check if near place',
      description: 'Check if user is near a specific place',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'placeId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Place ID',
        },
        {
          name: 'radius',
          in: 'query',
          schema: { type: 'number', default: 500 },
          description: 'Proximity radius in meters',
        },
      ],
      responses: {
        200: {
          description: 'Proximity status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      isNear: { type: 'boolean', example: true },
                      distance: { type: 'number', example: 250, description: 'Distance in meters' },
                      place: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          address: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  // ============================================================================
  // MCPs (Model Context Protocol)
  // ============================================================================
  '/api/mcps': {
    get: {
      tags: ['MCPs'],
      summary: 'List MCPs',
      description: 'Get list of all registered MCPs (Model Context Protocol integrations)',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'List of MCPs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      mcps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string', example: 'Weather API' },
                            capability: { type: 'string', example: 'weather' },
                            enabled: { type: 'boolean' },
                            rating: { type: 'number' },
                          },
                        },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
    post: {
      tags: ['MCPs'],
      summary: 'Register MCP',
      description: 'Register a new MCP integration',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'capability', 'endpoint'],
              properties: {
                name: { type: 'string', example: 'Weather API' },
                capability: { type: 'string', example: 'weather' },
                endpoint: { type: 'string', example: 'https://api.weather.com' },
                apiKey: { type: 'string' },
                config: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'MCP registered',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'MCP registrado exitosamente' },
                  data: {
                    type: 'object',
                    properties: {
                      mcp: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          capability: { type: 'string' },
                          enabled: { type: 'boolean', example: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/mcps/{id}': {
    get: {
      tags: ['MCPs'],
      summary: 'Get MCP by ID',
      description: 'Get details of a specific MCP',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MCP ID',
        },
      ],
      responses: {
        200: {
          description: 'MCP details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      mcp: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          capability: { type: 'string' },
                          endpoint: { type: 'string' },
                          enabled: { type: 'boolean' },
                          rating: { type: 'number' },
                          executions: { type: 'integer' },
                          lastUsed: { type: 'string', format: 'date-time' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    put: {
      tags: ['MCPs'],
      summary: 'Update MCP',
      description: 'Update MCP configuration',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MCP ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                endpoint: { type: 'string' },
                apiKey: { type: 'string' },
                config: { type: 'object' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'MCP updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'MCP actualizado' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    delete: {
      tags: ['MCPs'],
      summary: 'Delete MCP',
      description: 'Delete an MCP integration',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MCP ID',
        },
      ],
      responses: {
        200: {
          description: 'MCP deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'MCP eliminado' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/mcps/recommended': {
    get: {
      tags: ['MCPs'],
      summary: 'Get recommended MCPs',
      description: 'Get list of recommended MCPs based on user activity',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Recommended MCPs',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      mcps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            capability: { type: 'string' },
                            description: { type: 'string' },
                            popularity: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/mcps/capability/{capability}': {
    get: {
      tags: ['MCPs'],
      summary: 'Find MCPs by capability',
      description: 'Find MCPs that provide a specific capability',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'capability',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Capability name',
          example: 'weather',
        },
      ],
      responses: {
        200: {
          description: 'MCPs with capability',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      mcps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            enabled: { type: 'boolean' },
                            rating: { type: 'number' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/mcps/execute': {
    post: {
      tags: ['MCPs'],
      summary: 'Execute MCP',
      description: 'Execute an MCP with specific parameters',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['mcpId', 'action'],
              properties: {
                mcpId: { type: 'string', example: 'abc-123' },
                action: { type: 'string', example: 'getWeather' },
                parameters: {
                  type: 'object',
                  example: { city: 'Madrid' },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'MCP executed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      result: { type: 'object' },
                      executionTime: { type: 'number', description: 'Execution time in ms' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        429: { $ref: '#/components/responses/RateLimitError' },
      },
    },
  },

  '/api/mcps/{id}/toggle': {
    post: {
      tags: ['MCPs'],
      summary: 'Toggle MCP',
      description: 'Enable or disable an MCP',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MCP ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['enabled'],
              properties: {
                enabled: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'MCP toggled',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'MCP actualizado' },
                  data: {
                    type: 'object',
                    properties: {
                      enabled: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/mcps/{id}/rate': {
    post: {
      tags: ['MCPs'],
      summary: 'Rate MCP',
      description: 'Rate an MCP integration',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'MCP ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['rating'],
              properties: {
                rating: { type: 'number', minimum: 1, maximum: 5, example: 4 },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'MCP rated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Rating guardado' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/mcps/executions/history': {
    get: {
      tags: ['MCPs'],
      summary: 'Get execution history',
      description: 'Get history of MCP executions',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 50 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'Execution history',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      executions: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            mcpName: { type: 'string' },
                            action: { type: 'string' },
                            success: { type: 'boolean' },
                            executionTime: { type: 'number' },
                            timestamp: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/mcps/stats': {
    get: {
      tags: ['MCPs'],
      summary: 'Get MCP statistics',
      description: 'Get MCP usage statistics',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'MCP statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalMCPs: { type: 'integer', example: 8 },
                      enabledMCPs: { type: 'integer', example: 6 },
                      totalExecutions: { type: 'integer', example: 150 },
                      successRate: { type: 'number', example: 0.95 },
                      mostUsed: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            executions: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  // ============================================================================
  // CONTACTS
  // ============================================================================
  '/api/contacts': {
    get: {
      tags: ['Contacts'],
      summary: 'List contacts',
      description: 'Get list of user contacts',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 100 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'List of contacts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contacts: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Contact' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
    post: {
      tags: ['Contacts'],
      summary: 'Create contact',
      description: 'Create a new contact',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'phone'],
              properties: {
                name: { type: 'string', example: 'John Doe' },
                phone: { type: 'string', example: '+34612345678' },
                email: { type: 'string', format: 'email', example: 'john@example.com' },
                relationship: { type: 'string', example: 'Friend' },
                tags: { type: 'array', items: { type: 'string' }, example: ['work', 'important'] },
                hasWhatsApp: { type: 'boolean', default: false },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Contact created',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Contacto creado' },
                  data: {
                    type: 'object',
                    properties: {
                      contact: { $ref: '#/components/schemas/Contact' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/{id}': {
    get: {
      tags: ['Contacts'],
      summary: 'Get contact by ID',
      description: 'Get a specific contact',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
      ],
      responses: {
        200: {
          description: 'Contact details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contact: { $ref: '#/components/schemas/Contact' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    put: {
      tags: ['Contacts'],
      summary: 'Update contact',
      description: 'Update an existing contact',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                email: { type: 'string', format: 'email' },
                relationship: { type: 'string' },
                hasWhatsApp: { type: 'boolean' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Contact updated',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Contacto actualizado' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
    delete: {
      tags: ['Contacts'],
      summary: 'Delete contact',
      description: 'Delete a contact',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
      ],
      responses: {
        200: {
          description: 'Contact deleted',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Contacto eliminado' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/contacts/search': {
    get: {
      tags: ['Contacts'],
      summary: 'Search contacts',
      description: 'Search contacts by name, phone, or email',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'q',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'Search query',
          example: 'john',
        },
      ],
      responses: {
        200: {
          description: 'Search results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contacts: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Contact' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/frequent': {
    get: {
      tags: ['Contacts'],
      summary: 'Get frequent contacts',
      description: 'Get most frequently contacted people',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'Frequent contacts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contacts: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/Contact' },
                            {
                              type: 'object',
                              properties: {
                                messageCount: { type: 'integer' },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/recent': {
    get: {
      tags: ['Contacts'],
      summary: 'Get recent contacts',
      description: 'Get recently contacted people',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', default: 10 },
          description: 'Maximum results',
        },
      ],
      responses: {
        200: {
          description: 'Recent contacts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contacts: {
                        type: 'array',
                        items: {
                          allOf: [
                            { $ref: '#/components/schemas/Contact' },
                            {
                              type: 'object',
                              properties: {
                                lastContact: { type: 'string', format: 'date-time' },
                              },
                            },
                          ],
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/whatsapp': {
    get: {
      tags: ['Contacts'],
      summary: 'Get WhatsApp contacts',
      description: 'Get contacts that have WhatsApp',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'WhatsApp contacts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contacts: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Contact' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/tags': {
    get: {
      tags: ['Contacts'],
      summary: 'Get all tags',
      description: 'Get list of all contact tags',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'List of tags',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      tags: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            tag: { type: 'string', example: 'work' },
                            count: { type: 'integer', example: 15 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/tags/{tag}': {
    get: {
      tags: ['Contacts'],
      summary: 'Get contacts by tag',
      description: 'Get all contacts with a specific tag',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'tag',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Tag name',
          example: 'work',
        },
      ],
      responses: {
        200: {
          description: 'Contacts with tag',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      contacts: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Contact' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/{id}/tags': {
    post: {
      tags: ['Contacts'],
      summary: 'Add tag to contact',
      description: 'Add a tag to a contact',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tag'],
              properties: {
                tag: { type: 'string', example: 'important' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Tag added',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Tag agregado' },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/contacts/{id}/tags/{tag}': {
    delete: {
      tags: ['Contacts'],
      summary: 'Remove tag from contact',
      description: 'Remove a tag from a contact',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Contact ID',
        },
        {
          name: 'tag',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Tag to remove',
        },
      ],
      responses: {
        200: {
          description: 'Tag removed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Tag eliminado' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      },
    },
  },

  '/api/contacts/sync': {
    post: {
      tags: ['Contacts'],
      summary: 'Sync contacts from device',
      description: 'Synchronize contacts from mobile device',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['contacts'],
              properties: {
                contacts: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      phone: { type: 'string' },
                      email: { type: 'string' },
                      hasWhatsApp: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Contacts synced',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Contactos sincronizados' },
                  data: {
                    type: 'object',
                    properties: {
                      imported: { type: 'integer', example: 45 },
                      updated: { type: 'integer', example: 12 },
                      skipped: { type: 'integer', example: 3 },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/cleanup': {
    post: {
      tags: ['Contacts'],
      summary: 'Cleanup inactive contacts',
      description: 'Remove contacts that have not been contacted in a specified time period',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['inactiveDays'],
              properties: {
                inactiveDays: { type: 'integer', example: 365, description: 'Days of inactivity' },
                dryRun: { type: 'boolean', default: false, description: 'Preview without deleting' },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Cleanup completed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Limpieza completada' },
                  data: {
                    type: 'object',
                    properties: {
                      deleted: { type: 'integer', example: 23 },
                      candidates: { type: 'integer', description: 'For dryRun mode' },
                    },
                  },
                },
              },
            },
          },
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },

  '/api/contacts/stats': {
    get: {
      tags: ['Contacts'],
      summary: 'Get contact statistics',
      description: 'Get contact usage statistics',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Contact statistics',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      totalContacts: { type: 'integer', example: 150 },
                      whatsappContacts: { type: 'integer', example: 120 },
                      totalTags: { type: 'integer', example: 8 },
                      averageMessages: { type: 'number', example: 45.5 },
                      topContacts: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            messageCount: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      },
    },
  },
};
