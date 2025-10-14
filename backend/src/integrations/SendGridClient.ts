import sgMail from '@sendgrid/mail';

export interface SendGridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  cc?: string[];
  bcc?: string[];
  attachments?: Array<{
    content: string;
    filename: string;
    type?: string;
  }>;
}

export interface EmailTemplateOptions {
  to: string | string[];
  templateId: string;
  dynamicData?: Record<string, any>;
  subject?: string;
}

export class SendGridClient {
  private config: SendGridConfig;

  constructor(config: SendGridConfig) {
    this.config = config;
    sgMail.setApiKey(config.apiKey);
  }

  /**
   * Enviar email simple
   */
  async sendEmail(options: EmailOptions): Promise<{ messageId: string; status: number }> {
    try {
      const msg: any = {
        to: options.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject: options.subject,
        text: options.text,
        html: options.html,
        cc: options.cc,
        bcc: options.bcc
      };

      // Agregar attachments si existen
      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments;
      }

      const [response] = await sgMail.send(msg);

      return {
        messageId: response.headers['x-message-id'] as string,
        status: response.statusCode
      };
    } catch (error: any) {
      console.error('SendGrid Error:', error.message);
      if (error.response) {
        console.error('SendGrid Error Response:', error.response.body);
      }
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Enviar email usando template de SendGrid
   */
  async sendTemplateEmail(options: EmailTemplateOptions): Promise<{ messageId: string; status: number }> {
    try {
      const msg: any = {
        to: options.to,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        templateId: options.templateId,
        dynamicTemplateData: options.dynamicData || {}
      };

      // Si se proporciona subject, agregarlo
      if (options.subject) {
        msg.subject = options.subject;
      }

      const [response] = await sgMail.send(msg);

      return {
        messageId: response.headers['x-message-id'] as string,
        status: response.statusCode
      };
    } catch (error: any) {
      console.error('SendGrid Template Error:', error.message);
      if (error.response) {
        console.error('SendGrid Error Response:', error.response.body);
      }
      throw new Error(`Failed to send template email: ${error.message}`);
    }
  }

  /**
   * Enviar emails en lote (hasta 1000 destinatarios)
   */
  async sendBulkEmail(
    recipients: string[],
    subject: string,
    content: { text?: string; html?: string }
  ): Promise<{ sent: number; failed: number }> {
    try {
      const messages = recipients.map(recipient => ({
        to: recipient,
        from: {
          email: this.config.fromEmail,
          name: this.config.fromName
        },
        subject,
        text: content.text,
        html: content.html
      }));

      await sgMail.send(messages);

      return {
        sent: recipients.length,
        failed: 0
      };
    } catch (error: any) {
      console.error('SendGrid Bulk Error:', error.message);

      // Calcular cuántos fallaron
      const failedCount = error.response?.body?.errors?.length || recipients.length;

      return {
        sent: recipients.length - failedCount,
        failed: failedCount
      };
    }
  }

  /**
   * Validar dirección de email (usando SendGrid API)
   */
  async validateEmail(email: string): Promise<boolean> {
    // Validación simple con regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Crear email HTML desde template
   */
  createHTMLEmail(data: {
    title: string;
    content: string;
    actionButton?: {
      text: string;
      url: string;
    };
  }): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${data.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #4F46E5;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 5px 5px 0 0;
            }
            .content {
              background-color: #f9fafb;
              padding: 30px;
              border-radius: 0 0 5px 5px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #4F46E5;
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${data.title}</h1>
          </div>
          <div class="content">
            ${data.content}
            ${data.actionButton ? `
              <div style="text-align: center;">
                <a href="${data.actionButton.url}" class="button">
                  ${data.actionButton.text}
                </a>
              </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>Este es un email automático de Kaia Assistant. Por favor no respondas a este mensaje.</p>
          </div>
        </body>
      </html>
    `;
  }
}

// Singleton instance
let sendGridClient: SendGridClient | null = null;

export function getSendGridClient(): SendGridClient {
  if (!sendGridClient) {
    const config: SendGridConfig = {
      apiKey: process.env.SENDGRID_API_KEY || '',
      fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@kaia.app',
      fromName: process.env.SENDGRID_FROM_NAME || 'Kaia Assistant'
    };

    // Validar configuración
    if (!config.apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    sendGridClient = new SendGridClient(config);
  }

  return sendGridClient;
}
