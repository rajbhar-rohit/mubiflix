import { NextResponse } from 'next/server';
import { auth } from '@/lib/firebase-admin';

const COOKIE_NAME = 'session';
const MAX_AGE = 60 * 60 * 24 * 5; // 5 days

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    // Verify the ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const user = await auth.getUser(decodedToken.uid);

    // Check if user has admin role
    const isAdmin = user.customClaims?.admin === true;
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Create session cookie
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: MAX_AGE * 1000, // Convert to milliseconds
    });

    // Return the session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, sessionCookie, {
      maxAge: MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Session creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 