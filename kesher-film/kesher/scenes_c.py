# -*- coding: utf-8 -*-
"""KESHER — Act Three: the offered end, the true circle, the child. Shots 13-17."""
from build_lib import *
from scenes_a import RING, ring_pos, RING_PHASE, RING_CORE, ring_h
from scenes_b import scribble, tangle, constellation, CONSTEL_N, PARENT_I

GROUND = 940


# ============================================================ SHOT 13  42.5-46.0
def shot13(S):
    """The hand does not pull. Nothing moves until he closes his own fingers."""
    me, ME = figure(660, 856, 300, "reach_r", color=FIG, gid="s13-me",
                    chest="s13-chest", hide="r")
    myhand = ME["hand_r"]
    myarm = arm(ME["sh_r"], myhand, ME["sw"], FIG, gid="s13-arm")
    sn = tangle(646, 812, 176, 84, 12345, strands=8, n=15, color=GREY, w=2.2,
                gid="s13-snarl", opacity=0.9)

    far = (1810 - 330 * 0.470, 916 - 330 * 0.700)
    d, L = curve([far, ((far[0] + myhand[0]) / 2, (far[1] + myhand[1]) / 2 + 66), myhand])

    # a person, not a disembodied limb. mostly out of frame, reaching in.
    h1, H1 = figure(1810, 916, 330, "reach_l", color=FIG, gid="s13-h1", opacity=0.0)
    h2, _  = figure(1980, 1000, 320, "reach_l", color=FIG_DIM, gid="s13-h2", opacity=0.0)
    h3, _  = figure(1706, 700, 236, "reach_l", color=FIG_DIM, gid="s13-h3", opacity=0.0)
    hands = h3 + h2 + h1

    p1 = pulse_path(d, "s13-p1", GOLD, 5.0, 24, 4000, 0.0)
    p2 = pulse_path(d, "s13-p2", GOLD, 5.0, 24, 4000, 0.0)
    p3 = pulse_path(d, "s13-p3", GOLD, 5.4, 28, 4000, 0.0)

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s13-cam">',
                   sn, me, myarm, hands,
                   thread(d, GREY, 2.8, gid="s13-line", glow=False),
                   p1, p2, p3,
                   knot(myhand[0], myhand[1], 9, gid="s13-grip", color=GOLD, opacity=0),
                   '</g></svg>'])
    txt = line("לא מושכים אותו.<br>מחזיקים — עד שהוא אוחז בחזרה.", "s13-t", "tr", 52, 300)

    js = [
      f'tl.fromTo("#s13-cam",{{scale:1.0,svgOrigin:"960 700"}},'
      f'{{scale:1.06,duration:3.5,ease:"power1.out"}},{S});',
      f'tl.to("#s13-h1",{{opacity:1,duration:0.4,ease:"power2.out"}},{S+0.12});',
      f'tl.fromTo("#s13-h1",{{x:210}},{{x:0,duration:0.8,ease:"power3.out"}},{S+0.12});',
      # ...and then it does nothing at all for a beat and a half. that is the point.
      f'tl.fromTo("#s13-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.75});',
      f'tl.to("#s13-t",{{opacity:0,duration:0.35}},{S+3.0});',
      # two failed catches. the warmth advances and dies. this is honest.
      f'tl.to("#s13-p1",{{opacity:0.9,duration:0.07}},{S+1.10});',
      f'tl.fromTo("#s13-p1",{{strokeDashoffset:0}},{{strokeDashoffset:-{L*0.26:.0f},'
      f'duration:0.24,ease:"power1.out"}},{S+1.10});',
      f'tl.to("#s13-p1",{{opacity:0,duration:0.12}},{S+1.34});',
      f'tl.to("#s13-p2",{{opacity:0.9,duration:0.07}},{S+1.58});',
      f'tl.fromTo("#s13-p2",{{strokeDashoffset:0}},{{strokeDashoffset:-{L*0.44:.0f},'
      f'duration:0.28,ease:"power1.out"}},{S+1.58});',
      f'tl.to("#s13-p2",{{opacity:0,duration:0.12}},{S+1.86});',
      # HIS OWN FINGERS CLOSE. eight frames, no easing. recovery is not done to him.
      f'tl.fromTo("#s13-arm",{{rotation:0,svgOrigin:"{ME["sh_r"][0]:.0f} {ME["sh_r"][1]:.0f}"}},'
      f'{{rotation:-8,duration:0.26,ease:"none"}},{S+2.10});',
      f'tl.to("#s13-grip",{{opacity:1,duration:0.26,ease:"none"}},{S+2.10});',
      f'tl.fromTo("#s13-grip",{{scale:0.35,svgOrigin:"{myhand[0]:.0f} {myhand[1]:.0f}"}},'
      f'{{scale:1,duration:0.26,ease:"none"}},{S+2.10});',
      # only now does it take.
      f'tl.to("#s13-p3",{{opacity:1,duration:0.07}},{S+2.42});',
      f'tl.fromTo("#s13-p3",{{strokeDashoffset:0}},{{strokeDashoffset:-{L:.0f},'
      f'duration:0.72,ease:"power2.out"}},{S+2.42});',
      f'tl.to("#s13-line path",{{stroke:"{GOLD}",duration:0.5}},{S+2.95});',
      f'tl.to("#s13-chest",{{opacity:1,duration:0.5}},{S+3.02});',
      f'tl.fromTo("#s13-chest",{{scale:0.5,svgOrigin:"{ME["chest"][0]:.0f} {ME["chest"][1]:.0f}"}},'
      f'{{scale:1.45,duration:0.5,ease:"power2.out"}},{S+3.02});',
      f'tl.to("#s13-snarl",{{opacity:0.4,duration:0.9}},{S+2.6});',
      f'tl.to("#s13-h2",{{opacity:0.62,duration:0.35}},{S+2.72});',
      f'tl.to("#s13-h3",{{opacity:0.5,duration:0.35}},{S+2.98});',
    ]
    return svg + txt, js, {}


