import { Context, Next } from 'hono';
import jwt from 'jsonwebtoken';
import { HTTPException } from 'hono/http-exception';

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, c.env.JWT_SECRET);
    c.set('user', decoded);
    await next();
  } catch (error) {
    throw new HTTPException(401, { message: 'Invalid token' });
  }
}

export async function adminMiddleware(c: Context, next: Next) {
  const apiKey = c.req.header('X-API-Key');
  
  if (!apiKey || apiKey !== c.env.ADMIN_API_KEY) {
    throw new HTTPException(401, { message: 'Invalid API key' });
  }
  
  await next();
} 