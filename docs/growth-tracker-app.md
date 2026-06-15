# Torch & Trowel Growth Tracker App

The tracker app is hosted by Cloudflare Pages at:

`/growth-tracker.html`

Google Sheets remains the database. Instead of using a Google Cloud service account key, the app uses a Google Apps Script web app attached to the tracker Sheet.

This avoids:

- Service account JSON keys
- Google Cloud organization policy changes
- Workspace service account key restrictions

## Architecture

```txt
Cloudflare Pages UI
  -> /api/growth-tracker
  -> Google Apps Script web app
  -> Torch & Trowel Growth Tracker Google Sheet
```

Cloudflare is a small proxy. Apps Script does the actual Sheet read/write work while running under the Google account that owns the tracker.

## Required Cloudflare Secrets

Set these on the `torch-trowel-site` Cloudflare Pages project:

```txt
APPS_SCRIPT_WEB_APP_URL=<deployed Apps Script web app URL>
TRACKER_API_TOKEN=<private-admin-token>
```

`TRACKER_API_TOKEN` protects the Cloudflare app API. In the browser UI, click `Access` and paste that token once. It is stored in local browser storage.

## Google Apps Script Setup

1. Go to `https://script.new` while signed in as `matt@torchandtrowel.com`.
2. Rename the project to `Torch & Trowel Growth Tracker API`.
3. Replace the default script with the code from:

   `docs/growth-tracker-apps-script.js`

4. In Apps Script, open **Project Settings** and add script properties:

   ```txt
   TRACKER_SPREADSHEET_ID=1mR8rFkFXxUu_y5XPuTwqFmJeX3DkLV0gUCdeZ4wwZ3A
   TRACKER_API_TOKEN=<same private token used in Cloudflare>
   ```

5. Save the project.
6. Click **Deploy → New deployment**.
7. Choose **Web app**.
8. Set **Execute as** to **Me**.
9. Set **Who has access** to **Anyone**.
10. Deploy and copy the web app URL.
11. Add that URL to Cloudflare as `APPS_SCRIPT_WEB_APP_URL`.

The web app URL is public, but writes require the private token. Reads happen through the Cloudflare proxy, which also requires the token when `TRACKER_API_TOKEN` is set.

## API

`GET /api/growth-tracker`

Returns tasks, recommendations, and dashboard summary data from Google Sheets.

`POST /api/growth-tracker?action=update-task`

Updates a task row in the `Tasks` tab.

`POST /api/growth-tracker?action=add-recommendation`

Appends a row to `Recommendation Log`.

`POST /api/growth-tracker?action=add-task`

Appends a new row to `Tasks` and assigns the next `TT-###` ID.

## Codex Workflow

After audits, Codex should:

1. Add findings to `Recommendation Log`.
2. Convert specific, actionable recommendations into `Tasks`.
3. After implementation, update the task with status, commit, deploy evidence, notes, and done date.