# ============================================================ SHOT 14  46.0-50.0
def shot14(S):
    """The same six. The same ring. The knots have moved, and there is no centre."""
    n = 6
    back, front, chests = [], [], []
    for i in range(n):
        x, y, depth = ring_pos(i, n)
        h = ring_h(depth)
        f, F = figure(x, y, h, "seated", color=FIG if depth > .5 else FIG_DIM,
                      gid="s14-f%d" % i, opacity=0.0)
        chests.append((F["chest"], depth))
        (front if depth >= 0.5 else back).append(f)

    links, knots = [], []
    for i in range(n):
        a, da = chests[i]
        b, db = chests[(i + 1) % n]
        mid = ((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 30)
        d, L = curve([a, mid, b])
        links.append((d, L, i, max(da, db)))
        knots.append((knot(mid[0], mid[1] + 3, 10, gid="s14-k%d" % i,
                           color=GOLD_WARM, opacity=0), max(da, db), i))
    lb = "".join(thread(d, GOLD_WARM, 2.6, gid="s14-l%d" % i, dash=L)
                 for d, L, i, dep in links if dep < 0.5)
    lf = "".join(thread(d, GOLD_WARM, 2.6, gid="s14-l%d" % i, dash=L)
                 for d, L, i, dep in links if dep >= 0.5)
    kb = "".join(k for k, dep, i in knots if dep < 0.5)
    kf = "".join(k for k, dep, i in knots if dep >= 0.5)

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s14-cam">',
                   "".join(back), lb, kb, "".join(front), lf, kf, '</g></svg>'])
    txt = line("רק לעמוד. ולהגיד אמת.", "s14-t", "cb", 72, 500)

    js = [
      f'tl.fromTo("#s14-cam",{{scale:1.06,y:14,svgOrigin:"960 632"}},'
      f'{{scale:1,y:0,duration:1.5,ease:"power3.out"}},{S});',
    ]
    for i in range(n):
        js.append(f'tl.to("#s14-f{i}",{{opacity:1,duration:0.45,'
                  f'ease:"power2.out"}},{S + 0.1 + 0.09*i:.2f});')
    for d, L, i, dep in links:
        t = S + 0.85 + i * 0.14
        js.append(f'tl.fromTo("#s14-l{i} path",{{strokeDashoffset:{L:.0f}}},'
                  f'{{strokeDashoffset:0,duration:0.55,ease:"power2.inOut"}},{t:.2f});')
        js.append(f'tl.to("#s14-k{i}",{{opacity:1,duration:0.18}},{t + 0.5:.2f});')
        js.append(f'tl.fromTo("#s14-k{i}",{{scale:0.2,svgOrigin:"960 632"}},'
                  f'{{scale:1,duration:0.3,ease:"back.out(2.2)"}},{t + 0.5:.2f});')
    # co-regulation: one shared breath across the whole circle
    for i in range(n):
        js.append(f'tl.fromTo("#s14-f{i}",{{y:0}},{{y:-8,duration:1.05,ease:"sine.inOut",'
                  f'yoyo:true,repeat:1}},{S + 1.95:.2f});')
    js += [
      f'tl.fromTo("#s14-t",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.55,ease:"power2.out"}},{S+2.25});',
      f'tl.to("#s14-t",{{opacity:0,duration:0.4}},{S+3.4});',
    ]
    return svg + txt, js, {}


