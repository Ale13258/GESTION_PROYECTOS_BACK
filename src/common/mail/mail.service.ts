import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Role } from '../constants';

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrador',
  collaborator: 'Colaborador',
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly config: ConfigService) {}

  async sendInviteEmail(input: {
    to: string;
    name: string;
    role: Role;
    inviteUrl: string;
    expiresAt: Date;
  }): Promise<boolean> {
    const subject = 'Te invitaron a ProManage Engineering';
    const roleLabel = ROLE_LABEL[input.role] ?? input.role;
    const firstName = input.name.trim().split(/\s+/)[0] || input.name;
    const expires = input.expiresAt.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const text = [
      `Hola ${firstName},`,
      '',
      'Te invitaron a ProManage Engineering, la plataforma de gestión de proyectos de ingeniería.',
      `Rol asignado: ${roleLabel}.`,
      '',
      'Para entrar, crea tu contraseña con el botón del correo o abre el enlace de activación.',
      `El acceso vence el ${expires}.`,
      '',
      'Si no esperabas este mensaje, puedes ignorarlo.',
      '',
      'ProManage Engineering',
    ].join('\n');
    const html = `
      <div style="margin:0;padding:24px 12px;background:#f4f7fb;font-family:Arial,Helvetica,sans-serif;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e8eef5;border-radius:16px;overflow:hidden">
          <tr>
            <td style="background:#071a2f;padding:22px 28px">
              <p style="margin:0;color:#7dd3fc;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700">ProManage</p>
              <p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:700">ENGINEERING</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px">
              <p style="margin:0 0 8px;color:#0f2744;font-size:20px;font-weight:700">Hola ${escapeHtml(firstName)},</p>
              <p style="margin:0 0 16px;color:#334155;font-size:15px;line-height:1.55">
                Te invitaron a <strong>ProManage Engineering</strong> para gestionar proyectos, inventario y aprobaciones.
              </p>
              <p style="margin:0 0 22px;color:#334155;font-size:15px;line-height:1.55">
                Tu rol es <strong style="color:#1a4f86">${escapeHtml(roleLabel)}</strong>. Crea tu contraseña para activar el acceso.
              </p>
              <p style="margin:0 0 22px">
                <a href="${escapeHtml(input.inviteUrl)}"
                   style="display:inline-block;background:#1a4f86;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;font-size:14px">
                  Crear contraseña
                </a>
              </p>
              <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5">
                El enlace vence el ${escapeHtml(expires)}. Si no esperabas este correo, ignóralo.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;

    try {
      const sent = await this.send(input.to, subject, text, html);
      if (!sent) {
        this.logger.warn(`Correo de invitación no enviado a ${input.to}. Enlace: ${input.inviteUrl}`);
      }
      return sent;
    } catch (error) {
      this.logger.error(`No se pudo enviar la invitación a ${input.to}`, error as Error);
      this.logger.warn(`Enlace de invitación: ${input.inviteUrl}`);
      return false;
    }
  }

  private async send(to: string, subject: string, text: string, html: string): Promise<boolean> {
    const host = this.config.get<string>('SMTP_HOST')?.trim();
    if (!host) return false;

    const port = Number(this.config.get<string>('SMTP_PORT', '587'));
    const user = this.config.get<string>('SMTP_USER')?.trim();
    const pass = (this.config.get<string>('SMTP_PASS') ?? '').replace(/\s+/g, '');
    const from =
      this.config.get<string>('MAIL_FROM')?.trim() ||
      user ||
      'ProManage Engineering <noreply@promanage.local>';

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      requireTLS: port === 587,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 8_000,
      greetingTimeout: 8_000,
      socketTimeout: 12_000,
    });

    try {
      await transporter.sendMail({
        from: user ? `ProManage Engineering <${user}>` : from,
        to,
        subject,
        text,
        html,
      });
      this.logger.log(`Invitación enviada a ${to}`);
      return true;
    } finally {
      transporter.close();
    }
  }

  isConfigured(): boolean {
    return Boolean(this.config.get<string>('SMTP_HOST')?.trim());
  }

  queueInviteEmail(input: {
    to: string;
    name: string;
    role: Role;
    inviteUrl: string;
    expiresAt: Date;
  }): void {
    void this.sendInviteEmail(input).catch((error) => {
      this.logger.error(`Invitación en segundo plano falló para ${input.to}`, error as Error);
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
