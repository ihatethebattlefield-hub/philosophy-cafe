"""Vocal timing from the recording (no lyric text is shown or committed from this).

  python3 tools/asr.py audio/song.mp3 data/asr-medium.json

Runs faster-whisper (medium, CPU int8) with word timestamps on the audio, decoded
by ffmpeg to 16 kHz mono. The result is used for two things only: finding where
vocal phrases start and end (to cut shots on real phrasing before the lyrics are
supplied), and, later, as the time reference that tools/align.py matches the
supplied lyric text against. Recognised text can be wrong, so it never reaches
the screen. The cache file is gitignored.
"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
src, out = sys.argv[1], sys.argv[2]
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
model = WhisperModel('medium', device='cpu', compute_type='int8')
segs, info = model.transcribe(audio, language='zh', word_timestamps=True, vad_filter=False, beam_size=5,
                              initial_prompt='以下是普通话流行歌曲的歌词。')
res = []
for s in segs:
    res.append({'start': s.start, 'end': s.end, 'text': s.text, 'words': [{'start': w.start, 'end': w.end, 'w': w.word, 'p': w.probability} for w in (s.words or [])]})
    print(f'{s.start:7.2f} {s.end:7.2f} {len(s.words or [])}w', flush=True)
json.dump({'duration': len(audio) / 16000, 'segments': res}, open(out, 'w'), ensure_ascii=False, indent=1)
