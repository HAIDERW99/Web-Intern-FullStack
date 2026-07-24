# CarFever Backend API

Node.js + Express + Supabase (PostgreSQL) REST API for the CarFever AutoTrader clone.

---

## Folder Structure

```
carfever-backend/
├── server.js                   # Entry point — Express app init + route mounting
├── package.json
├── .env.example                # Template — copy to .env and fill in secrets
├── .gitignore
└── src/
    ├── config/
    │   └── supabase.js         # Supabase client singleton
    ├── middleware/
    │   ├── errorHandler.js     # Global error handler (4-arg Express middleware)
    │   └── validate.js         # Required-field body validator factory
    └── routes/
        ├── vehicles.js         # All vehicle CRUD endpoints
        └── leads.js            # All lead/enquiry endpoints
```

---

## Setup

### 1. Install dependencies

```bash
cd carfever-backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set:

| Variable          | Description                                              |
|-------------------|----------------------------------------------------------|
| `PORT`            | Port for the Express server (default `5000`)             |
| `SUPABASE_URL`    | Your Supabase Project URL (Settings → API)               |
| `SUPABASE_KEY`    | Your Supabase **service_role** secret key (Settings → API) |
| `ALLOWED_ORIGINS` | Comma-separated frontend URLs allowed by CORS            |

> **Important:** Use the `service_role` key (not `anon`) so the backend can bypass Row Level Security.

### 3. Run

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

---

## API Reference

### Health Check

```
GET /health
```

Returns server status, environment, and timestamp.

---

### Vehicles

#### List / Search Vehicles
```
GET /api/vehicles
```

**Query Parameters:**

| Param          | Type   | Description                                     |
|----------------|--------|-------------------------------------------------|
| `status`       | string | Filter by status (default: `Active`)            |
| `make`         | string | Filter by make (partial match)                  |
| `model`        | string | Filter by model (partial match)                 |
| `minPrice`     | number | Minimum price                                   |
| `maxPrice`     | number | Maximum price                                   |
| `maxMileage`   | number | Maximum mileage                                 |
| `fuel_type`    | string | e.g. `Petrol`, `Electric`                       |
| `body_type`    | string | e.g. `SUV`, `Saloon`                            |
| `transmission` | string | e.g. `Manual`, `Automatic`                      |
| `sort`         | string | `newest` (default), `price_asc`, `price_desc`, `mileage_asc`, `year_desc` |
| `page`         | number | Page number (default: `1`)                      |
| `limit`        | number | Results per page (default: `12`, max: `50`)     |

**Response:**
```json
{
  "success": true,
  "data": [ { ...vehicle, "main_image_url": "...", "image_count": 5 } ],
  "pagination": { "total": 48, "page": 1, "limit": 12, "total_pages": 4 }
}
```

---

#### Get Single Vehicle (VDP)
```
GET /api/vehicles/:id
```

Returns full vehicle with all images and dealer info.

---

#### Create Listing (Sell Your Car)
```
POST /api/vehicles
Content-Type: application/json
```

**Required body fields:** `dealer_id`, `make`, `model`, `year`, `price`, `fuel_type`, `transmission`

**Optional:** `mileage`, `body_type`, `engine_size`, `color`, `description`, `registration_plate`, `image_urls` (array of URL strings)

New listings are created with `status: 'Pending'`.

---

#### Update Vehicle Status (Dashboard)
```
PATCH /api/vehicles/:id/status
Content-Type: application/json

{ "status": "Sold" }
```

Valid values: `Active`, `Pending`, `Sold`

---

#### Delete Vehicle
```
DELETE /api/vehicles/:id
```

---

### Leads

#### Get Leads for Dealer (Dashboard)
```
GET /api/leads/:dealerId
```

**Query Parameters:** `status` (`Unread` | `Replied`), `page`, `limit`

---

#### Submit Buyer Enquiry (VDP Contact Form)
```
POST /api/leads
Content-Type: application/json
```

**Required:** `vehicle_id`, `dealer_id`, `buyer_name`, `buyer_email`

**Optional:** `buyer_phone`, `message`

---

#### Mark Lead as Replied
```
PATCH /api/leads/:id/reply
```

---

## Deployment (Render)

1. Push `carfever-backend/` to its own GitHub repository.
2. Create a new **Web Service** on [render.com](https://render.com).
3. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add environment variables (`SUPABASE_URL`, `SUPABASE_KEY`, `ALLOWED_ORIGINS`) in the Render dashboard.
5. Copy the Render URL (e.g. `https://carfever-backend.onrender.com`) into the frontend's `VITE_API_BASE_URL`.

---

## Frontend Integration

The frontend `src/services/api.js` module exposes a clean API client:

```js
import api from '../services/api'

// Fetch paginated vehicles with filters
const { data, pagination } = await api.vehicles.getAll({ make: 'BMW', sort: 'price_asc', page: 1 })

// Fetch single vehicle for VDP
const { data: vehicle } = await api.vehicles.getById(42)

// Submit a new listing
await api.vehicles.create({ dealer_id, make, model, year, price, fuel_type, transmission, image_urls })

// Mark vehicle as sold
await api.vehicles.updateStatus(id, 'Sold')

// Delete a listing
await api.vehicles.remove(id)

// Submit an enquiry from VDP
await api.leads.submit({ vehicle_id, dealer_id, buyer_name, buyer_email, message })

// Get all leads for dealer dashboard
const { data: leads } = await api.leads.getByDealer(dealerId)

// Mark lead as replied
await api.leads.markReplied(leadId)
```
