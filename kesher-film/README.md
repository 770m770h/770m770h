# קֶשֶׁר — a 60-second film on addiction as a disease of connection

**The finished video: [`kesher/renders/kesher.mp4`](kesher/renders/kesher.mp4)** — 1920×1080, 30 fps, 60.000s, H.264 + AAC.

In Hebrew, **קֶשֶׁר** means *a relationship* and shares its root with *tying a knot*.
The word for the thing addiction takes is the word for the thing you do with a thread.
The film is built on one luminous thread and never leaves it.

> **In addiction, everyone's thread is tied to the CENTRE.**
> **In recovery, everyone's thread is tied TO EACH OTHER.**
> Same circle, same six people, same threads. Only the knots move.

Shots 5–6 and shot 14 are that comparison, framed identically so the rhyme is felt
rather than explained.

## Files

| | |
|---|---|
| `01-concept.md` | the idea, and the five stages as thread states |
| `02-beatsheet.md` | the finished film shot by shot, with every Hebrew line |
| `03-compose-prompt.txt` | the original director's brief |
| `kesher/` | the HyperFrames project — editable source |
| `kesher/renders/kesher.mp4` | **the film** |

## Building it again

```bash
cd kesher
npm install                 # gsap + the Heebo Hebrew webfont
python3 score.py            # regenerates assets/score.wav
python3 build.py            # regenerates index.html from the scene sources
npx hyperframes check       # lint + runtime + layout + motion + contrast
npx hyperframes render --quality high --fps 30 --output renders/kesher.mp4
```

`index.html` is generated, not hand-edited. The film's source is
`build_lib.py` (the drawing vocabulary — figures, threads, knots, coils),
`scenes_a/b/c.py` (the seventeen shots), `build.py` (the assembler) and
`score.py` (the score). Every path, position and seed is computed at author
time, so the rendered HTML is fully static and the render is deterministic.

## A note on the narration

The film carries its narration as Hebrew kinetic typography rather than a voice-over.
That was forced by the build environment — the local TTS engine ships no Hebrew voice
and no HeyGen API key is configured here — and then designed for: the lines are set as
part of the image, never as subtitles, and the film is timed to be read.

To add a spoken Hebrew voice-over, authenticate the CLI (`npx hyperframes auth login`)
and the HeyGen voices become available; the seventeen lines in `02-beatsheet.md` are the
script, and they are already timed to their shots.
