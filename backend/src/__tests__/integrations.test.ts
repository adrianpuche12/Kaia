import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// Mock de Twilio
jest.mock('twilio', () => {
  const mockCreate = jest.fn() as any;
  mockCreate.mockResolvedValue({
    sid: 'SM_mock_message_sid',
    status: 'sent',
  });

  const mockFetch = jest.fn() as any;
  mockFetch.mockResolvedValue({
    phoneNumber: '+34612345678',
  });

  const mockPhoneNumbers = jest.fn() as any;
  mockPhoneNumbers.mockReturnValue({ fetch: mockFetch });

  return jest.fn().mockImplementation(() => ({
    messages: { create: mockCreate },
    lookups: {
      v1: { phoneNumbers: mockPhoneNumbers },
    },
  }));
});

// Mock de SendGrid
jest.mock('@sendgrid/mail', () => {
  const mockSend = jest.fn() as any;
  mockSend.mockResolvedValue([
    {
      statusCode: 202,
      headers: {
        'x-message-id': 'mock-sendgrid-message-id',
      },
    },
  ]);

  return {
    setApiKey: jest.fn(),
    send: mockSend,
  };
});

import { TwilioClient } from '../integrations/TwilioClient';
import { SendGridClient } from '../integrations/SendGridClient';

describe('TwilioClient Integration', () => {
  let twilioClient: TwilioClient;

  beforeEach(() => {
    const config = {
      accountSid: 'test-account-sid',
      authToken: 'test-auth-token',
      phoneNumber: '+1234567890',
      whatsappNumber: 'whatsapp:+14155238886',
    };
    twilioClient = new TwilioClient(config);
  });

  describe('sendSMS', () => {
    it('should send SMS successfully', async () => {
      const result = await twilioClient.sendSMS({
        to: '+34612345678',
        message: 'Test SMS from Kaia',
      });

      expect(result).toBeDefined();
      expect(result.sid).toBe('SM_mock_message_sid');
      expect(result.status).toBe('sent');
    });

    it('should format phone number with + prefix', async () => {
      const result = await twilioClient.sendSMS({
        to: '34612345678', // Without +
        message: 'Test',
      });

      expect(result).toBeDefined();
      expect(result.sid).toBeTruthy();
    });
  });

  describe('sendWhatsApp', () => {
    it('should send WhatsApp message successfully', async () => {
      const result = await twilioClient.sendWhatsApp({
        to: '+34612345678',
        message: 'Test WhatsApp from Kaia',
      });

      expect(result).toBeDefined();
      expect(result.sid).toBe('SM_mock_message_sid');
      expect(result.status).toBe('sent');
    });

    it('should handle WhatsApp number formatting', async () => {
      const result = await twilioClient.sendWhatsApp({
        to: '34612345678',
        message: 'Test',
      });

      expect(result).toBeDefined();
    });
  });

  describe('validatePhoneNumber', () => {
    it('should validate correct phone number', async () => {
      const isValid = await twilioClient.validatePhoneNumber('+34612345678');

      expect(isValid).toBe(true);
    });

    it('should return false for invalid phone number', async () => {
      // Mock the lookup to throw error
      const twilioMock = require('twilio') as any;
      const mockFetchError = jest.fn() as any;
      mockFetchError.mockRejectedValue(new Error('Invalid phone'));

      const mockPhoneNumbersError = jest.fn() as any;
      mockPhoneNumbersError.mockReturnValue({ fetch: mockFetchError });

      twilioMock.mockImplementationOnce(() => ({
        lookups: {
          v1: { phoneNumbers: mockPhoneNumbersError },
        },
      }));

      const client = new TwilioClient({
        accountSid: 'test',
        authToken: 'test',
        phoneNumber: '+1234567890',
        whatsappNumber: 'whatsapp:+14155238886',
      });

      const isValid = await client.validatePhoneNumber('invalid');

      expect(isValid).toBe(false);
    });
  });
});

