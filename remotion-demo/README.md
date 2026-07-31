# Remotion feature demo

A programmatic **feature-announcement video** built with
[Remotion](https://www.remotion.dev/) — video authored as React, so there's no
timeline and no video team. Everything is `props` + math over the current frame.

![poster](out/poster.png)

## What it shows

- A 6-second (180-frame @ 30fps, 1280×720) animated announcement.
- `spring()` entrance animations for the kicker pill, title, subtitle, and
  staggered feature cards.
- `interpolate()` for the underline sweep and clean fade-out.
- Ambient gradient glows that drift with `Math.sin(frame)`.
- Fully **data-driven**: change the text/colors in one place and re-render.

## Files

| File | Purpose |
|------|---------|
| `src/index.ts` | `registerRoot` entry point |
| `src/Root.tsx` | Declares the `FeatureDemo` `<Composition>` (size, fps, duration) |
| `src/FeatureDemo.tsx` | The video component + its `props`/defaults |
| `remotion.config.ts` | Render config |

## Customize

Edit `featureDemoDefaultProps` in `src/FeatureDemo.tsx` (title, subtitle,
`features`, `accent`, `background`) — the whole video re-renders from the new
data. No re-editing, no re-shooting.

## Develop

```bash
npm install
npm run studio      # interactive preview at http://localhost:3000
```

## Render

Remotion renders with headless Chrome. In this environment a
`chrome-headless-shell` binary is pre-installed, so pass it explicitly:

```bash
HS=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell

npm run render  -- --browser-executable="$HS"   # → out/feature-demo.mp4
npm run still   -- --browser-executable="$HS"    # → out/poster.png (frame 70)
```

On a normal machine, drop `--browser-executable` and Remotion downloads its own
Chrome Headless Shell automatically.

## Render in CI

Because the video is just code, `npm run render` runs anywhere — commit the
source, render the MP4 in a pipeline, and ship it as a build artifact.
