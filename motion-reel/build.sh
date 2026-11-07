#!/usr/bin/env bash
# Full pipeline: numpy score → Playwright frames → ffmpeg MP4 (1080p30, H.264 + AAC).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
rm -rf out/frames

echo "1/3  synthesising score (numpy)"
python3 music.py out/music.wav

echo "2/3  rendering 900 frames (Canvas 2D in headless Chromium)"
node capture.js --workers "${WORKERS:-4}"

echo "3/3  encoding"
ffmpeg -y -loglevel error \
  -framerate 30 -i out/frames/%05d.png -i out/music.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -tune animation \
  -c:a aac -b:a 320k -ar 48000 \
  -t 30 -movflags +faststart \
  out/motion-reel.mp4

ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,duration -of compact out/motion-reel.mp4
