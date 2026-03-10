import os
import pandas as pd
import pyarrow.parquet as pq
import json

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "..", "output")

os.makedirs(OUTPUT_DIR, exist_ok=True)

frames = []

print("🔍 Searching for .nakama-0 files...")

for root, dirs, files in os.walk(DATA_DIR):
    for file in files:

        if file.endswith(".nakama-0"):

            path = os.path.join(root, file)

            try:
                table = pq.read_table(path)
                df = table.to_pandas()

                # Extract date from folder name
                date_folder = os.path.basename(root)
                df["date"] = date_folder

                frames.append(df)

                print("Loaded:", file)

            except Exception as e:
                print("⚠️ Failed reading:", path)
                print(e)

if len(frames) == 0:
    print("❌ No files loaded. Check your data folder.")
    exit()

print("📦 Combining data...")

df = pd.concat(frames, ignore_index=True)

# Decode event column
df["event"] = df["event"].apply(
    lambda x: x.decode("utf-8") if isinstance(x, bytes) else x
)

# Detect bots (numeric user_id)
df["is_bot"] = df["user_id"].apply(
    lambda x: str(x).isdigit()
)

# Convert timestamps
df["ts"] = pd.to_datetime(df["ts"], errors="coerce")
df["ts"] = df["ts"].astype(str)

# Sort events
df = df.sort_values("ts")

print("✅ Total events:", len(df))

# -------------------------
# MATCH TIMELINE DATA
# -------------------------

matches = df[[
    "user_id",
    "match_id",
    "map_id",
    "x",
    "z",
    "ts",
    "event",
    "is_bot",
    "date"
]]

matches_json = matches.to_dict(orient="records")

with open(os.path.join(OUTPUT_DIR, "matches.json"), "w") as f:
    json.dump(matches_json, f)

print("✅ matches.json created")

# -------------------------
# HEATMAP DATA
# -------------------------

heatmap = df[[
    "map_id",
    "x",
    "z",
    "event",
    "date"
]]

heatmap_json = heatmap.to_dict(orient="records")

with open(os.path.join(OUTPUT_DIR, "heatmap.json"), "w") as f:
    json.dump(heatmap_json, f)

print("🔥 heatmap.json created")

# -------------------------
# SUMMARY DATA
# -------------------------

summary = {
    "total_events": int(len(df)),
    "unique_players": int(df["user_id"].nunique()),
    "unique_matches": int(df["match_id"].nunique()),
    "maps": df["map_id"].value_counts().to_dict(),
    "events": df["event"].value_counts().to_dict()
}

with open(os.path.join(OUTPUT_DIR, "summary.json"), "w") as f:
    json.dump(summary, f, indent=4)

print("📊 summary.json created")

print("🎉 Data processing complete!")