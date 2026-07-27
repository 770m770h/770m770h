- 👋 Hi, I’m @770m770h
- 👀 I’m interested in ...
- 🌱 I’m currently learning ...
- 💞️ I’m looking to collaborate on ...
- 📫 How to reach me ...
- 😄 Pronouns: ...
- ⚡ Fun fact: ...

<!---
770m770h/770m770h is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->

## Song generation with ACE-Step

This repo includes [`ace_step_generate.py`](ace_step_generate.py), a small CLI that
talks to a locally running [ACE-Step 1.5](https://github.com/ACE-Step/ACE-Step-1.5)
server to generate a song from a text prompt and lyrics.

Setup:

```bash
# 1. Set up ACE-Step 1.5 (separate repo) and start its API server
git clone https://github.com/ACE-Step/ACE-Step-1.5.git
cd ACE-Step-1.5 && uv sync
uv run acestep-api   # serves on http://localhost:8001

# 2. From this repo, install the client's one dependency and run it
pip install -r requirements.txt
python ace_step_generate.py \
  --prompt "upbeat synthwave, driving bassline" \
  --lyrics "Hello world, this is a song" \
  --duration 60 \
  --output song.mp3
```
