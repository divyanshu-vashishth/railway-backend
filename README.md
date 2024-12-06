# Train Booking System API Documentation

A RESTful API for managing train bookings, built with Hono.js and PostgreSQL.

## Base URL
```
https://api.trainsystem.com/api
```

## Authentication

### JWT Authentication
Most endpoints require JWT authentication. Include the token in the Authorization header:
```http
Authorization: Bearer <your_token>
```

### Admin API Key
Admin endpoints require an API key. Include it in the header:
```http
X-API-Key: <admin_api_key>
```

## Endpoints

### Authentication

#### Register User
```http
POST /register
```

Creates a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "user"  
}
```

**Response (200 OK):**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

#### Login
```http
POST /login
```

Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Trains

#### Add New Train (Admin Only)
```http
POST /admin/trains
```

Adds a new train to the system.

**Headers:**
```http
X-API-Key: <admin_api_key>
```

**Request Body:**
```json
{
  "name": "Express 101",
  "source": "Mumbai",
  "destination": "Delhi",
  "totalSeats": 100,
  "departureTime": "2024-03-20T10:00:00Z",
  "arrivalTime": "2024-03-20T22:00:00Z"
}
```

**Response (200 OK):**
```json
{
  "message": "Train added successfully",
  "train": {
    "id": 1,
    "name": "Express 101",
    "source": "Mumbai",
    "destination": "Delhi",
    "totalSeats": 100,
    "departureTime": "2024-03-20T10:00:00Z",
    "arrivalTime": "2024-03-20T22:00:00Z"
  }
}
```

#### Check Train Availability
```http
GET /trains/availability?source=Mumbai&destination=Delhi
```

Checks available trains between two stations.

**Query Parameters:**
- `source`: Source station (required)
- `destination`: Destination station (required)

**Response (200 OK):**
```json
{
  "trains": [
    {
      "id": 1,
      "name": "Express 101",
      "source": "Mumbai",
      "destination": "Delhi",
      "availableSeats": 95,
      "departureTime": "2024-03-20T10:00:00Z",
      "arrivalTime": "2024-03-20T22:00:00Z"
    }
  ]
}
```

### Bookings

#### Book a Seat
```http
POST /bookings
```

Books a seat on a train. Requires authentication.

**Headers:**
```http
Authorization: Bearer <your_token>
```

**Request Body:**
```json
{
  "trainId": 1
}
```

**Response (200 OK):**
```json
{
  "message": "Booking successful",
  "booking": {
    "id": "uuid",
    "userId": 1,
    "trainId": 1,
    "seatNumber": 5,
    "bookingStatus": "confirmed",
    "createdAt": "2024-03-15T10:30:00Z"
  }
}
```

#### Get Booking Details
```http
GET /bookings/:id
```

This is a project created with the `create-honc-app` template.

Learn more about the HONC stack on the [website](https://honc.dev) or the main [repo](https://github.com/fiberplane/create-honc-app).

### Getting started

Make sure you have Supabase set up and configured with your database. Create a .dev.vars file with the `DATABASE_URL` key and value (see: `.dev.vars.example`).

### Project structure

```#
├── src
│   ├── index.ts # Hono app entry point
│   └── db
│       └── schema.ts # Database schema
├── seed.ts # Optional seeding script
├── .dev.vars.example # Example .dev.vars file
├── wrangler.toml # Cloudflare Workers configuration
├── drizzle.config.ts # Drizzle configuration
├── tsconfig.json # TypeScript configuration
└── package.json
```

### Commands

Run the migrations and (optionally) seed the database:

```sh
npm run db:setup
```

Run the development server:

```sh
npm run dev
```

### Developing

When you iterate on the database schema, you'll need to generate a new migration and apply it:

```sh
npm run db:generate
npm run db:migrate
```

### Deploying

Set your `DATABASE_URL` secret (and any other secrets you need) with wrangler:

```sh
npx wrangler secret put DATABASE_URL
```

Change the name of the project in `wrangler.toml` to something appropriate for your project:

```toml
name = "my-supabase-project"
```

Deploy with wrangler:

```sh
npm run deploy
```
