#!/usr/bin/env bash
# 阴天 · 同一张桌子 — render pipeline.
#   tools/build.sh preview   → out/preview-360x640.mp4   (logical resolution, quick check)
#   tools/build.sh final     → out/mv-1080x1920.mp4      (×3 nearest-neighbour, delivery)
# Length = length of audio/song.mp3. Frame f is t = f / 30 s of the song, so
# picture and sound cannot drift whatever the render speed.
set -euo pipefail
cd "$(dirname "$0")/.."
mode="${1:-preview}"
[ -f audio/song.mp3 ] || { echo "audio/song.mp3 missing"; exit 1; }
[ -f data/lyrics.js ] || node tools/lyrics.js data/lyrics.lrc
if [ "$mode" = final ]; then scale=3; out=out/mv-1080x1920.mp4; crf=14; else scale=1; out=out/preview-360x640.mp4; crf=18; fi
frames="out/frames-x$scale"
rm -rf "$frames"
node tools/capture.js --out "$frames" --scale "$scale" --workers "${WORKERS:-4}"
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 audio/song.mp3)
ffmpeg -y -loglevel error \
  -framerate 30 -i "$frames/%05d.png" -i audio/song.mp3 \
  -map 0:v -map 1:a \
  -c:v libx264 -preset slow -crf "$crf" -pix_fmt yuv420p -tune animation -r 30 \
  -c:a aac -b:a 256k -ar 48000 \
  -t "$dur" -movflags +faststart \
  "$out"
ffprobe -v error -count_frames -show_entries stream=codec_name,pix_fmt,width,height,r_frame_rate,nb_read_frames,duration -of compact "$out"
