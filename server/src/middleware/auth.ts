/**
 * @file middleware/auth.ts
 * @description JWT-based authentication middleware for protected admin routes.
 *
 * How it works:
 *  1. The client obtains a signed JWT by posting credentials to POST /api/admin/login.
 *  2. On subsequent requests to protected routes, the client includes the token in
 *     the Authorization header as a Bearer token:
 *       Authorization: Bearer <token>
 *  3. `requireAuth` intercepts the request, validates the token against the
 *     JWT_SECRET environment variable, and either:
 *       - Attaches the decoded payload to `req.admin` and calls `next()`, or
 *       - Responds with 401 Unauthorized and halts the middleware chain.
 *
 * Security notes:
 *  - JWT_SECRET must be a long, random, secret value in production.
 *    A weak or missing secret would allow an attacker to forge admin tokens.
 *  - Tokens expire after 24 hours (set at sign-time in the login route).
 *    `jwt.verify` checks expiry automatically; no extra logic is needed here.
 *  - Using `req.headers.authorization` (not cookies) means the token is
 *    never sent automatically by the browser, which eliminates CSRF risk for
 *    these endpoints.
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// ---------------------------------------------------------------------------
// Extended request type
// ---------------------------------------------------------------------------

/**
 * Extends Express's Request interface to carry the authenticated admin payload.
 *
 * After `requireAuth` succeeds, downstream route handlers can safely access
 * `req.admin.username` without null-checking because the middleware would have
 * already rejected the request if the token were missing or invalid.
 */
export interface AuthRequest extends Request {
  /** Present only after `requireAuth` has verified a valid token. */
  admin?: { username: string }
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

/**
 * Express middleware that enforces JWT authentication on a route or router.
 *
 * Mount this before any route handler that should be accessible only to
 * authenticated administrators:
 *
 *   router.get('/bookings', requireAuth, async (req: AuthRequest, res) => { ... })
 *
 * On success, the verified JWT payload is attached to `req.admin` and the
 * next handler in the chain is invoked.
 *
 * On failure (missing header, malformed token, wrong secret, expired token),
 * the function responds with HTTP 401 and returns without calling `next()`,
 * so the protected handler is never reached.
 *
 * @param req  - The incoming HTTP request (typed as AuthRequest to allow
 *               `req.admin` assignment).
 * @param res  - The outgoing HTTP response used to send 401 errors.
 * @param next - Express's next-middleware callback; called only on success.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Read the Authorization header value, e.g. "Bearer eyJhbGci..."
  const auth = req.headers.authorization

  // Reject immediately if the header is absent or doesn't follow the Bearer scheme.
  // This covers both unauthenticated requests and clients that send credentials
  // in the wrong format (e.g. Basic auth).
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    // Strip the "Bearer " prefix (7 characters) to isolate the raw JWT string.
    // jwt.verify both decodes AND validates the token:
    //   - Signature check: ensures the token was signed with JWT_SECRET.
    //   - Expiry check:    rejects tokens whose `exp` claim is in the past.
    //   - Structure check: throws if the token is malformed.
    const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as { username: string }

    // Attach the decoded payload to the request object so downstream handlers
    // can access the authenticated username without re-decoding the token.
    req.admin = payload

    // Proceed to the next middleware or route handler.
    next()
  } catch {
    // jwt.verify throws JsonWebTokenError, TokenExpiredError, etc.
    // We catch all of them and return a single generic error message to avoid
    // leaking details about why validation failed (e.g. "expired" vs "invalid").
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}
