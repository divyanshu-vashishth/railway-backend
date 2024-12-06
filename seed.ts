import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from 'bcryptjs';
import { users, trains, UserRole } from "./src/db/schema";

config({ path: ".dev.vars" });

const sql = postgres(process.env.DATABASE_URL ?? "");
const db = drizzle(sql);

async function seedDatabase() {
  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await db.insert(users).values({
    name: 'Admin User',
    email: 'admin@example.com',
    password: hashedPassword,
    role: UserRole.ADMIN,
  });

  // Create some sample trains
  await db.insert(trains).values([
    {
      name: 'Express 101',
      source: 'Mumbai',
      destination: 'Delhi',
      totalSeats: 100,
      departureTime: new Date('2024-03-20T10:00:00Z'),
      arrivalTime: new Date('2024-03-20T22:00:00Z'),
    },
    {
      name: 'Superfast 202',
      source: 'Bangalore',
      destination: 'Chennai',
      totalSeats: 80,
      departureTime: new Date('2024-03-21T08:00:00Z'),
      arrivalTime: new Date('2024-03-21T14:00:00Z'),
    },
  ]);
}

async function main() {
  try {
    await seedDatabase();
    console.log("✅ Database seeded successfully!");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
