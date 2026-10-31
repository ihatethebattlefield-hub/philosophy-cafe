#!/usr/bin/env bash
# FUNCTIONS IN MOTION — full pipeline. Length = story duration × speed (timeline.js).
#   1. numpy score  → out/score.wav (48 kHz stereo)
#   2. frames       → out/frames/ (Canvas 2D in headless Chromium, real t = frame / 30)
#   3. ffmpeg       → out/functions-in-motion.mp4 (1920×1080, 30 fps, H.264 yuv420p, AAC 48 kHz)
#   4. keyframe sheet → out/keyframes.jpg (30 evenly spaced frames)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p out
read -r SECONDS_TOTAL FRAMES <<< "$(python3 -c "
import json; s = open('timeline.js').read(); t = json.loads(s[s.index('{'):s.rindex('}') + 1])
d = t['duration'] * t.get('speed', 1); print(d, round(d * t['fps']))")"
echo "film: ${SECONDS_TOTAL} s, ${FRAMES} frames"
rm -rf out/frames

echo "1/4  score"
python3 score.py out/score.wav

echo "2/4  frames"
node capture.js --workers "${WORKERS:-4}"
test "$(ls out/frames | wc -l)" -eq "$FRAMES"

echo "3/4  encode"
ffmpeg -y -loglevel error \
  -framerate 30 -i out/frames/%05d.png -i out/score.wav \
  -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p -profile:v high -tune animation -r 30 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 \
  -t "$SECONDS_TOTAL" -movflags +faststart \
  out/functions-in-motion.mp4

echo "4/4  keyframes"
ffmpeg -y -loglevel error -i out/functions-in-motion.mp4 \
  -vf "select='not(mod(n\,$((FRAMES / 30))))',scale=384:-1,tile=6x5:padding=4:color=black" -frames:v 1 -q:v 3 out/keyframes.jpg

ffprobe -v error -count_frames -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames,sample_rate,channels,duration -of compact out/functions-in-motion.mp4
