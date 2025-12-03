import { cookies } from 'next/headers';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'default-secret-change-in-production';

function hashToken(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}

export function createToken(): string {
  const payload = {
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000,
  };
  const data = JSON.stringify(payload);
  const signature = hashToken(data + ADMIN_TOKEN_SECRET);
  return Buffer.from(data).toString('base64') + '.' + signature;
}

export function verifyToken(token: string): boolean {
  try {
    const [dataBase64, signature] = token.split('.');
    if (!dataBase64 || !signature) return false;

    const data = Buffer.from(dataBase64, 'base64').toString();
    const expectedSignature = hashToken(data + ADMIN_TOKEN_SECRET);

    if (signature !== expectedSignature) return false;

    const payload = JSON.parse(data);
    if (payload.exp < Date.now()) return false;

    return payload.role === 'admin';
  } catch {
    return false;
  }
}

export async function getAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_token')?.value;
  if (!token) return false;
  return verifyToken(token);
}

export async function setAdminSession(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('admin_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
}
