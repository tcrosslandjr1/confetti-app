# Confetti Fetcher — Synology NAS Setup Guide

## What This Does
Runs a scheduled job on your Synology NAS that:
1. Searches TikTok, Google Places, Yelp, and web for DMV venues & activities
2. Saves everything to `confetti_venues.xlsx` on your NAS
3. Pushes data to your Supabase `venue_intel` table so the Confetti app reads from it
4. Runs even when your Mac is off

---

## Step 1 — Copy Files to NAS

From your Mac (NAS mounted at `/Volumes/home/`):

```bash
mkdir -p /Volumes/home/confetti_fetcher
cp -r /Users/tyronecrossland/ai-lifestyle-concierge/confetti-fetcher/* /Volumes/home/confetti_fetcher/
```

---

## Step 2 — Install Python on Synology

1. Open **DSM** (your NAS web interface, e.g. `http://192.168.x.x:5000`)
2. Go to **Package Center**
3. Search for **Python 3** → Install (version 3.9 or newer)
4. Verify: open a terminal via **SSH** or the built-in **Terminal** app
   ```bash
   python3 --version
   # Should show: Python 3.x.x
   ```

---

## Step 3 — Install Python Dependencies

SSH into your NAS and run:

```bash
ssh admin@192.168.x.x   # replace with your NAS IP
cd /volume1/homes/admin/confetti_fetcher
python3 -m pip install -r requirements.txt
```

If `pip` is not available:
```bash
python3 -m ensurepip --upgrade
python3 -m pip install --upgrade pip
python3 -m pip install -r requirements.txt
```

---

## Step 4 — Configure API Keys

```bash
cp /volume1/homes/admin/confetti_fetcher/.env.template \
   /volume1/homes/admin/confetti_fetcher/.env

nano /volume1/homes/admin/confetti_fetcher/.env
```

Fill in:
- `BRIGHTDATA_API_KEY` — from brightdata.com (Account Settings → API Token)
- `GOOGLE_PLACES_KEY` — from console.cloud.google.com (enable "Places API New")
- `YELP_API_KEY` — from fusion.yelp.com (free tier: 500 req/day)
- `SUPABASE_SERVICE_KEY` — from Supabase → Settings → API → **service_role** key

Save with `Ctrl+X`, `Y`, Enter.

---

## Step 5 — Test It First

```bash
cd /volume1/homes/admin/confetti_fetcher
python3 main.py --dry-run --categories nightlife,brunch
```

You should see logs showing data being fetched without writing anything.
If it works, run for real:
```bash
python3 main.py --categories nightlife,brunch
```

Check that `confetti_venues.xlsx` was created and Supabase has new rows.

---

## Step 6 — Set Up Synology Task Scheduler

1. In DSM, go to **Control Panel → Task Scheduler**
2. Click **Create → Scheduled Task → User-defined script**
3. Fill in:

| Field | Value |
|-------|-------|
| Task name | `Confetti DMV Fetcher` |
| User | `admin` (or your NAS admin user) |
| Schedule | See options below |
| Run command | `/bin/bash /volume1/homes/admin/confetti_fetcher/run.sh` |

### Recommended Schedules

| Goal | Cron Expression | When to use |
|------|-----------------|-------------|
| Every 6 hours | `0 */6 * * *` | Maximum freshness, uses more API calls |
| Daily at 2 AM | `0 2 * * *` | Recommended — fresh every morning |
| Twice daily | `0 2,14 * * *` | Good balance |
| Weekly on Sunday | `0 3 * * 0` | Minimal API usage |

4. Click **OK** → The task appears in the list
5. Right-click it → **Run** to test immediately

---

## Step 7 — Monitor the Fetcher

Check the log from your Mac (NAS mounted):
```bash
tail -f /Volumes/home/confetti_fetcher/fetch_log.txt
```

Or from the NAS terminal:
```bash
tail -f /volume1/homes/admin/confetti_fetcher/fetch_log.txt
```

---

## How to Add Venues Manually

1. Open `confetti_venues.xlsx` from your Mac (at `/Volumes/home/confetti_fetcher/confetti_venues.xlsx`)
2. Go to the relevant category sheet (e.g., "Brunch", "Date Night")
3. Add a new row with:
   - **Name** — venue name
   - **City** — DC, Maryland, or Virginia
   - **Address** — full address
   - **Category** — the sheet category
   - **Notes (Tyrone)** — your personal notes
   - **Manual?** — type **Yes**
4. Save the file
5. On the next cron run, the script will detect the `Manual? = Yes` rows and sync them to Supabase automatically

---

## Folder Structure on NAS

```
/volume1/homes/admin/confetti_fetcher/
├── main.py                  ← orchestrator
├── config.py                ← API keys + category config
├── run.sh                   ← called by Task Scheduler
├── .env                     ← YOUR API KEYS (keep private)
├── requirements.txt
├── confetti_venues.xlsx     ← THE MASTER DATA FILE 📊
├── fetch_log.txt            ← run history
├── sources/
│   ├── tiktok_fetcher.py
│   ├── google_fetcher.py
│   ├── yelp_fetcher.py
│   └── web_fetcher.py
├── storage/
│   ├── excel_writer.py
│   └── supabase_writer.py
└── utils/
    ├── dedup.py
    └── scorer.py
```

---

## Mac Path Reference

When your NAS is mounted on your Mac:

| NAS Path | Mac Mounted Path |
|----------|-----------------|
| `/volume1/homes/admin/confetti_fetcher/confetti_venues.xlsx` | `/Volumes/home/confetti_fetcher/confetti_venues.xlsx` |
| `/volume1/homes/admin/confetti_fetcher/fetch_log.txt` | `/Volumes/home/confetti_fetcher/fetch_log.txt` |

---

## API Key Costs & Limits

| Service | Free Tier | Cost After |
|---------|-----------|-----------|
| **Bright Data** | Trial credits | ~$0.001/req |
| **Google Places** | $200/month credit | ~$0.017/place |
| **Yelp Fusion** | 500 req/day free | Paid plans available |
| **Supabase** | Free tier (50k rows) | $25/month for more |

For daily runs fetching ~500 venues, expect ~$5–15/month in API costs.
