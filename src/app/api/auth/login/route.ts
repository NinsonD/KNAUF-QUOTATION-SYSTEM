import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { setAuthCookie } from '@/lib/auth/session';
import { UserRole } from '@/lib/auth/permissions';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const authUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      avatarUrl: user.avatarUrl,
    };

    const response = NextResponse.json({
      success: true,
      user: authUser,
    });

    setAuthCookie(response, authUser);
    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
