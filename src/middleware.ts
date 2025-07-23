import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './lib/firebase-admin';

export async function middleware(request: NextRequest) {
  const session = request.cookies.get('session')?.value;

  // Return to /login if no session exists
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Verify the session cookie and check if user has admin role
    const decodedClaims = await auth.verifySessionCookie(session, true);
    const user = await auth.getUser(decodedClaims.uid);
    
    // Check if user has admin custom claim
    const isAdmin = user.customClaims?.admin === true;
    
    if (!isAdmin) {
      // Clear the session cookie if user is not an admin
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Clear the session cookie if it's invalid
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('session');
    return response;
  }
}

// Protect all routes under /dashboard
export const config = {
  matcher: '/dashboard/:path*',
}; 