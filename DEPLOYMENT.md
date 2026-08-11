# VPS Deployment Guide (Docker & Docker Compose)

This guide explains how to deploy the Shebliss e-commerce application on a Linux VPS using Docker and Docker Compose, with Nginx acting as a reverse proxy on the host machine.

---

## 1. Prerequisites

Ensure your Linux VPS has the following installed:
1. **Docker Engine & Docker Compose CLI** (v2 or higher)
2. **Nginx** (or any reverse proxy like Caddy / HestiaCP) installed on the host to manage SSL termination (Let's Encrypt) and forward traffic.

---

## 2. Environment Configuration

Create a `.env` file in the root directory of your project on the VPS. This file contains the credentials and settings required by the Docker containers.

```env
# --- Database Configuration ---
POSTGRES_DB=shebliss
POSTGRES_USER=shebliss_user
POSTGRES_PASSWORD=secure_db_password

# --- Backend Configuration ---
ENVIRONMENT=production
DEBUG=false
LOG_JSON=true
SECRET_KEY=generate-a-long-random-string-for-security
BACKEND_PUBLIC_URL=https://my-store.example.com
BACKEND_PORT=8000

# --- Frontend Configuration ---
FRONTEND_PORT=8090
VITE_API_BASE_URL=https://my-store.example.com/api/v1
# VITE_CDN_BASE_URL=https://your-cdn.cloudfront.net # Optional
# VITE_RAZORPAY_KEY_ID= # Optional

# --- Third-Party Services (Optional) ---
# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://my-store.example.com/api/v1/auth/google/callback

# Razorpay Payments
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# SMTP Email Configuration
SMTP_HOST=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
SMTP_FROM_NAME=Shebliss
SMTP_USE_TLS=true
SMTP_USE_SSL=false
ADMIN_ORDER_EMAIL=
```

---

## 3. Build & Run the Application

The multi-container stack consists of:
- `postgres`: PostgreSQL database (not exposed to host, storage persisted in `postgres_data` volume)
- `redis`: Redis cache (not exposed to host, storage persisted in `redis_data` volume)
- `backend`: FastAPI API server (listens on `127.0.0.1:8000`)
- `frontend`: React/Vite served via Nginx (listens on `127.0.0.1:8090`)

### Step 1: Start the Services
Run the following command to build the Docker images and start the containers in detached mode:
```bash
docker compose up -d --build
```

### Step 2: Check Logs
You can monitor the startup logs of all services to ensure they are healthy:
```bash
docker compose logs -f
```
The backend container (`ecomm_backend`) runs `backend/start.sh`, which automatically waits for PostgreSQL to become available and executes the database migrations (`uv run alembic upgrade head`) before starting the Uvicorn web server.

### Step 3: Seed Sample Data (Optional)
If you want to populate the database with initial products, categories, and blogs:
```bash
docker compose run --rm seed
```

---

## 4. Reverse Proxy Setup (Nginx on Host)

Since your frontend container listens on loopback `127.0.0.1:8090`, you should configure Nginx on the host VPS to forward public traffic to it and manage SSL certificates.

Create a virtual host configuration in `/etc/nginx/sites-available/shebliss` (and symlink it to `/etc/nginx/sites-enabled/`):

```nginx
server {
    listen 80;
    server_name my-store.example.com;

    # Redirect all HTTP requests to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name my-store.example.com;

    # SSL Certificate Config (e.g., from Let's Encrypt Certbot)
    ssl_certificate /etc/letsencrypt/live/my-store.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/my-store.example.com/privkey.pem;

    client_max_body_size 25M;

    # Forward all traffic to the Frontend docker container
    location / {
        proxy_pass http://127.0.0.1:8090;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Test your configuration and reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Promoting an Admin User

To promote a registered user to administrator, open a Python interactive shell inside the backend container and run the database update:

1. Exec into the running backend container:
   ```bash
   docker exec -it ecomm_backend uv run python
   ```

2. Copy and paste the following Python script (replacing `your-email@example.com` with the user's email):
   ```python
   import asyncio
   from sqlalchemy import update
   from app.db.session import async_session_factory
   from app.db.models import User

   async def promote(email: str):
       async with async_session_factory() as db:
           await db.execute(
               update(User).where(User.email == email).values(is_admin=True)
           )
           await db.commit()
           print(f"Successfully promoted {email} to admin!")

   asyncio.run(promote("your-email@example.com"))
   ```
3. Type `exit()` or press `Ctrl+D` to exit the python shell.

---

## 6. Restarting and Maintenance

- **Stop the application:**
  ```bash
  docker compose down
  ```
- **Stop and remove database/redis volumes (Warning: resets all data):**
  ```bash
  docker compose down -v
  ```
- **Rebuild and restart after pulling code updates:**
  ```bash
  git pull
  docker compose up -d --build
  ```
