# Mor Thai Backend API

Backend API for Mor Thai application built with Node.js, Express, and PostgreSQL.

## Features

- RESTful API for managing:
  - Categories (Catégories)
  - Services
  - Reservations
  - Gift Cards (Cartes Cadeaux)
  - Offers (Offres)

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or pnpm

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=morthai_db
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3001
NODE_ENV=development

CORS_ORIGIN=http://localhost:3000

# UltraMsg WhatsApp API (optional - for sending confirmation messages)
ULTRAMSG_INSTANCE_ID=your_instance_id
ULTRAMSG_TOKEN=your_token
```

**Note:** UltraMsg WhatsApp integration is optional. If configured, clients will automatically receive a WhatsApp confirmation message when their reservation status is changed to "confirmed". To get your credentials, sign up at https://ultramsg.com.

3. Create the PostgreSQL database:
```bash
createdb morthai_db
```

4. Run database migrations:
```bash
npm run migrate
```

## Running the Server

Development mode (with nodemon):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## Swagger Documentation

Once the server is running, you can access the interactive API documentation at:
- **Swagger UI**: `http://localhost:3001/api-docs`

The Swagger UI provides:
- Complete API documentation for all endpoints
- Interactive testing interface
- Request/response schemas
- Example requests and responses

## API Endpoints

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `GET /api/services/category/:categoryId` - Get services by category
- `POST /api/services` - Create new service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service

### Reservations
- `GET /api/reservations` - Get all reservations
- `GET /api/reservations/:id` - Get reservation by ID
- `GET /api/reservations/date/:date` - Get reservations by date (YYYY-MM-DD)
- `GET /api/reservations/status/:status` - Get reservations by status
- `POST /api/reservations` - Create new reservation
- `PUT /api/reservations/:id` - Update reservation
- `DELETE /api/reservations/:id` - Delete reservation

### Gift Cards (Cartes Cadeaux)
- `GET /api/cartes-cadeaux` - Get all gift cards
- `GET /api/cartes-cadeaux/:id` - Get gift card by ID
- `POST /api/cartes-cadeaux` - Create new gift card
- `PUT /api/cartes-cadeaux/:id` - Update gift card
- `DELETE /api/cartes-cadeaux/:id` - Delete gift card

### Offers (Offres)
- `GET /api/offres` - Get all offers
- `GET /api/offres/:id` - Get offer by ID
- `GET /api/offres/code/:code` - Get offer by unique code
- `POST /api/offres` - Create new offer
- `PUT /api/offres/:id` - Update offer
- `DELETE /api/offres/:id` - Delete offer

## Request/Response Examples

### Create a Category
```json
POST /api/categories
{
  "NomCategorie": "Massage"
}
```

### Create a Service
```json
POST /api/services
{
  "NomService": "Thai Massage",
  "Description": "Traditional Thai massage",
  "Images": ["image1.jpg", "image2.jpg"],
  "Durée": 60,
  "Prix": 500.00,
  "CAT_UUID": "category-uuid-here"
}
```

### Create a Reservation
```json
POST /api/reservations
{
  "NomClient": "John Doe",
  "Email": "john@example.com",
  "NumeroTelephone": "+212612345678",
  "DateRes": "2024-12-25",
  "HeureRes": "14:00:00",
  "Service_UUID": "service-uuid-here",
  "ModePaiement": "cash",
  "PrixTotal": 500.00,
  "NbrPersonne": 1,
  "StatusRes": "pending",
  "Note": "Special request"
}
```

## Database Schema

The database includes the following tables:
- `Categorie` - Service categories
- `Service` - Services offered
- `Reservation` - Client reservations
- `CarteCadeaux` - Gift cards
- `Offre` - Gift card offers

All tables include `created_at` and `updated_at` timestamps.

## Project Structure

```
morthai-backend/
├── src/
│   ├── config/
│   │   └── database.js       # Database connection
│   ├── controllers/          # Request handlers
│   ├── database/
│   │   ├── schema.sql        # Database schema
│   │   └── migrate.js        # Migration script
│   ├── models/               # Data models
│   ├── routes/               # API routes
│   ├── app.js                # Express app setup
│   └── server.js             # Server entry point
├── .env                      # Environment variables
├── package.json
└── README.md
```

## License

ISC

