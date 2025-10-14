// Swagger Configuration for Kaia API
import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerPaths } from '../docs/swagger.paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kaia API',
      version: '1.0.0',
      description: `
# Kaia - AI-Powered Personal Assistant API

Kaia is an intelligent personal assistant that helps manage events, reminders, alarms, messages, and more through voice commands and contextual AI.

## Features

- 🗓️ **Event Management**: Create and manage calendar events
- ⏰ **Smart Alarms**: Set alarms with custom music and wake messages
- 📝 **Reminders**: Never forget important tasks
- 💬 **Multi-platform Messaging**: WhatsApp, SMS, Email integration
- 🎤 **Voice Commands**: Natural language processing
- 📍 **Location Services**: Geofencing, geocoding, route calculation
- 🤖 **MCP (Model Context Protocol)**: Extensible AI capabilities

## Authentication

Most endpoints require JWT authentication. Include the bearer token in the Authorization header:

\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 10 attempts per 15 minutes
- **MCP Execution**: 30 requests per minute
- **Messages**: 20 messages per hour
- **Voice**: 30 requests per hour
- **Location**: 100 requests per hour

## Error Responses

All endpoints return errors in the following format:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message"
  }
}
\`\`\`

## Common Error Codes

- \`UNAUTHORIZED\`: Invalid or missing authentication token
- \`TOKEN_EXPIRED\`: JWT token has expired
- \`VALIDATION_ERROR\`: Request data validation failed
- \`NOT_FOUND\`: Resource not found
- \`RATE_LIMIT_EXCEEDED\`: Too many requests
- \`INTERNAL_ERROR\`: Server error
      `,
      contact: {
        name: 'Kaia Support',
        email: 'support@kaia.app',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
      {
        url: 'https://api.kaia.app',
        description: 'Production server',
      },
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check and API info endpoints',
      },
      {
        name: 'Auth',
        description: 'Authentication and user management',
      },
      {
        name: 'Events',
        description: 'Calendar events management',
      },
      {
        name: 'Reminders',
        description: 'Reminders and notifications',
      },
      {
        name: 'Alarms',
        description: 'Alarm clock management',
      },
      {
        name: 'Contacts',
        description: 'Contact management and synchronization',
      },
      {
        name: 'Messages',
        description: 'Multi-platform messaging (WhatsApp, SMS, Email)',
      },
      {
        name: 'Voice',
        description: 'Voice command processing',
      },
      {
        name: 'Location',
        description: 'Location services, geofencing, and routing',
      },
      {
        name: 'MCPs',
        description: 'Model Context Protocol - Extensible AI capabilities',
      },
      {
        name: 'Users',
        description: 'User profile and preferences',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login',
        },
      },
      schemas: {
        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data',
                },
              },
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
            data: {
              type: 'object',
            },
          },
        },

        // User & Auth
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            email: { type: 'string', example: 'user@example.com' },
            name: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            phone: { type: 'string', example: '+34612345678' },
            birthDate: { type: 'string', format: 'date-time' },
            onboardingCompleted: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        UserPreferences: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            voiceEnabled: { type: 'boolean', example: true },
            voiceGender: { type: 'string', enum: ['MALE', 'FEMALE', 'NEUTRAL'] },
            voiceSpeed: { type: 'number', example: 1.0 },
            pushEnabled: { type: 'boolean', example: true },
            emailEnabled: { type: 'boolean', example: false },
            smsEnabled: { type: 'boolean', example: false },
            language: { type: 'string', example: 'es' },
            timezone: { type: 'string', example: 'Europe/Madrid' },
            locationTrackingEnabled: { type: 'boolean', example: true },
          },
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            expiresIn: { type: 'number', example: 900 },
          },
        },

        // Event
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            userId: { type: 'string' },
            title: { type: 'string', example: 'Team Meeting' },
            description: { type: 'string', example: 'Weekly team sync' },
            type: { type: 'string', example: 'MEETING' },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            allDay: { type: 'boolean', example: false },
            location: { type: 'string', example: 'Office' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Contact
        Contact: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            userId: { type: 'string' },
            name: { type: 'string', example: 'Jane Doe' },
            phoneNumbers: {
              type: 'array',
              items: { type: 'string' },
              example: ['+34612345678'],
            },
            emails: {
              type: 'array',
              items: { type: 'string' },
              example: ['jane@example.com'],
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['work', 'important'],
            },
            hasWhatsApp: { type: 'boolean', example: true },
            messageCount: { type: 'number', example: 42 },
            lastContactAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Message
        Message: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            userId: { type: 'string' },
            contactId: { type: 'string' },
            platform: { type: 'string', enum: ['WHATSAPP', 'SMS', 'EMAIL'] },
            direction: { type: 'string', enum: ['INCOMING', 'OUTGOING'] },
            content: { type: 'string', example: 'Hello!' },
            subject: { type: 'string', example: 'Meeting Reminder' },
            status: { type: 'string', enum: ['SENT', 'DELIVERED', 'READ', 'FAILED'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Voice
        VoiceSession: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            userId: { type: 'string' },
            transcript: { type: 'string', example: 'Create a meeting tomorrow at 10am' },
            intent: { type: 'string', example: 'CREATE_EVENT' },
            entities: { type: 'object' },
            response: { type: 'string', example: 'Event created successfully' },
            confidence: { type: 'number', example: 0.95 },
            successful: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // Location
        LocationLog: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            userId: { type: 'string' },
            latitude: { type: 'number', example: 40.4168 },
            longitude: { type: 'number', example: -3.7038 },
            accuracy: { type: 'number', example: 10 },
            altitude: { type: 'number', example: 650 },
            speed: { type: 'number', example: 0 },
            address: { type: 'string', example: 'Gran Vía, Madrid' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },

        // MCP
        MCP: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cm123abc' },
            name: { type: 'string', example: 'create_event' },
            type: { type: 'string', enum: ['PRECONFIGURED', 'DYNAMIC', 'USER_CREATED'] },
            category: { type: 'string', example: 'PRODUCTIVITY' },
            description: { type: 'string', example: 'Create calendar events' },
            capabilities: {
              type: 'array',
              items: { type: 'string' },
              example: ['create', 'read', 'update'],
            },
            enabled: { type: 'boolean', example: true },
            usageCount: { type: 'number', example: 142 },
            rating: { type: 'number', example: 4.5 },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Token de autenticación requerido',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Request validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid input data',
                },
              },
            },
          },
        },
        RateLimitError: {
          description: 'Too many requests',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Demasiadas solicitudes. Intenta de nuevo en 60 segundos.',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        BearerAuth: [],
      },
    ],
    paths: swaggerPaths,
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'], // Path to the API routes
};

export const swaggerSpec = swaggerJsdoc(options);