describe('SendGridClient Integration', () => {
  let sendGridClient: SendGridClient;

  beforeEach(() => {
    const config = {
      apiKey: 'test-sendgrid-api-key',
      fromEmail: 'noreply@kaia.app',
      fromName: 'Kaia Assistant',
    };
    sendGridClient = new SendGridClient(config);
  });

  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const result = await sendGridClient.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        text: 'Plain text content',
        html: '<p>HTML content</p>',
      });

      expect(result).toBeDefined();
      expect(result.messageId).toBe('mock-sendgrid-message-id');
      expect(result.status).toBe(202);
    });

    it('should send email with multiple recipients', async () => {
      const result = await sendGridClient.sendEmail({
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Email',
        text: 'Content',
      });

      expect(result).toBeDefined();
      expect(result.status).toBe(202);
    });

    it('should send email with CC and BCC', async () => {
      const result = await sendGridClient.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Content',
        cc: ['cc@example.com'],
        bcc: ['bcc@example.com'],
      });

      expect(result).toBeDefined();
    });

    it('should send email with attachments', async () => {
      const result = await sendGridClient.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        text: 'Content',
        attachments: [
          {
            content: 'base64-content',
            filename: 'document.pdf',
            type: 'application/pdf',
          },
        ],
      });

      expect(result).toBeDefined();
    });
  });

  describe('sendTemplateEmail', () => {
    it('should send template email successfully', async () => {
      const result = await sendGridClient.sendTemplateEmail({
        to: 'test@example.com',
        templateId: 'd-1234567890',
        dynamicData: {
          name: 'John Doe',
          confirmationUrl: 'https://example.com/confirm',
        },
      });

      expect(result).toBeDefined();
      expect(result.messageId).toBeTruthy();
      expect(result.status).toBe(202);
    });

    it('should send template with custom subject', async () => {
      const result = await sendGridClient.sendTemplateEmail({
        to: 'test@example.com',
        templateId: 'd-1234567890',
        subject: 'Custom Subject',
        dynamicData: {},
      });

      expect(result).toBeDefined();
    });
  });

  describe('sendBulkEmail', () => {
    it('should send bulk email successfully', async () => {
      const recipients = [
        'user1@example.com',
        'user2@example.com',
        'user3@example.com',
      ];

      const result = await sendGridClient.sendBulkEmail(
        recipients,
        'Newsletter',
        {
          text: 'Newsletter content',
          html: '<p>Newsletter HTML</p>',
        }
      );

      expect(result).toBeDefined();
      expect(result.sent).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle bulk email errors gracefully', async () => {
      const sgMail = require('@sendgrid/mail') as any;
      const mockError = {
        response: {
          body: {
            errors: [{}, {}], // 2 failed
          },
        },
      };
      sgMail.send.mockRejectedValueOnce(mockError);

      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];

      const result = await sendGridClient.sendBulkEmail(
        recipients,
        'Subject',
        { text: 'Content' }
      );

      expect(result.sent).toBe(1); // 3 - 2 = 1
      expect(result.failed).toBe(2);
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email', async () => {
      const isValid = await sendGridClient.validateEmail('test@example.com');

      expect(isValid).toBe(true);
    });

    it('should reject invalid email', async () => {
      const isValid = await sendGridClient.validateEmail('invalid-email');

      expect(isValid).toBe(false);
    });
  });

  describe('createHTMLEmail', () => {
    it('should create HTML email with title and content', () => {
      const html = sendGridClient.createHTMLEmail({
        title: 'Welcome to Kaia',
        content: 'Thank you for joining!',
      });

      expect(html).toContain('Welcome to Kaia');
      expect(html).toContain('Thank you for joining!');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('should create HTML email with action button', () => {
      const html = sendGridClient.createHTMLEmail({
        title: 'Confirm Email',
        content: 'Please confirm your email address.',
        actionButton: {
          text: 'Confirm Email',
          url: 'https://example.com/confirm',
        },
      });

      expect(html).toContain('Confirm Email');
      expect(html).toContain('https://example.com/confirm');
      expect(html).toContain('<a href=');
    });

    it('should include Kaia branding', () => {
      const html = sendGridClient.createHTMLEmail({
        title: 'Test',
        content: 'Content',
      });

      expect(html).toContain('Kaia Assistant');
    });
  });
});

describe('Integration Error Handling', () => {
  describe('TwilioClient errors', () => {
    it('should throw descriptive error on send failure', async () => {
      const twilioMock = require('twilio') as any;
      const mockCreateError = jest.fn() as any;
      mockCreateError.mockRejectedValue(new Error('Twilio API error'));

      twilioMock.mockImplementationOnce(() => ({
        messages: { create: mockCreateError },
      }));

      const client = new TwilioClient({
        accountSid: 'test',
        authToken: 'test',
        phoneNumber: '+1234567890',
        whatsappNumber: 'whatsapp:+14155238886',
      });

      await expect(
        client.sendSMS({ to: '+34612345678', message: 'Test' })
      ).rejects.toThrow('Failed to send SMS');
    });
  });

  describe('SendGridClient errors', () => {
    it('should throw descriptive error on send failure', async () => {
      const sgMail = require('@sendgrid/mail') as any;
      const mockError = {
        message: 'SendGrid API error',
        response: {
          body: { errors: ['API key invalid'] },
        },
      };
      sgMail.send.mockRejectedValueOnce(mockError);

      const client = new SendGridClient({
        apiKey: 'invalid-key',
        fromEmail: 'test@example.com',
        fromName: 'Test',
      });

      await expect(
        client.sendEmail({
          to: 'test@example.com',
          subject: 'Test',
          text: 'Content',
        })
      ).rejects.toThrow('Failed to send email');
    });
  });
});
