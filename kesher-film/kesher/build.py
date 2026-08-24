# -*- coding: utf-8 -*-
"""KESHER — assemble the 60-second composition."""
import os
from build_lib import *
import scenes_a as A, scenes_b as B, scenes_c as C

SHOTS = [
    (A.shot1,  0.0,  3.5),
    (A.shot2,  3.5,  4.0),
    (A.shot3,  7.5,  3.0),
    (A.shot4, 10.5,  3.0),
    (A.shot5, 13.5,  4.0),
    (A.shot6, 17.5,  3.0),
    (B.shot7, 20.5,  4.0),
    (B.shot8, 24.5,  3.5),
    (B.shot9, 28.0,  4.0),
    (B.shot10,32.0,  4.0),
    (B.shot11,36.0,  3.0),
    (B.shot12,39.0,  3.5),
    (C.shot13,42.5,  3.5),
    (C.shot14,46.0,  4.0),
    (C.shot15,50.0,  4.0),
    (C.shot16,54.0,  2.5),
    (C.shot17,56.5,  3.5),
]

import re as _re
_EXIT = _re.compile(r'^tl\.to\("([^"]+)",\{opacity:0(?:\.0+)?,duration:([\d.]+)([^}]*)\},([\d.]+)\);$')


def _seal(lines, start, end):
    """Every opacity-0 exit must finish inside its own clip and end with a
    deterministic hard kill, so a seek landing after the fade cannot resurrect
    stale visibility state."""
    out = []
    for l in lines:
        m = _EXIT.match(l.strip())
        if not m:
            out.append(l)
            continue
        sel, dur, rest, at = m.group(1), float(m.group(2)), m.group(3), float(m.group(4))
        latest = end - 0.16
        if at + dur > latest:
            at = max(start + 0.05, latest - dur)
        out.append('tl.to("%s",{opacity:0,duration:%s%s},%.2f);' % (sel, dur, rest, at))
        out.append('tl.set("%s",{opacity:0},%.2f);' % (sel, at + dur))
    return out


def main():
    clips, js, carry = [], [], {}
    for n, (fn, start, dur) in enumerate(SHOTS, start=1):
        try:
            html, jl, carry = fn(start, carry) if fn in (A.shot2, A.shot6) else fn(start)
        except TypeError:
            html, jl, carry = fn(start)
        clips.append(
            '<div id="s%d" class="clip scene" data-start="%.2f" data-duration="%.2f" '
            'data-track-index="%d" style="z-index:%d">'
            '<div class="bg"></div>%s</div>' % (n, start, dur, 1 + (n % 2), 10 + n, html))
        js.extend(_seal(jl, start, start + dur))

    faces = ""
    for w, f in ((300, "300"), (500, "500"), (800, "800"), (900, "900")):
        faces += ("@font-face{font-family:'Heebo';font-style:normal;font-weight:%d;"
                  "font-display:block;src:url(data:font/woff2;base64,%s) format('woff2');}"
                  % (w, b64("assets/fonts/heebo-hebrew-%s-normal.woff2" % f)))
    grain = b64("assets/grain.png")

    doc = """<!doctype html>
<html lang="he">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<title>KESHER</title>
<script src="assets/vendor/gsap.min.js"></script>
<style>
%s
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:1920px;height:1080px;overflow:hidden;background:%s;}
body{font-family:'Heebo',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
#root{position:relative;width:1920px;height:1080px;overflow:hidden;background:%s;}
.scene{position:absolute;inset:0;width:1920px;height:1080px;overflow:hidden;}
.bg{position:absolute;inset:0;background:%s;}
.cv{position:absolute;inset:0;width:1920px;height:1080px;display:block;}
.ln{display:block;}
.lnrow{display:block;}
.bigword{display:block;}
#floor{position:absolute;inset:0;background:%s;z-index:1;}
#vig{position:absolute;inset:0;z-index:900;pointer-events:none;
     background:radial-gradient(122%% 92%% at 50%% 46%%, rgba(0,0,0,0) 40%%, rgba(0,0,0,0.60) 100%%);}
#grain{position:absolute;inset:0;z-index:901;pointer-events:none;opacity:0.055;
       background-image:url(data:image/png;base64,%s);background-repeat:repeat;}
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="60"
     data-width="1920" data-height="1080" data-fps="30">
<div id="floor"></div>
<audio id="score" src="assets/score.m4a" data-start="0" data-duration="60"
       data-track-index="10"></audio>
%s
<div id="vig"></div>
<div id="grain"></div>
</div>
<script>
window.__timelines = window.__timelines || {};
var tl = gsap.timeline({paused:true});
%s
window.__timelines["main"] = tl;
</script>
</body>
</html>
""" % (faces, BG, BG, BG, BG, grain, "\n".join(clips), "\n".join(js))

    with open("index.html", "w", encoding="utf-8") as f:
        f.write(doc)
    total = SHOTS[-1][1] + SHOTS[-1][2]
    print("index.html written  |  %d shots  |  %.2fs  |  %d tweens  |  %.1f KB"
          % (len(SHOTS), total, len(js), len(doc) / 1024.0))

if __name__ == "__main__":
    main()
