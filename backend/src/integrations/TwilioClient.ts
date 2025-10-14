import twilio from 'twilio';

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
  whatsappNumber: string;
}

export interface SMSOptions {
  to: string;
  message: string;
}

export interface WhatsAppOptions {
  to: string;
  message: string;
}

export class TwilioClient {
  private client: twilio.Twilio;
  private config: TwilioConfig;

  constructor(config: TwilioConfig) {
    this.config = config;
    this.client = twilio(config.accountSid, config.authToken);
  }

  /**
   * Enviar SMS
   */
  async sendSMS(options: SMSOptions): Promise<{ sid: string; status: string }> {
    try {
      const message = await this.client.messages.create({
        body: options.message,
        from: this.config.phoneNumber,
        to: this.formatPhoneNumber(options.to)
      });

      return {
        sid: message.sid,
        status: message.status
      };
    } catch (error: any) {
      console.error('Twilio SMS Error:', error.message);
      throw new Error(`Failed to send SMS: ${error.message}`);
    }
  }

  /**
   * Enviar WhatsApp
   */
  async sendWhatsApp(options: WhatsAppOptions): Promise<{ sid: string; status: string }> {
    try {
      const message = await this.client.messages.create({
        body: options.message,
        from: this.config.whatsappNumber,
        to: `whatsapp:${this.formatPhoneNumber(options.to)}`
      });

      return {
        sid: message.sid,
        status: message.status
      };
    } catch (error: any) {
      console.error('Twilio WhatsApp Error:', error.message);
      throw new Error(`Failed to send WhatsApp: ${error.message}`);
    }
  }

  /**
   * Validar número de teléfono
   */
  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      const lookup = await this.client.lookups.v1
        .phoneNumbers(this.formatPhoneNumber(phoneNumber))
        .fetch();

      return !!lookup.phoneNumber;
    } catch (error) {
      return false;
    }
  }

  /**
   * Formatear número de teléfono (asegurar que tenga +)
   */
  private formatPhoneNumber(phone: string): string {
    // Si ya tiene +, retornar tal cual
    if (phone.startsWith('+')) {
      return phone;
    }
    // Si empieza con número, agregar +
    return `+${phone}`;
  }

  /**
   * Obtener estado de mensaje
   */
  async getMessageStatus(messageSid: string): Promise<string> {
    try {
      const message = await this.client.messages(messageSid).fetch();
      return message.status;
    } catch (error: any) {
      console.error('Get message status error:', error.message);
      throw new Error(`Failed to get message status: ${error.message}`);
    }
  }
}

// Singleton instance
let twilioClient: TwilioClient | null = null;

export function getTwilioClient(): TwilioClient {
  if (!twilioClient) {
    const config: TwilioConfig = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886'
    };

    // Validar configuración
    if (!config.accountSid || !config.authToken) {
      throw new Error('Twilio credentials not configured');
    }

    twilioClient = new TwilioClient(config);
  }

  return twilioClient;
}
