# EcoSchedule backend

## Local PostgreSQL setup (Windows)

The API requires PostgreSQL. It intentionally does not fall back to SQLite or a
development signing key.

1. Make sure the PostgreSQL Windows service is running. In pgAdmin, create a
   database named `ecoschedule` (or use an existing database you own).
2. Copy `.env.example` to `.env` in this `backend` folder. Keep `.env` local;
   it is ignored by Git.
3. Set `DATABASE_URL` to your PostgreSQL connection. For a local PostgreSQL
   server on the default port, the format is:

   ```text
   postgresql+psycopg2://YOUR_DB_USER:URL_ENCODED_PASSWORD@localhost:5432/ecoschedule
   ```

   If your password includes characters such as `@`, `:`, `/`, or `#`, URL-encode
   the password before putting it in the URL. Do not send the URL or password in
   chat.
4. Generate a private JWT signing key in PowerShell, then copy its output into
   `SECRET_KEY` in `.env`:

   ```powershell
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

5. Set `SEED_ADMIN_EMAIL` and a unique `SEED_ADMIN_PASSWORD` (at least 12
   characters) in `.env`. This account is created on first successful startup.
6. In PowerShell, from the `backend` folder, install and start the API:

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   python -m uvicorn app.main:app --reload
   ```

On startup, `db.init_db` creates tables for the SQLAlchemy models currently
implemented and creates the configured administrator if it does not exist.
Open `http://127.0.0.1:8000/docs`; check `http://127.0.0.1:8000/api/v1/health`.
The frontend defaults to this API URL, so no external API key is required for
login. Map tiles are provided by the configured public tile service.

Register citizen accounts from the login screen. Create collector and additional
administrator accounts from **Personnel** while signed in as an administrator.

To populate the dashboard and feature pages with sample records,
open another terminal in `backend/` and run:

```powershell
python -m db.seed_demo
```

This command is manual and safe to rerun. Sample records are not labeled in the
interface. It adds sample routes, schedules, vehicles, disabled demo staff
accounts, two enabled demo collector accounts, route runs, complaints,
compliance reports, disposal points, waste facilities, a festival event, and
notifications. It does not run automatically on startup. When the two
collectors are first created or enabled, their randomly generated passwords
are printed once; save them because the passwords are not stored in plaintext
or printed again.

The sample routes use one assigned truck for a combined wet-and-dry pickup on
Tuesday and Friday from 06:00 to 09:00. Rerunning the seed updates the seeded
wet/dry schedules to this combined window and deactivates the old duplicate
demo schedules.

To choose their passwords yourself, set `DEMO_COLLECTOR_RASHMI_PASSWORD` and
`DEMO_COLLECTOR_MEHTA_PASSWORD` in the local `backend/.env` (each must be at
least 8 characters). Rerun `python -m db.seed_demo` to set or change them.
These values are never printed by the seeder.

## Database-backed modules

The API persists routes, schedules, fleet, runs and stop visits, citizen
complaints and their status history, disposal points, waste facilities, festival
events, notifications, and compliance reports. Collection and analytics/report
views are calculated from those saved records. Authorization is enforced by the
API as well as by the role-specific frontend routes.