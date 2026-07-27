#!/usr/bin/env python3
"""Generate a song locally using an ACE-Step 1.5 server.

Prerequisites:
    1. Clone and set up ACE-Step 1.5: https://github.com/ACE-Step/ACE-Step-1.5
    2. Start the REST API server: `uv run acestep-api`
       (defaults to http://localhost:8001)

Usage:
    python ace_step_generate.py \
        --prompt "upbeat synthwave, driving bassline" \
        --lyrics "Hello world, this is a song" \
        --duration 60 \
        --output song.mp3
"""

import argparse
import sys
import time

import requests


def submit_task(api_url: str, prompt: str, lyrics: str, duration: int,
                 inference_steps: int, audio_format: str) -> str:
    response = requests.post(
        f"{api_url}/release_task",
        json={
            "prompt": prompt,
            "lyrics": lyrics,
            "audio_duration": duration,
            "inference_steps": inference_steps,
            "audio_format": audio_format,
        },
    )
    response.raise_for_status()
    payload = response.json()
    return payload["data"]["task_id"]


def wait_for_result(api_url: str, task_id: str, poll_interval: float = 3.0) -> dict:
    while True:
        response = requests.post(
            f"{api_url}/query_result",
            json={"task_id_list": [task_id]},
        )
        response.raise_for_status()
        result = response.json()["data"][task_id]

        if result["status"] == 1:
            return result
        if result["status"] == 2:
            raise RuntimeError(f"Generation failed for task {task_id}: {result}")

        time.sleep(poll_interval)


def download_audio(api_url: str, file_path: str, output: str) -> None:
    response = requests.get(f"{api_url}/v1/audio", params={"path": file_path})
    response.raise_for_status()
    with open(output, "wb") as f:
        f.write(response.content)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api-url", default="http://localhost:8001")
    parser.add_argument("--prompt", required=True, help="Music style/description")
    parser.add_argument("--lyrics", default="", help="Song lyrics")
    parser.add_argument("--duration", type=int, default=60, help="Length in seconds (10-600)")
    parser.add_argument("--inference-steps", type=int, default=8)
    parser.add_argument("--audio-format", default="mp3",
                         choices=["mp3", "flac", "opus", "aac", "wav", "wav32"])
    parser.add_argument("--output", default="output.mp3")
    args = parser.parse_args()

    print(f"Submitting task to {args.api_url} ...")
    task_id = submit_task(
        args.api_url, args.prompt, args.lyrics, args.duration,
        args.inference_steps, args.audio_format,
    )
    print(f"Task queued: {task_id}")

    result = wait_for_result(args.api_url, task_id)
    file_path = result["result"]["file_path"] if isinstance(result["result"], dict) else result["result"]

    print("Generation complete, downloading audio ...")
    download_audio(args.api_url, file_path, args.output)
    print(f"Saved to {args.output}")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print(
            "Could not reach the ACE-Step API server. "
            "Start it first with `uv run acestep-api` inside your ACE-Step-1.5 checkout.",
            file=sys.stderr,
        )
        sys.exit(1)
