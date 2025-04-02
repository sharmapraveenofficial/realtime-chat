import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  // Send mail
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || '"ChatFace" <sharmapraveenofficial@gmail.com>',
    to,
    subject,
    html
  });
  
  console.log('Email sent:', info.messageId);
  return info;
} 