# ============================================================ SHOT 15  50.0-54.0
def shot15(S):
    """Shot 9, exactly reversed — and every splice is tied from both ends at once."""
    items, hub = constellation()
    me, ME = figure(960, 620, 158, "idle", color=FIG, gid="s15-me")
    figs, halves, knots = [], [], []
    for it in items:
        i = it["i"]
        f, F = figure(it["x"], it["y"], it["h"], it["pose"], color=FIG_DIM,
                      gid="s15-f%d" % i, opacity=0.13)
        figs.append(f)
        src = F["hand_r"] if i == PARENT_I else F["chest"]
        mid = ((src[0] + hub[0]) / 2 + it["jx"], (src[1] + hub[1]) / 2 + it["jy"])
        da, La = curve([src, ((src[0] + mid[0]) / 2, (src[1] + mid[1]) / 2), mid])
        db, Lb = curve([hub, ((hub[0] + mid[0]) / 2, (hub[1] + mid[1]) / 2), mid])
        halves.append((i, da, La, db, Lb))
        knots.append(knot(mid[0], mid[1], 6.5, gid="s15-k%d" % i,
                          color=GOLD_WARM, opacity=0))
    hv = "".join(
        draw_path(da, La, GOLD_WARM, 2.1, gid="s15-a%d" % i)
        + draw_path(db, Lb, GOLD_WARM, 2.1, gid="s15-b%d" % i)
        for i, da, La, db, Lb in halves)

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s15-cam">',
                   "".join(figs), hv, "".join(knots), me, '</g></svg>'])
    txt = line("כל קשר נקשר משני הצדדים.", "s15-t", "br", 54, 300)

    js = [
      f'tl.fromTo("#s15-cam",{{scale:1.0,svgOrigin:"960 596"}},'
      f'{{scale:1.05,duration:4.0,ease:"power1.out"}},{S});',
      f'tl.fromTo("#s15-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.85});',
      f'tl.to("#s15-t",{{opacity:0,duration:0.4}},{S+3.5});',
    ]
    for k, (i, da, La, db, Lb) in enumerate(halves):
        t = S + 0.35 + k * 0.155
        js.append(f'tl.fromTo("#s15-a{i}",{{strokeDashoffset:{La:.0f}}},'
                  f'{{strokeDashoffset:0,duration:0.62,ease:"power2.inOut"}},{t:.2f});')
        js.append(f'tl.fromTo("#s15-b{i}",{{strokeDashoffset:{Lb:.0f}}},'
                  f'{{strokeDashoffset:0,duration:0.62,ease:"power2.inOut"}},{t:.2f});')
        js.append(f'tl.to("#s15-k{i}",{{opacity:1,duration:0.16}},{t + 0.6:.2f});')
        js.append(f'tl.fromTo("#s15-k{i}",{{scale:0.25,svgOrigin:"960 596"}},'
                  f'{{scale:1,duration:0.26,ease:"back.out(2.4)"}},{t + 0.6:.2f});')
        js.append(f'tl.to("#s15-f{i}",{{opacity:0.8,duration:0.5}},{t + 0.62:.2f});')
    return svg + txt, js, {}


