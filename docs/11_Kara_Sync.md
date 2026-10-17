# 🔄 Kara Sync: Sovereign Offline Backup & Transfer

## Chapter 1: Introduction & Core Purpose
Kara Sync is the backbone of Kara Office's "local-first" philosophy. It provides a way to bundle, export, and import your entire workspace state, allowing you to move your data between computers or back it up securely.

## Chapter 2: Key Features & Functionalities
- **Live Peer Heartbeat**: Uses the browser's BroadcastChannel API to detect other open tabs of Kara Office on the same machine, keeping them in sync.
- **Sovereign Bundles**: Exports all kara* local storage keys into a single, structured .json file.
- **Key Ledger**: A transparent table showing exactly what data is stored, its size, and when it was last synced.

## Chapter 3: Step-by-Step Usage Guide
1. **Open**: Select "Kara Sync" from the sidebar.
2. **Audit**: Review the "Sovereign keys" table to see your local data footprint.
3. **Export**: Click "Export Sync Bundle". A .json file containing your entire workspace will download.
4. **Import**: On a new computer (or after a browser wipe), open Kara Sync, click "Import Bundle", and select your saved .json file.
5. **Verify**: All your Notes, Base records, and Flow tasks will instantly reappear.

## Chapter 4: Intersections & Ecosystem Integration
- **Universal Applicability**: Kara Sync does not care *which* app generated the data. It safely backs up Word drafts, Sheets grids, Design canvases, and Drive vaults simultaneously.
