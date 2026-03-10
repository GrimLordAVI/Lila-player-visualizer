# Architecture Overview

## Tech Stack

Frontend
- HTML
- JavaScript
- Canvas rendering
- Tailwind CSS

Backend / Data Processing
- Python
- Pandas
- PyArrow

## Data Pipeline

Raw telemetry (.nakama / parquet)
        ↓
Python processing script
        ↓
Events converted to JSON
        ↓
Frontend loads JSON
        ↓
Canvas renders player behavior on minimap

## Key Design Decisions

Canvas Rendering:
Chosen for efficient rendering of thousands of player events.

JSON Conversion:
Parquet files are preprocessed into JSON to simplify browser loading.

Timeline Playback:
Allows Level Designers to replay match events over time.

## Tradeoffs

Large movement datasets were reduced to event markers to improve performance.

## Future Improvements

- Player movement trails
- Real-time telemetry streaming
- Advanced clustering heatmaps
