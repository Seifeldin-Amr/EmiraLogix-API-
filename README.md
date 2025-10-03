# Ordering System API

A simple REST API for an ordering system with order management and driver tracking, designed for deployment on Vercel with Supabase as the database.

## Setup

### 1. Supabase Setup
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to the SQL Editor in your Supabase dashboard
3. Run the SQL commands from `schema.sql` to create the tables and sample data
4. Go to Settings → API to get your project URL and anon key

### 2. Environment Variables
1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 3. Install Dependencies
```bash
npm install
```

### 4. Deploy to Vercel
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in the project directory
3. Add your environment variables in the Vercel dashboard
4. Follow the prompts to deploy

## API Endpoints

### Orders

#### Get All Orders
- **GET** `/api/orders`
- **Query Parameters:**
  - `status` (optional): Filter by order status (`pending`, `processing`, `completed`)
- **Response:**
  ```json
  {
    "success": true,
    "data": [...],
    "count": 1
  }
  ```

#### Create Order
- **POST** `/api/orders`
- **Body:**
  ```json
  {
    "order_id": "ORD-002",
    "customer_name": "Jane Doe",
    "chat_id": 987654321,
    "address": "456 Oak Ave",
    "lat": 40.7128,
    "lng": -74.0060,
    "status": "pending"
  }
  ```

#### Get Order by ID
- **GET** `/api/orders/[id]`
- **Parameters:** `id` - Order ID or order_id

#### Update Order
- **PUT** `/api/orders/[id]`
- **Body:** (partial update supported)
  ```json
  {
    "customer_name": "Updated Name",
    "address": "New Address",
    "lat": 40.7589,
    "lng": -73.9851,
    "status": "processing"
  }
  ```

### Drivers

#### Get All Drivers
- **GET** `/api/drivers`
- **Query Parameters:**
  - `status` (optional): Filter by driver status (`available`, `busy`, `offline`)
- **Response:**
  ```json
  {
    "success": true,
    "data": [...],
    "count": 1
  }
  ```

#### Add Driver
- **POST** `/api/drivers`
- **Body:**
  ```json
  {
    "name": "John Driver",
    "phone": "+1234567890",
    "vehicle_type": "motorcycle",
    "license_plate": "XYZ789",
    "lat": 40.7589,
    "lng": -73.9851
  }
  ```

#### Get Driver by ID
- **GET** `/api/drivers/[id]`
- **Parameters:** `id` - Driver ID

#### Update Driver
- **PUT** `/api/drivers/[id]`
- **Body:** (partial update supported)
  ```json
  {
    "name": "Updated Name",
    "phone": "+0987654321",
    "status": "busy",
    "lat": 40.7589,
    "lng": -73.9851
  }
  ```

#### Update Driver Location
- **PUT** `/api/drivers/[id]/location`
- **Body:**
  ```json
  {
    "lat": 40.7589,
    "lng": -73.9851
  }
  ```

## Data Models

### Order
```json
{
  "id": "1",
  "order_id": "ORD-001",
  "customer_name": "John Doe",
  "chat_id": 123456789,
  "address": "123 Main St",
  "lat": 40.7128,
  "lng": -74.0060,
  "status": "pending",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z"
}
```

### Driver
```json
{
  "id": "1",
  "name": "Mike Wilson",
  "phone": "+1234567890",
  "vehicle_type": "car",
  "license_plate": "ABC123",
  "lat": 40.7589,
  "lng": -73.9851,
  "status": "available",
  "created_at": "2025-01-01T00:00:00.000Z",
  "updated_at": "2025-01-01T00:00:00.000Z",
  "last_location_update": "2025-01-01T00:00:00.000Z"
}
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing/invalid data)
- `404` - Not Found
- `405` - Method Not Allowed

## CORS

All endpoints include CORS headers to allow cross-origin requests from any domain.

## Note

This implementation uses Supabase (PostgreSQL) as the database. The API includes:
- Full CRUD operations for orders and drivers
- Real-time location tracking for drivers
- Proper error handling and validation
- CORS support for cross-origin requests
- Row Level Security (RLS) enabled for data protection

For production use, consider:
- Implementing proper authentication
- Adding rate limiting
- Setting up more restrictive RLS policies
- Adding data validation middleware
- Implementing logging and monitoring
