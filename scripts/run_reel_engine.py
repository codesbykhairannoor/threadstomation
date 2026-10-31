#!/usr/bin/env python3
"""
Custom Reel Engine runner that integrates Google Gemini 2.5 Flash TTS
into the purffle-shorts video assembly pipeline.

Provides hyper-realistic human voice synthesis for Indonesian accounts:
- Adhlil (@adhlil.co): Gemini 'Charon' (deep, warm, calm, reflective mentor)
- Sharesa (@sharesa.space): Gemini 'Puck' (crisp, confident, engaging tech founder)
- Tranvas (@tranvasapp): Native English via Edge-TTS 'en-US-AndrewMultilingualNeural'
"""

import os
import sys
import io
import pathlib

# Force UTF-8 on Windows stdout/stderr to prevent charmap emoji encoding crashes
if sys.platform == "win32":
    try:
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
        sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')
    except Exception:
        pass

# Force pathlib to use UTF-8 on Windows when reading/writing files
_orig_write_text = pathlib.Path.write_text
def _safe_write_text(self, data, encoding=None, errors=None, newline=None):
    if encoding is None:
        encoding = "utf-8"
    return _orig_write_text(self, data, encoding=encoding, errors=errors, newline=newline)
pathlib.Path.write_text = _safe_write_text

_orig_read_text = pathlib.Path.read_text
def _safe_read_text(self, encoding=None, errors=None):
    if encoding is None:
        encoding = "utf-8"
    return _orig_read_text(self, encoding=encoding, errors=errors)
pathlib.Path.read_text = _safe_read_text

import json
import base64
import random
import dataclasses
import urllib.request
import urllib.error
from pathlib import Path

# Load .env variables if present
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

import purffle_shorts.tts as tts
import purffle_shorts.ffmpeg as ffmpeg
from purffle_shorts.config import Settings
from purffle_shorts.timing import Word, tokenize, estimate_timings, transfer_timings

# Collect all available GEMINI API keys for resilient rotation
def _get_gemini_keys() -> list[str]:
    keys = []
    # Primary key
    primary = os.getenv("GEMINI_API_KEY")
    if primary and primary.strip():
        keys.append(primary.strip())
    # Additional indexed keys
    for k, v in os.environ.items():
        if k.startswith("GEMINI_API_KEY_") and v and v.strip() and v.strip() not in keys:
            keys.append(v.strip())
    # Fallback search if no prefix match
    if not keys:
        for k, v in os.environ.items():
            if "GEMINI" in k and "KEY" in k and v and v.strip() and v.strip() not in keys:
                keys.append(v.strip())
    return keys

def _align_gemini_timestamps(audio_path: Path, text: str, api_keys: list[str], dur: float) -> list[Word] | None:
    """Uses Gemini 2.5 Flash to perform millisecond-precise audio forced alignment for subtitles and kinetic text highlighting."""
    if not api_keys or not audio_path.exists():
        return None

    try:
        raw_audio = audio_path.read_bytes()
        b64_audio = base64.b64encode(raw_audio).decode('utf-8')

        prompt = f"""You are an ultra-precise audio forced aligner.
Listen to the audio and find the exact start and end timestamps in seconds for each word in this transcript:
"{text}"

Rules:
1. Every word in the transcript must appear in order.
2. "start" and "end" must be float timestamps in seconds.
3. "start" must be the exact moment the speaker begins pronouncing the word.
4. "end" must be the moment the speaker finishes pronouncing the word.
5. Account for any pauses, breaths, or silence between words.

Return a strict JSON array of objects with keys: "word", "start", "end".
"""

        payload = {
            "contents": [{
                "parts": [
                    {"inline_data": {"mime_type": "audio/mpeg", "data": b64_audio}},
                    {"text": prompt}
                ]
            }],
            "generationConfig": {
                "responseMimeType": "application/json",
                "temperature": 0.1
            }
        }
        payload_bytes = json.dumps(payload).encode('utf-8')

        for key in api_keys:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={key}"
            try:
                req = urllib.request.Request(
                    url,
                    data=payload_bytes,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=35) as resp:
                    data = json.loads(resp.read().decode('utf-8'))
                    raw_json = data["candidates"][0]["content"]["parts"][0]["text"]
                    items = json.loads(raw_json)
                    if isinstance(items, list) and len(items) > 0:
                        words = []
                        last_end = 0.0
                        for item in items:
                            w_text = str(item.get("word", "")).strip()
                            if not w_text:
                                continue
                            start = max(last_end, float(item.get("start", last_end)))
                            end = max(start + 0.08, float(item.get("end", start + 0.2)))
                            if dur > 0 and end > dur:
                                end = min(dur, end)
                            last_end = end
                            words.append(Word(w_text, round(start, 3), round(end, 3), "A"))
                        
                        expected_count = len(text.split())
                        if len(words) >= expected_count * 0.7:
                            return words
            except Exception:
                continue
    except Exception as err:
        print(f"[Gemini-TTS] ⚠️ Alignment exception: {err}")
    return None

