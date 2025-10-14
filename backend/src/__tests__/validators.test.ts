import { describe, it, expect } from '@jest/globals';
import {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidISODate,
  schemas,
  validate,
  validateSafe,
} from '../utils/validators';

describe('Validators - Email', () => {
  it('should validate correct email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('test+tag@gmail.com')).toBe(true);
  });

  it('should reject invalid email addresses', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('test @example.com')).toBe(false);
  });
});

describe('Validators - Password', () => {
  it('should validate correct passwords', () => {
    expect(isValidPassword('Test1234')).toBe(true);
    expect(isValidPassword('MyPass123')).toBe(true);
    expect(isValidPassword('Secure@Pass1')).toBe(true);
  });

  it('should reject invalid passwords', () => {
    expect(isValidPassword('short1')).toBe(false); // Too short
    expect(isValidPassword('nouppercas1')).toBe(false); // No uppercase
    expect(isValidPassword('NOLOWERCASE1')).toBe(false); // No lowercase
    expect(isValidPassword('NoNumbers')).toBe(false); // No numbers
  });
});

describe('Validators - Phone', () => {
  it('should validate correct phone numbers', () => {
    expect(isValidPhone('+34612345678')).toBe(true);
    expect(isValidPhone('+1234567890')).toBe(true);
    expect(isValidPhone('+447911123456')).toBe(true);
  });

  it('should reject invalid phone numbers', () => {
    expect(isValidPhone('invalid')).toBe(false);
    expect(isValidPhone('+0123456789')).toBe(false); // Starts with 0 after +
    expect(isValidPhone('1')).toBe(false); // Too short (only 1 digit)
    expect(isValidPhone('+12345678901234567')).toBe(false); // Too long (more than 15 digits)
  });
});

describe('Validators - ISO Date', () => {
  it('should validate correct ISO dates', () => {
    expect(isValidISODate('2025-10-10T21:00:00Z')).toBe(true);
    expect(isValidISODate('2025-01-01T00:00:00.000Z')).toBe(true);
    expect(isValidISODate('2025-12-31T23:59:59Z')).toBe(true);
  });

  it('should reject invalid dates', () => {
    expect(isValidISODate('invalid')).toBe(false);
    expect(isValidISODate('2025-13-01')).toBe(false); // Invalid month
    expect(isValidISODate('')).toBe(false);
  });
});

describe('Zod Schemas - Register', () => {
  it('should validate correct register data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Test1234',
      name: 'John',
      lastName: 'Doe',
      phone: '+34612345678',
      birthDate: '1990-01-01T00:00:00Z',
    };

    expect(() => validate(schemas.register, validData)).not.toThrow();
  });

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'Test1234',
      name: 'John',
    };

    expect(() => validate(schemas.register, invalidData)).toThrow();
  });

  it('should reject weak password', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'weak',
      name: 'John',
    };

    expect(() => validate(schemas.register, invalidData)).toThrow();
  });

  it('should reject short name', () => {
    const invalidData = {
      email: 'test@example.com',
      password: 'Test1234',
      name: 'J', // Too short
    };

    expect(() => validate(schemas.register, invalidData)).toThrow();
  });
});

describe('Zod Schemas - Login', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'test@example.com',
      password: 'Test1234',
    };

    expect(() => validate(schemas.login, validData)).not.toThrow();
  });

  it('should reject missing password', () => {
    const invalidData = {
      email: 'test@example.com',
    };

    expect(() => validate(schemas.login, invalidData as any)).toThrow();
  });
});

describe('Zod Schemas - Create Event', () => {
  it('should validate correct event data', () => {
    const validData = {
      title: 'Meeting',
      description: 'Team meeting',
      type: 'MEETING',
      startTime: '2025-10-15T10:00:00Z',
      endTime: '2025-10-15T11:00:00Z',
      location: 'Office',
      allDay: false,
    };

    expect(() => validate(schemas.createEvent, validData)).not.toThrow();
  });

  it('should reject missing title', () => {
    const invalidData = {
      startTime: '2025-10-15T10:00:00Z',
    };

    expect(() => validate(schemas.createEvent, invalidData as any)).toThrow();
  });

  it('should reject title too long', () => {
    const invalidData = {
      title: 'A'.repeat(201), // Exceeds 200 char limit
      startTime: '2025-10-15T10:00:00Z',
    };

    expect(() => validate(schemas.createEvent, invalidData)).toThrow();
  });
});

