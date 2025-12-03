import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createToken, setAdminSession } from '@/lib/auth/admin';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password required' },
        { status: 400 }
      );
    }

    const valid = await verifyCredentials(username, password);

    if (!valid) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const token = createToken();
    await setAdminSession(token);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
