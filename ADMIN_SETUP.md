# Admin Panel Setup

## Authentication

The admin panel uses JWT-based authentication with static credentials:

- **Username**: `morthai`
- **Password**: `morthai@2025`

## Installation

1. Install backend dependencies:
```bash
cd morthai-backend
npm install
```

2. Install frontend dependencies (if not already installed):
```bash
cd ../morthai
npm install
```

3. Set up environment variables in `morthai-backend/.env`:
```env
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=morthai_db
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

4. Run database migrations:
```bash
cd morthai-backend
npm run migrate
```

## Running the Application

1. Start the backend server:
```bash
cd morthai-backend
npm run dev
```

2. Start the frontend (in a new terminal):
```bash
cd morthai
npm run dev
```

3. Access the admin panel:
- Login: `http://localhost:3000/admin/login`
- Dashboard: `http://localhost:3000/admin/dashboard` (after login)

## Admin Features

### Dashboard
- Overview statistics for categories, services, reservations, and offers

### Categories Management
- Create, Read, Update, Delete categories
- Route: `/admin/categories`

### Services Management
- Create, Read, Update, Delete services
- Link services to categories
- Set duration, price, and images
- Route: `/admin/services`

### Gift Cards Management
- Create, Read, Update, Delete gift cards
- Set theme and price
- Route: `/admin/gift-cards`

### Reservations View
- View all reservations
- Filter by status (pending, confirmed, completed, cancelled)
- Update reservation status
- Route: `/admin/reservations`

### Offers View
- View all gift card offers
- See offer details including unique codes
- Route: `/admin/offers`

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/verify` - Verify token (protected)

### Protected Routes
All admin routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Security Notes

- JWT tokens expire after 24 hours
- Tokens are stored in localStorage (consider using httpOnly cookies for production)
- Change the JWT_SECRET in production
- Consider implementing rate limiting for login attempts
- Add HTTPS in production

