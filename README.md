# n8n-nodes-ninaapi

[![npm version](https://badge.fury.io/js/n8n-nodes-ninaapi.svg)](https://www.npmjs.com/package/n8n-nodes-ninaapi)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Community n8n nodes for **[N.I.N.A.](https://nighttime-imaging.eu/)** (Nighttime Imaging 'N' Astronomy) via the [ninaAPI plugin](https://github.com/christian-photo/ninaAPI).  
Automate your astrophotography workflow: control cameras, mounts, focusers, domes, polar alignment, sequences and more — all from n8n.

---

## Nodes

### Equipment
| Node | What it does |
|------|-------------|
| **NINA Camera** | Connect, capture images, plate-solve, set binning/readout, cool/warm, abort exposure |
| **NINA Mount** | Slew, park/unpark, home, track, meridian flip, sync |
| **NINA Focuser** | Move, stop, run autofocus, reverse direction |
| **NINA Filter Wheel** | Change filter, list/add/remove filters |
| **NINA Dome** | Open/close shutter, slew, park, follow mode, sync |
| **NINA Rotator** | Move (sky / mechanical), reverse, stop |
| **NINA Flat Device** | Set brightness, toggle light, open/close cover |
| **NINA Guider** | Start/stop guiding, clear calibration, fetch guide graph |
| **NINA Safety Monitor** | Read safe/unsafe state |
| **NINA Switch** | Set switch value by index |
| **NINA Weather** | Read temperature, humidity, pressure, cloud cover, dew point and more |

### Application & Imaging
| Node | What it does |
|------|-------------|
| **NINA Application** | Switch tabs, take screenshots, read logs, list plugins |
| **NINA Sequence** | Start/stop/reset, load by name, edit targets, skip items |
| **NINA Profile** | List/switch profiles, read/change settings, get horizon |
| **NINA Image** | Get images (by index), thumbnails, plate-solve, history |
| **NINA Framing** | Set sky coordinates, slew, set rotation, moon separation |
| **NINA Live Stack** | Start/stop, get stacked images per filter/target |
| **NINA Flats** | Sky flats, auto-brightness, auto-exposure, trained flats |

### Triggers & Polar Alignment
| Node | What it does |
|------|-------------|
| **NINA Event Trigger** | WebSocket trigger — fires on 34 NINA events (capture finished, autofocus, filter change, sequence, guider, safety, …) |
| **NINA TPPA** | Three-Point Polar Alignment via WebSocket — start with full config, collect AzimuthError / AltitudeError / TotalError, stop/pause/resume |

---

## Prerequisites

- [N.I.N.A.](https://nighttime-imaging.eu/) ≥ 3.x
- [ninaAPI plugin](https://github.com/christian-photo/ninaAPI) installed and running in N.I.N.A.  
  Default address: `http://localhost:1888`

---

## Installation

### In n8n (recommended)
```
Settings → Community Nodes → Install → n8n-nodes-ninaapi
```

### Manually
```bash
cd ~/.n8n/custom   # or your n8n custom nodes path
npm install n8n-nodes-ninaapi
```

---

## Credentials

Add a **NINA API** credential with:

| Field | Default | Description |
|-------|---------|-------------|
| Host | `localhost` | Machine running N.I.N.A. with ninaAPI |
| Port | `1888` | ninaAPI server port |

The credential test calls `GET /version` to verify connectivity.

---

## Example Workflows

### Automated Imaging Session
```
Schedule Trigger → NINA Mount (slew) → NINA Focuser (autofocus) 
  → NINA Camera (capture) → NINA Image (plate-solve) → Slack (notify)
```

### Polar Alignment Assistant
```
Manual Trigger → NINA TPPA (start alignment, 120s)
  → IF lastMeasurement.TotalError < 1 → Done
  → ELSE → Telegram (send alignment errors)
```

### Safety Shutdown
```
NINA Event Trigger (SAFETY-CHANGED) 
  → IF IsSafe=false 
  → NINA Mount (park) + NINA Dome (close) + NINA Camera (abort)
```

---

## API Reference

This package targets **ninaAPI v2** (`/v2/api`).  
Full API documentation: https://christian-photo.github.io/github-page/projects/ninaAPI/v2/doc/api

---

## License

MIT — see [LICENSE](LICENSE)