# ============================================================ SHOT 16  54.0-56.5
def shot16(S):
    """The first wound, undone with the first object, by the person it happened to."""
    # he comes down to the child's height: a kneeling stance, never standing over him
    # he comes down to the child's eye height. nobody stands over anybody.
    ad, A = figure(1214, GROUND, 300, "reach_l", color=FIG, gid="s16-adult",
                   chest="s16-chest")
    ch, C = figure(700, GROUND, 208, "hold_r", color=FIG, gid="s16-child",
                   chest="s16-cchest", child=True)
    dbl, _ = figure(1214, GROUND, 300, "idle", color=VIOLET, gid="s16-dbl",
                    opacity=0.8, outline=True)
    wrist, csh, caw = C["hand_r"], C["sh_r"], C["sw"]
    q0 = (csh[0] + (wrist[0] - csh[0]) * 0.34, csh[1] + (wrist[1] - csh[1]) * 0.34)
    q1 = (csh[0] + (wrist[0] - csh[0]) * 0.97, csh[1] + (wrist[1] - csh[1]) * 0.97)
    grey_coil, cl = coil(q0, q1, 7, caw * 0.82, caw * 0.66, color=GREY,
                         gid="s16-coil", w=3.4)
    grey_coil = grey_coil.replace('stroke-dashoffset="%.0f"' % cl, 'stroke-dashoffset="0"')
    gold_coil = ""
    d, L = curve([A["hand_l"], ((A["hand_l"][0] + wrist[0]) / 2, wrist[1] + 62), wrist])
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s16-cam">',
                   dbl, ad, ch, grey_coil, gold_coil,
                   thread(d, GOLD, 2.8, gid="s16-thr", dash=L),
                   '</g></svg>'])
    txt = line("והקשר הכי קשה — עם הילד שהיה.", "s16-t", "tr", 54, 300)
    js = [
      f'tl.fromTo("#s16-cam",{{scale:1.18,y:36,svgOrigin:"950 800"}},'
      f'{{scale:1.26,y:36,duration:2.5,ease:"power1.out"}},{S});',
      # the false self drains warm and merges back in. it is never killed.
      f'tl.to("#s16-dbl",{{opacity:0,duration:0.95,ease:"power2.in"}},{S+0.30});',
      f'tl.fromTo("#s16-dbl",{{x:96}},{{x:0,duration:0.95,ease:"power2.inOut"}},{S+0.30});',
      f'tl.fromTo("#s16-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.15});',
      f'tl.to("#s16-t",{{opacity:0,duration:0.35}},{S+1.95});',
      f'tl.fromTo("#s16-thr path",{{strokeDashoffset:{L:.0f}}},'
      f'{{strokeDashoffset:0,duration:0.65,ease:"power2.out"}},{S+0.55});',
      # he unwinds it. nothing else in the frame moves.
      f'tl.to("#s16-coil",{{strokeDashoffset:{cl:.0f},duration:0.95,ease:"power2.inOut"}},{S+1.10});',
      f'tl.to("#s16-cchest",{{opacity:1,duration:0.55}},{S+1.70});',
      f'tl.fromTo("#s16-cchest",{{scale:0.5,svgOrigin:"{C["chest"][0]:.0f} {C["chest"][1]:.0f}"}},'
      f'{{scale:1.5,duration:0.65,ease:"power2.out"}},{S+1.70});',
    ]
    return svg + txt, js, {}