describe('Zod Schemas - Send Message', () => {
  it('should validate WhatsApp message', () => {
    const validData = {
      platform: 'WHATSAPP',
      to: '+34612345678',
      content: 'Hello from Kaia!',
    };

    expect(() => validate(schemas.sendMessage, validData)).not.toThrow();
  });

  it('should validate Email message with subject', () => {
    const validData = {
      platform: 'EMAIL',
      to: 'test@example.com',
      subject: 'Test Email',
      content: 'Email content',
    };

    expect(() => validate(schemas.sendMessage, validData)).not.toThrow();
  });

  it('should validate SMS message', () => {
    const validData = {
      platform: 'SMS',
      to: '+34612345678',
      content: 'SMS content',
    };

    expect(() => validate(schemas.sendMessage, validData)).not.toThrow();
  });

  it('should reject invalid platform', () => {
    const invalidData = {
      platform: 'INVALID',
      to: '+34612345678',
      content: 'Message',
    };

    expect(() => validate(schemas.sendMessage, invalidData as any)).toThrow();
  });

  it('should require at least one destination (to, contactId, or contactName)', () => {
    const invalidData = {
      platform: 'WHATSAPP',
      content: 'Message without destination',
    };

    expect(() => validate(schemas.sendMessage, invalidData)).toThrow();
  });
});

describe('validateSafe function', () => {
  it('should return success for valid data', () => {
    const result = validateSafe(schemas.login, {
      email: 'test@example.com',
      password: 'Test1234',
    });

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.errors).toBeUndefined();
  });

  it('should return errors for invalid data', () => {
    const result = validateSafe(schemas.login, {
      email: 'invalid-email',
      password: '',
    });

    expect(result.success).toBe(false);
    expect(result.data).toBeUndefined();
    expect(result.errors).toBeDefined();
    expect(result.errors?.length).toBeGreaterThan(0);
  });

  it('should return detailed error messages', () => {
    const result = validateSafe(schemas.register, {
      email: 'invalid',
      password: 'weak',
      name: 'J',
    });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();

    // Should have errors for email, password, and name
    const fields = result.errors?.map(e => e.field);
    expect(fields).toContain('email');
    expect(fields).toContain('password');
    expect(fields).toContain('name');
  });
});

describe('Zod Schemas - Location', () => {
  it('should validate location update', () => {
    const validData = {
      latitude: 40.4168,
      longitude: -3.7038,
      accuracy: 10.5,
      altitude: 667,
      speed: 0,
      heading: 0,
    };

    expect(() => validate(schemas.updateLocation, validData)).not.toThrow();
  });

  it('should reject latitude out of range', () => {
    const invalidData = {
      latitude: 91, // Out of range
      longitude: -3.7038,
    };

    expect(() => validate(schemas.updateLocation, invalidData)).toThrow();
  });

  it('should reject longitude out of range', () => {
    const invalidData = {
      latitude: 40.4168,
      longitude: -181, // Out of range
    };

    expect(() => validate(schemas.updateLocation, invalidData)).toThrow();
  });
});

describe('Zod Schemas - Voice', () => {
  it('should validate voice command', () => {
    const validData = {
      transcript: 'Create a meeting tomorrow at 10am',
      language: 'es',
      confidence: 0.95,
      duration: 4.2,
    };

    expect(() => validate(schemas.processVoice, validData)).not.toThrow();
  });

  it('should reject empty transcript', () => {
    const invalidData = {
      transcript: '',
      language: 'es',
    };

    expect(() => validate(schemas.processVoice, invalidData)).toThrow();
  });

  it('should reject transcript too long', () => {
    const invalidData = {
      transcript: 'A'.repeat(5001), // Exceeds 5000 char limit
    };

    expect(() => validate(schemas.processVoice, invalidData)).toThrow();
  });
});
