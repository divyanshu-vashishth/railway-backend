import { instrument } from "@fiberplane/hono-otel";
import { drizzle } from "drizzle-orm/postgres-js";
import { and, eq } from 'drizzle-orm';
import { Hono } from "hono";
import { cors } from 'hono/cors';
import { sign } from 'jsonwebtoken';
import { logger } from 'hono/logger';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import postgres from "postgres";
import bcrypt from 'bcryptjs';
import { HTTPException } from 'hono/http-exception';

import { authMiddleware, adminMiddleware } from './middleware/auth';
import { 
  users, 
  trains, 
  bookings, 
  seatAvailability,
  insertUserSchema,
  insertTrainSchema,
  UserRole,
  type User
} from "./db/schema";

type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  ADMIN_API_KEY: string;
};

type AuthUser = {
  id: number;
  role: string;
};

const app = new Hono<{ 
  Bindings: Bindings;
  Variables: {
    user: AuthUser;
  };
}>();

app.use('*', logger());
app.use('*', cors());

const getDb = (c: any) => {
  const sql = postgres(c.env.DATABASE_URL);
  return drizzle(sql);
};

app.post('/api/register', zValidator('json', insertUserSchema), async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  const hashedPassword = await bcrypt.hash(body.password, 10);

  try {
    const newUser = await db.insert(users).values({
      ...body,
      password: hashedPassword,
    }).returning();

    return c.json({ 
      message: 'User registered successfully',
      user: { ...newUser[0], password: undefined }
    });
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      throw new HTTPException(400, { message: 'Email already exists' });
    }
    throw error;
  }
});

app.post('/api/login', async (c) => {
  const db = getDb(c);
  const { email, password } = await c.req.json();

  const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user[0] || !(await bcrypt.compare(password, user[0].password))) {
    throw new HTTPException(401, { message: 'Invalid credentials' });
  }

  const token = sign({ 
    id: user[0].id,
    role: user[0].role 
  }, c.env.JWT_SECRET);

  return c.json({ token });
});

app.post('/api/admin/trains', adminMiddleware, zValidator('json', insertTrainSchema), async (c) => {
  const db = getDb(c);
  const body = await c.req.json();

  const newTrain = await db.insert(trains).values(body).returning();
  
  await db.insert(seatAvailability).values({
    trainId: newTrain[0].id,
    source: newTrain[0].source,
    destination: newTrain[0].destination,
    availableSeats: newTrain[0].totalSeats,
  });

  return c.json({ 
    message: 'Train added successfully',
    train: newTrain[0]
  });
});

app.get('/api/trains/availability', async (c) => {
  const db = getDb(c);
  const { source, destination } = c.req.query();

  if (!source || !destination) {
    throw new HTTPException(400, { message: 'Source and destination are required' });
  }

  const availableTrains = await db
    .select()
    .from(trains)
    .innerJoin(
      seatAvailability,
      and(
        eq(seatAvailability.trainId, trains.id),
        eq(seatAvailability.source, source),
        eq(seatAvailability.destination, destination)
      )
    );

  return c.json({ trains: availableTrains });
});

app.post('/api/bookings', authMiddleware, async (c) => {
  const db = getDb(c);
  const { trainId } = await c.req.json();
  const user = c.get('user');

  const result = await db.transaction(async (tx) => {
    const availability = await tx
      .select()
      .from(seatAvailability)
      .where(eq(seatAvailability.trainId, trainId))
      .limit(1);

    if (!availability[0] || availability[0].availableSeats <= 0) {
      throw new HTTPException(400, { message: 'No seats available' });
    }

    const [booking] = await tx.insert(bookings).values({
      userId: user.id,
      trainId,
      seatNumber: availability[0].availableSeats + 1,
    }).returning();

    await tx
      .update(seatAvailability)
      .set({ availableSeats: availability[0].availableSeats - 1 })
      .where(eq(seatAvailability.id, availability[0].id));

    return booking;
  });

  return c.json({ 
    message: 'Booking successful',
    booking: result
  });
});

app.get('/api/bookings/:id', authMiddleware, async (c) => {
  const db = getDb(c);
  const bookingId = c.req.param('id');
  const user = c.get('user');

  const booking = await db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.id, bookingId),
        eq(bookings.userId, user.id)
      )
    )
    .innerJoin(trains, eq(trains.id, bookings.trainId))
    .limit(1);

  if (!booking[0]) {
    throw new HTTPException(404, { message: 'Booking not found' });
  }

  return c.json({ booking: booking[0] });
});

export default instrument(app);