# ============================================================ SHOT 17  56.5-60.0
def shot17(S):
    r = Rand(17021)
    pts = []
    for i in range(96):
        a = r.rng(0, 6.2832); rad = math.sqrt(r.next())
        pts.append((960 + 940 * rad * math.cos(a), 545 + 560 * rad * math.sin(a)))
    edges = []
    for i, p in enumerate(pts):
        near = sorted(range(len(pts)),
                      key=lambda j: (pts[j][0]-p[0])**2 + (pts[j][1]-p[1])**2)[1:4]
        for j in near:
            if j > i:
                edges.append('<line x1="%.0f" y1="%.0f" x2="%.0f" y2="%.0f" stroke="%s" '
                             'stroke-width="1.25" opacity="0.42"/>'
                             % (p[0], p[1], pts[j][0], pts[j][1], GOLD_WARM))
    people = "".join('<circle cx="%.0f" cy="%.0f" r="4.6" fill="%s" opacity="0.9"/>'
                     % (p[0], p[1], GOLD) for p in pts)
    me, _ = figure(960, 700, 150, "idle", color=FIG, gid="s17-me", chest="s17-chest")

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">',
                   '<g id="s17-net" opacity="0">%s%s</g>' % ("".join(edges), people),
                   '<g id="s17-me-g">%s</g>' % me,
                   '<g id="s17-knot" opacity="0">%s</g>'
                   % knot(960, 470, 30, color=GOLD),
                   '</svg>'])
    scrim = ('<div id="s17-scrim" style="position:absolute;inset:0;background:'
             'radial-gradient(52% 30% at 50% 43%, rgba(8,8,14,0.90) 0%,'
             'rgba(8,8,14,0.62) 55%, rgba(8,8,14,0) 100%);opacity:0;"></div>')
    close = ('<div class="ln" id="s17-close" dir="rtl" data-layout-allow-caption-zone="true" '
             'style="position:absolute;left:0;right:0;top:36%;text-align:center;'
             'font-weight:300;font-size:62px;line-height:1.34;color:#F5F2EA;opacity:0;">'
             'ההפך מהתמכרות הוא לא להיות נקי —<br>הוא להיות בְּקֶשֶׁר.</div>')
    title = ('<div id="s17-title" dir="rtl" style="position:absolute;left:0;right:0;'
             'top:52%;text-align:center;opacity:0;">'
             '<div style="font-weight:800;font-size:190px;letter-spacing:0.06em;'
             'color:#F5F2EA;line-height:1;">קֶשֶׁר</div>'
             '<div style="font-weight:300;font-size:38px;letter-spacing:0.34em;'
             'color:#F5B942;margin-top:26px;">חיבור · קשירה</div></div>')
    js = [
      # he becomes one knot in a net far bigger than himself
      f'tl.fromTo("#s17-me-g",{{scale:5.4,svgOrigin:"960 640"}},'
      f'{{scale:1,duration:1.05,ease:"expo.out"}},{S});',
      f'tl.to("#s17-net",{{opacity:1,duration:0.75,ease:"power2.out"}},{S+0.25});',
      f'tl.fromTo("#s17-net",{{scale:1.5,svgOrigin:"960 545"}},'
      f'{{scale:1,duration:1.05,ease:"expo.out"}},{S});',
      f'tl.fromTo("#s17-close",{{opacity:0,y:18}},{{opacity:1,y:0,duration:0.6,'
      f'ease:"power2.out"}},{S+1.10});',
      f'tl.to("#s17-close",{{opacity:0,duration:0.35}},{S+2.45});',
      # everything contracts into one knot
      f'tl.to("#s17-net",{{opacity:0,duration:0.6,ease:"power2.in"}},{S+2.45});',
      f'tl.to("#s17-me-g",{{opacity:0,duration:0.45,ease:"power2.in"}},{S+2.45});',
      f'tl.to("#s17-knot",{{opacity:1,duration:0.4}},{S+2.6});',
      f'tl.fromTo("#s17-knot",{{scale:2.6,svgOrigin:"960 470"}},'
      f'{{scale:1,duration:0.7,ease:"power3.out"}},{S+2.6});',
      f'tl.fromTo("#s17-title",{{opacity:0,y:18}},{{opacity:1,y:0,duration:0.6,'
      f'ease:"power2.out"}},{S+2.85});',
    ]
    js.insert(4, f'tl.to("#s17-scrim",{{opacity:1,duration:0.5}},{S+0.95});')
    js.insert(5, f'tl.to("#s17-scrim",{{opacity:0,duration:0.4}},{S+2.45});')
    return svg + scrim + close + title, js, {}