def _gemini_tts(text: str, out: Path, settings: Settings) -> tuple[Path, list[Word], str]:
    """Synthesizes human-grade Indonesian speech using Google Gemini 2.5 Flash TTS."""
    api_keys = _get_gemini_keys()
    if not api_keys:
        print("[Gemini-TTS] ⚠️ No GEMINI_API_KEY found in environment. Falling back to edge-tts...")
        fallback_settings = dataclasses.replace(settings, tts_voice="id-ID-ArdiNeural")
        return tts._edge(text, out, fallback_settings)

    # Validate voice name
    voice_name = (settings.tts_voice or "").strip()
    valid_voices = {"Charon", "Puck", "Aoede", "Kore", "Fenrir"}
    if voice_name not in valid_voices:
        # Auto-detect best voice based on content
        lower = text.lower()
        if any(w in lower for w in ["allah", "nasehat", "muhasabah", "hati", "jiwa", "tenang", "syukur", "sabar", "sujud"]):
            voice_name = "Charon"
        else:
            voice_name = "Puck"

    # Contextual voice director prompt for hyper-realistic human delivery
    lower_text = text.lower()
    is_adhlil = any(w in lower_text for w in ["allah", "nasehat", "muhasabah", "hati", "jiwa", "tenang", "syukur", "sabar", "sujud", "doa"]) or voice_name == "Charon"
    
    if is_adhlil:
        instruction = "Bacakan dengan intonasi sangat hangat, tenang, berwibawa, dan penuh empati layaknya seorang mentor bijak berbicara dari hati ke hati kepada sahabatnya: "
    else:
        instruction = "Bacakan dengan nada santai, percaya diri, antusias, dan sangat manusiawi layaknya seorang tech creator mereview solusi berguna: "

    prompt_text = f"{instruction}{text}"
    payload = {
        "contents": [{"parts": [{"text": prompt_text}]}],
        "generationConfig": {
            "responseModalities": ["AUDIO"],
            "speechConfig": {
                "voiceConfig": {
                    "prebuiltVoiceConfig": {
                        "voiceName": voice_name
                    }
                }
            }
        }
    }
    payload_bytes = json.dumps(payload).encode("utf-8")

    # Try keys in rotation if rate-limited or transient errors
    shuffled_keys = list(api_keys)
    random.shuffle(shuffled_keys)

    for idx, key in enumerate(shuffled_keys):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key={key}"
        try:
            req = urllib.request.Request(
                url,
                data=payload_bytes,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            part = data["candidates"][0]["content"]["parts"][0]
            b64_audio = part["inlineData"]["data"]
            raw_pcm = base64.b64decode(b64_audio)

            pcm_path = out / "gemini_voice.pcm"
            mp3_path = out / "voice.mp3"
            pcm_path.write_bytes(raw_pcm)

            # Convert 24kHz mono PCM to high-quality MP3
            ffmpeg_bin = ffmpeg.ffmpeg_bin()
            import subprocess
            subprocess.run(
                [
                    ffmpeg_bin, "-y",
                    "-f", "s16le",
                    "-ar", "24000",
                    "-ac", "1",
                    "-i", str(pcm_path),
                    "-b:a", "192k",
                    str(mp3_path)
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            # Compute actual duration and generate millisecond-precise per-word timing
            dur = ffmpeg.duration(mp3_path)
            
            # Align exact audio word timestamps using Gemini forced alignment
            words = _align_gemini_timestamps(mp3_path, text, api_keys, dur)
            if not words:
                print(f"[Gemini-TTS] ⚠️ Alignment fallback: using estimate_timings")
                tokens = tokenize(text, settings.language)
                words = estimate_timings(tokens, dur)
            else:
                print(f"[Gemini-TTS] 🎯 Aligned {len(words)} words with millisecond precision")

            print(f"[Gemini-TTS] 🎙️ Synthesized {len(raw_pcm)} bytes ({dur:.2f}s) using voice '{voice_name}' (Key #{idx + 1})")
            return mp3_path, words, voice_name

        except Exception as err:
            print(f"[Gemini-TTS] ⚠️ Key #{idx + 1} failed: {err}")
            continue

    # Graceful fallback to Edge-TTS if all Gemini keys fail
    print("[Gemini-TTS] ⚠️ All Gemini API keys failed or rate-limited. Falling back to edge-tts...")
    fallback_settings = dataclasses.replace(settings, tts_voice="id-ID-ArdiNeural")
    return tts._edge(text, out, fallback_settings)


# Register Gemini engine into purffle-shorts runtime
tts._ENGINE_FUNCS["gemini"] = _gemini_tts
tts.CACHED_ENGINES.add("gemini")

# Patch Visuals._claim to pick stochastically from top candidates instead of always rank 0
import purffle_shorts.media as media
_orig_claim = media.Visuals._claim

def _smart_claim(self, candidates: list, need: float, query: str = ""):
    with self.lock:
        fresh = [c for c in candidates if c.key not in self.used]
        if not fresh:
            return None
        if fresh[0].source == "local":
            best = fresh[0] if fresh[0].extra.get("overlap") else random.choice(fresh)
        else:
            scored = sorted(
                fresh,
                key=lambda c: media._score(c, need, self.s.orientation, query),
                reverse=True
            )
            top_candidates = scored[:min(4, len(scored))]
            if len(top_candidates) == 1:
                best = top_candidates[0]
            elif len(top_candidates) == 2:
                best = random.choices(top_candidates, weights=[0.60, 0.40], k=1)[0]
            elif len(top_candidates) == 3:
                best = random.choices(top_candidates, weights=[0.50, 0.32, 0.18], k=1)[0]
            else:
                best = random.choices(top_candidates, weights=[0.45, 0.30, 0.17, 0.08], k=1)[0]
        self.used.add(best.key)
        return best

media.Visuals._claim = _smart_claim

if __name__ == "__main__":
    import purffle_shorts.cli as cli
    cli.main()
