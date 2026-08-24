# -*- coding: utf-8 -*-
"""KESHER — Act Two: the one relationship, the swallowing, rock bottom. Shots 7-12."""
from build_lib import *

GROUND = 940

def scribble(cx, cy, rx, ry, seed, n=46, tension=0.55):
    r = Rand(seed)
    pts = []
    for i in range(n):
        a = i * 2.399963  # golden-angle walk: dense, non-repeating, never a spiral
        rad = 0.28 + 0.72 * r.next()
        pts.append((cx + rx * rad * math.cos(a * (1 + 0.14 * r.next())),
                    cy + ry * rad * math.sin(a * (1 + 0.11 * r.next()))))
    return curve(pts, tension)


def tangle(cx, cy, rx, ry, seed, strands=7, n=16, color=GREY, w=2.0, gid=None,
           opacity=0.9):
    """A snarl: several overlapping loops, so it reads as knotted thread."""
    r = Rand(seed)
    out = []
    for s in range(strands):
        pts = []
        a0 = r.rng(0, 6.2832)
        for i in range(n):
            a = a0 + i * (6.2832 / n) * r.rng(0.85, 1.15)
            rad = r.rng(0.35, 1.0)
            pts.append((cx + rx * rad * math.cos(a), cy + ry * rad * math.sin(a)))
        pts.append(pts[0])
        d, _ = curve(pts, 0.6)
        out.append('<path d="%s" stroke="%s" stroke-width="%.1f" fill="none" '
                   'opacity="%.2f" stroke-linecap="round"/>'
                   % (d, color, w, 0.42 + 0.10 * (s % 4)))
    gid_attr = ' id="%s"' % gid if gid else ""
    return '<g%s opacity="%.2f">%s</g>' % (gid_attr, opacity, "".join(out))


# ============================================================ SHOT 7  20.5-24.5
def shot7(S):
    man, M = figure(1420, GROUND, 430, "reach_l", color=FIG, gid="s7-man",
                    chest="s7-chest", hide="l")
    hand = M["hand_l"]
    armsvg = arm((M["sh_l"][0] + 16, M["sh_l"][1]), hand, M["sw"], FIG,
                 gid="s7-arm", bow=-8)
    ctr = (630, 596)

    # the five abandoned threads, retracting into the centre
    ends = [(-60, 300), (-40, 880), (420, 1140), (980, 1150), (1020, 120)]
    retract = []
    for i, e in enumerate(ends):
        d, L = curve([e, ((e[0]+ctr[0])/2 + 30, (e[1]+ctr[1])/2 - 24), ctr])
        retract.append((thread(d, GREY, 2.3, gid="s7-r%d" % i, glow=False), L))

    # his thread — the one that feeds
    d1, L1 = curve([hand, ((hand[0]+ctr[0])/2, (hand[1]+ctr[1])/2 + 40), ctr])
    thin  = thread(d1, GOLD, 2.6, gid="s7-thin")
    thick = thread(d1, GOLD_WARM, 7.4, gid="s7-thick", opacity=0)
    puls  = pulse_path(d1, "s7-pulse", GOLD, 4.2, 15, 190, 0.0)

    # the centre grows a hand out of its own stroke
    ad, AL = curve([ctr, (ctr[0] + 210, ctr[1] - 66), (hand[0] - 8, hand[1] - 4)])
    reach = (draw_path(ad, AL, VIOLET, 6.0, gid="s7-reach", opacity=0.92)
             + '<circle id="s7-palm" cx="%.0f" cy="%.0f" r="13" fill="%s" opacity="0"/>'
             % (hand[0] - 6, hand[1] - 3, VIOLET))

    core = ('<g id="s7-core">'
            '<circle cx="%.0f" cy="%.0f" r="132" fill="%s" opacity="0.075"/>'
            '<circle cx="%.0f" cy="%.0f" r="74"  fill="%s" opacity="0.19"/>'
            '<circle cx="%.0f" cy="%.0f" r="34"  fill="#E6D8FF"/></g>'
            % (ctr[0], ctr[1], VIOLET, ctr[0], ctr[1], VIOLET, ctr[0], ctr[1]))

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s7-cam">',
                   "".join(t for t, _ in retract), core, man, armsvg,
                   thin, thick, reach, puls, '</g></svg>'])
    txt = line("תמיד זמין. לעולם לא דוחה.", "s7-t", "br", 56, 300)

    js = [
      f'tl.fromTo("#s7-cam",{{scale:1.34,x:250,y:-40,svgOrigin:"960 540"}},'
      f'{{scale:1,x:0,y:0,duration:3.4,ease:"power2.out"}},{S});',
      # the centre breathes — strictly linear, always. it is not a person.
      f'tl.fromTo("#s7-core",{{scale:0.96,svgOrigin:"{ctr[0]} {ctr[1]}"}},'
      f'{{scale:1.05,duration:0.95,ease:"none",yoyo:true,repeat:3}},{S});',
    ]
    for i, (_, L) in enumerate(retract):
        js.append(f'tl.fromTo("#s7-r{i} path",{{strokeDasharray:"{L:.0f}",strokeDashoffset:0}},'
                  f'{{strokeDashoffset:{L:.0f},duration:0.9,ease:"power2.in"}},{S + 0.15 + 0.13*i:.2f});')
    js += [
      # it feeds: his thread thickens as the others go in
      f'tl.to("#s7-thick",{{opacity:1,duration:1.1,ease:"power2.in"}},{S+0.75});',
      f'tl.to("#s7-thin",{{opacity:0.35,duration:1.1}},{S+0.75});',
      # the gesture from shot 1 — finally answered, by the wrong thing
      f'tl.fromTo("#s7-reach",{{strokeDashoffset:{AL:.0f}}},'
      f'{{strokeDashoffset:0,duration:0.85,ease:"none"}},{S+1.55});',
      f'tl.to("#s7-palm",{{opacity:1,duration:0.2,ease:"none"}},{S+2.4});',
      f'tl.fromTo("#s7-arm",{{rotation:0,svgOrigin:"{M["sh_l"][0]:.0f} {M["sh_l"][1]:.0f}"}},'
      f'{{rotation:-4,duration:0.5,ease:"power2.out"}},{S+2.3});',
      # and now the pulses run OUT of him, into it
      f'tl.to("#s7-pulse",{{opacity:0.85,duration:0.3}},{S+2.55});',
      f'tl.fromTo("#s7-pulse",{{strokeDashoffset:0}},'
      f'{{strokeDashoffset:-{int(L1*2)},duration:1.5,ease:"none"}},{S+2.55});',
      f'tl.to("#s7-chest",{{opacity:0.45,duration:1.2}},{S+2.6});',
      f'tl.fromTo("#s7-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.55,ease:"power2.out"}},{S+1.5});',
      f'tl.to("#s7-t",{{opacity:0,duration:0.4}},{S+3.55});',
    ]
    return svg + txt, js, {"ctr": ctr}


# ============================================================ SHOT 8  24.5-28.0
def shot8(S):
    man, M = figure(1210, GROUND, 430, "reach_l", color=FIG, gid="s8-man",
                    chest="s8-chest")
    hand = M["hand_l"]
    ctr = (520, 700)
    slack, _ = sag(hand, ctr, 190)
    taut,  _ = curve([hand, ((hand[0]+ctr[0])/2, (hand[1]+ctr[1])/2 - 6), ctr])

    # ground travel: dashes streaming right -> left
    gr = []
    for i in range(26):
        x = i * 82
        gr.append('<rect x="%d" y="968" width="46" height="2.4" fill="%s" opacity="0.20"/>'
                  % (x, GREY_DK))
    ground = '<g id="s8-ground">%s</g>' % "".join(gr)

    core = ('<g id="s8-core">'
            '<circle cx="%.0f" cy="%.0f" r="86" fill="%s" opacity="0.08"/>'
            '<circle cx="%.0f" cy="%.0f" r="46" fill="%s" opacity="0.22"/>'
            '<circle cx="%.0f" cy="%.0f" r="21" fill="#E6D8FF"/></g>'
            % (ctr[0], ctr[1], VIOLET, ctr[0], ctr[1], VIOLET, ctr[0], ctr[1]))

    # the coil: wrist, forearm, chest. never above the collarbone.
    sh, aw = M["sh_l"], M["sw"]
    a0 = (sh[0] + (hand[0] - sh[0]) * 0.95, sh[1] + (hand[1] - sh[1]) * 0.95)
    a1 = (sh[0] + (hand[0] - sh[0]) * 0.10, sh[1] + (hand[1] - sh[1]) * 0.10)
    arm_coil, cl_a = coil(a0, a1, 6, aw * 0.80, aw * 0.95, color=GOLD_WARM,
                          gid="s8-coil", w=4.6)
    ch0 = (M["chest"][0], M["chest"][1] - 46)
    ch1 = (M["chest"][0], M["chest"][1] + 54)
    chest_coil, cl_b = coil(ch0, ch1, 4, 78, 70, color=GOLD_WARM,
                            gid="s8-coil2", w=4.6)
    cl_svg, cl = arm_coil + chest_coil, cl_a

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s8-cam">',
                   ground, core, man,
                   thread(slack, GOLD_WARM, 6.4, gid="s8-slack"),
                   thread(taut,  GOLD_WARM, 6.4, gid="s8-taut", opacity=0),
                   cl_svg,
                   '</g></svg>'])
    desat = ('<div id="s8-desat" style="position:absolute;inset:0;background:'
             '#0A0A0F;opacity:0;"></div>')
    txt = line("בהתחלה אתה מושך בחוט.<br>אחר כך הוא מושך בך.", "s8-t", "tr", 54, 300)
    js = [
      f'tl.fromTo("#s8-ground",{{x:0}},{{x:-820,duration:3.5,ease:"none"}},{S});',
      f'tl.fromTo("#s8-man",{{rotation:-2.5,svgOrigin:"{M["base"][0]} {GROUND}"}},'
      f'{{rotation:-2.5,duration:1.25,ease:"none"}},{S});',
      f'tl.fromTo("#s8-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.25});',
      f'tl.to("#s8-t",{{opacity:0,duration:0.35}},{S+3.1});',
      # THE INVERSION — the core surges ahead, linear, and the slack reverses
      f'tl.fromTo("#s8-core",{{x:0}},{{x:-118,duration:0.42,ease:"none"}},{S+1.25});',
      f'tl.to("#s8-slack",{{opacity:0,duration:0.16}},{S+1.3});',
      f'tl.to("#s8-taut",{{opacity:1,duration:0.16}},{S+1.3});',
      f'tl.to("#s8-man",{{rotation:9,duration:0.42,ease:"power3.out"}},{S+1.3});',
      f'tl.fromTo("#s8-man",{{x:0}},{{x:-46,duration:1.9,ease:"power1.in"}},{S+1.3});',
      # and it takes the body: wrist, forearm, chest
      f'tl.fromTo("#s8-coil",{{strokeDashoffset:{cl_a:.0f}}},'
      f'{{strokeDashoffset:0,duration:0.85,ease:"power1.inOut"}},{S+1.80});',
      f'tl.fromTo("#s8-coil2",{{strokeDashoffset:{cl_b:.0f}}},'
      f'{{strokeDashoffset:0,duration:0.8,ease:"power1.inOut"}},{S+2.45});',
      f'tl.to("#s8-desat",{{opacity:0.30,duration:1.5,ease:"power2.in"}},{S+1.9});',
      f'tl.to("#s8-chest",{{opacity:0.3,duration:1.2}},{S+2.2});',
    ]
    return svg + desat + txt, js, {}


# --------------------------------------------- the constellation of a whole life
CONSTEL_N = 14
PARENT_I = 9

def constellation():
    """Deterministic layout shared by shot 9 (swallowed) and shot 15 (re-tied)."""
    r = Rand(9007)
    hub = (960, 620 - 158 * 0.66)
    out = []
    for i in range(CONSTEL_N):
        a = i * 2 * math.pi / CONSTEL_N - math.pi / 2
        rx, ry = 610 + r.rng(-34, 34), 322 + r.rng(-24, 24)
        x, y = 960 + rx * math.cos(a), 596 + ry * math.sin(a)
        h = 104 + r.rng(-10, 16)
        pose = "reach_r" if i == PARENT_I else "idle"
        jx, jy = r.rng(-40, 40), r.rng(-30, 30)
        out.append(dict(i=i, x=x, y=y + h * 0.5, h=h, pose=pose, jx=jx, jy=jy))
    return out, hub


# ============================================================ SHOT 9  28.0-32.0
def shot9(S):
    items, hub = constellation()
    me, ME = figure(960, 620, 158, "idle", color=FIG, gid="s9-me")
    n = CONSTEL_N
    figs, thr = [], []
    parent_i = PARENT_I
    for it in items:
        i = it["i"]
        f, F = figure(it["x"], it["y"], it["h"], it["pose"], color=FIG_DIM,
                      gid="s9-f%d" % i, opacity=0.85)
        figs.append(f)
        src = F["hand_r"] if i == parent_i else F["chest"]
        d, L = curve([src, ((src[0]+hub[0])/2 + it["jx"],
                            (src[1]+hub[1])/2 + it["jy"]), hub])
        thr.append((thread(d, GREY, 1.9, gid="s9-t%d" % i, dash=None, glow=False), L, i))
    stub, _ = curve([hub, (hub[0] - 150, hub[1] + 210), (hub[0] - 430, hub[1] + 640)])
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s9-cam">',
                   "".join(figs), "".join(t for t, _, _ in thr), me,
                   thread(stub, GOLD_WARM, 3.0, gid="s9-stub1", opacity=0),
                   thread(stub, GOLD_WARM, 6.0, gid="s9-stub2", opacity=0),
                   thread(stub, GOLD_WARM, 9.5, gid="s9-stub3", opacity=0),
                   '</g></svg>'])
    txt = line("המחלה לא חותכת קשרים.<br>היא בולעת אותם.", "s9-t", "br", 54, 300)
    js = [
      f'tl.fromTo("#s9-cam",{{scale:1.5,svgOrigin:"960 596"}},'
      f'{{scale:1,duration:0.9,ease:"expo.out"}},{S});',
      f'tl.fromTo("#s9-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.75});',
      f'tl.to("#s9-t",{{opacity:0,duration:0.35}},{S+3.5});',
      f'tl.to("#s9-stub1",{{opacity:1,duration:0.4}},{S+0.9});',
      f'tl.to("#s9-stub2",{{opacity:1,duration:0.6}},{S+1.7});',
      f'tl.to("#s9-stub3",{{opacity:1,duration:0.7}},{S+2.6});',
    ]
    order = list(range(n))
    for k, i in enumerate(order):
        L = [x for _, x, j in thr if j == i][0]
        t = S + 0.95 + k * 0.135
        js.append(f'tl.fromTo("#s9-t{i} path",{{strokeDasharray:"{L:.0f}",strokeDashoffset:0}},'
                  f'{{strokeDashoffset:{L:.0f},duration:0.62,ease:"power2.in"}},{t:.2f});')
        if i != parent_i:
            js.append(f'tl.to("#s9-f{i}",{{opacity:0.24,duration:0.55}},{t + 0.2:.2f});')
        else:
            # she is left standing with her arm still out — the same posture he had
            js.append(f'tl.to("#s9-f{i}",{{opacity:0.5,duration:0.55}},{t + 0.2:.2f});')
    return svg + txt, js, {}


# ============================================================ SHOT 10  32.0-36.0
def shot10(S):
    """The capacity is not gone. It is captured."""
    r = Rand(10009)
    ctr = (960, 545)
    rings, links, nodes = [(230, 9), (420, 12), (620, 13)], [], []
    prev = [ctr]
    for rad, cnt in rings:
        cur = []
        for k in range(cnt):
            a = (k / float(cnt)) * 6.2832 + r.rng(-0.16, 0.16)
            cur.append((ctr[0] + rad * math.cos(a) * 1.28,
                        ctr[1] + rad * math.sin(a) * 0.80))
        for p in cur:
            q = min(prev, key=lambda z: (z[0]-p[0])**2 + (z[1]-p[1])**2)
            mid = ((p[0]+q[0])/2 + r.rng(-26, 26), (p[1]+q[1])/2 + r.rng(-26, 26))
            d, L = curve([q, mid, p])
            links.append((d, L))
        nodes.extend(cur)
        prev = cur
    lk = "".join('<path id="s10-k%d" d="%s" stroke="%s" stroke-width="2.0" fill="none" '
                 'opacity="0.78" stroke-dasharray="%.0f" stroke-dashoffset="0" '
                 'stroke-linecap="round"/>' % (i, d, GOLD, L)
                 for i, (d, L) in enumerate(links))
    nd = "".join('<circle id="s10-n%d" cx="%.0f" cy="%.0f" r="4.4" fill="%s" opacity="0.9"/>'
                 % (i, p[0], p[1], GOLD) for i, p in enumerate(nodes))
    lr = 205
    loop, LL = circle_path(ctr[0], ctr[1], lr)
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s10-cam">',
                   '<g id="s10-web">', lk, nd, '</g>',
                   thread(loop, VIOLET, 6.6, gid="s10-loop", dash=LL),
                   pulse_path(loop, "s10-fire", "#EFE6FF", 7.0, 34, 200, 0.0),
                   '</g></svg>'])
    txt = line("היכולת לקשור לא נעלמה.<br>היא נחטפה.", "s10-t", "br", 54, 300)
    js = [
      f'tl.fromTo("#s10-cam",{{scale:0.30,svgOrigin:"960 545"}},'
      f'{{scale:1,duration:1.0,ease:"power3.out"}},{S});',
      f'tl.fromTo("#s10-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+1.15});',
      f'tl.to("#s10-t",{{opacity:0,duration:0.35}},{S+3.45});',
    ]
    # the web is drawn inward, ring by ring, and wound onto the loop
    idx, base_t = 0, S + 1.55
    for ri, (rad, cnt) in enumerate(rings):
        for k in range(cnt):
            t = base_t + (len(rings) - 1 - ri) * 0.22 + k * 0.010
            _, L = links[idx]
            js.append(f'tl.to("#s10-k{idx}",{{strokeDashoffset:{L:.0f},duration:0.5,'
                      f'ease:"power2.in"}},{t:.2f});')
            idx += 1
    for i in range(len(nodes)):
        js.append(f'tl.to("#s10-n{i}",{{opacity:0.20,duration:0.4}},'
                  f'{S + 1.95 + (i % 12) * 0.05:.2f});')

    js += [
      f'tl.fromTo("#s10-loop path",{{strokeDashoffset:{LL:.0f}}},'
      f'{{strokeDashoffset:0,duration:0.80,ease:"none"}},{S+2.15});',
      f'tl.to("#s10-fire",{{opacity:1,duration:0.2,ease:"none"}},{S+2.70});',
      f'tl.fromTo("#s10-fire",{{strokeDashoffset:0}},'
      f'{{strokeDashoffset:-{int(LL*3)},duration:1.30,ease:"none"}},{S+2.70});',
    ]
    return svg + txt, js, {}


# ============================================================ SHOT 11  36.0-39.0
def shot11(S):
    man, M = figure(700, GROUND, 400, "reach_r", color=FIG, gid="s11-man",
                    chest="s11-chest")
    ref, R = figure(1220, GROUND, 400, "reach_l", color=FIG_DIM, gid="s11-ref",
                    chest="s11-rchest")
    dbl, _ = figure(700, GROUND, 400, "idle", color=VIOLET, gid="s11-dbl",
                    opacity=0, outline=True)
    d, L = curve([M["hand_r"], (960, M["hand_r"][1] + 26), R["hand_l"]])
    mirror = ('<rect x="956" y="120" width="8" height="860" fill="%s" opacity="0.13"/>'
              % GREY)
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s11-cam">',
                   mirror, dbl, man, ref,
                   thread(d, GOLD_WARM, 3.0, gid="s11-thr", glow=False),
                   '</g></svg>'])
    txt = line("עד שגם הוא עצמו הופך לזר.", "s11-t", "tr", 54, 300)
    js = [
      f'tl.fromTo("#s11-cam",{{scale:1.06,svgOrigin:"960 620"}},'
      f'{{scale:1,duration:3.0,ease:"power1.out"}},{S});',
      f'tl.fromTo("#s11-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.25});',
      f'tl.to("#s11-t",{{opacity:0,duration:0.35}},{S+2.45});',
      # this one is swallowed too
      f'tl.fromTo("#s11-thr path",{{strokeDasharray:"{L:.0f}",strokeDashoffset:0}},'
      f'{{strokeDashoffset:{L:.0f},duration:0.65,ease:"power2.in"}},{S+0.45});',
      # the reflection turns away — the same movement as the hand in shot 2
      f'tl.fromTo("#s11-ref",{{scaleX:1,svgOrigin:"1220 620"}},'
      f'{{scaleX:0.16,duration:0.95,ease:"power2.inOut"}},{S+1.00});',
      f'tl.to("#s11-ref",{{opacity:0.12,duration:0.95}},{S+1.00});',
      f'tl.to("#s11-rchest",{{opacity:0,duration:0.5}},{S+1.00});',
      # and the voice that is no longer his steps out from inside him
      f'tl.to("#s11-dbl",{{opacity:0.85,duration:0.7,ease:"power2.out"}},{S+1.70});',
      f'tl.fromTo("#s11-dbl",{{x:0,scaleX:1,svgOrigin:"700 620"}},'
      f'{{x:520,duration:1.25,ease:"power2.out"}},{S+1.65});',
      f'tl.to("#s11-chest",{{opacity:0.2,duration:1.0}},{S+1.6});',
    ]
    return svg + txt, js, {}


# ============================================================ SHOT 12  39.0-42.5
def shot12(S):
    """Rock bottom, told by scale. The camera does not move. Nothing is said."""
    me, ME = figure(946, 830, 236, "idle", color=FIG, gid="s12-me")
    dbl, _ = figure(1046, 830, 228, "idle", color=VIOLET, gid="s12-dbl",
                    opacity=0.66, outline=True)
    sn = tangle(962, 748, 196, 92, 12345, strands=9, n=15, color=GREY, w=2.4,
                gid="s12-snarl", opacity=1.0)
    leash, _ = curve([(962, 726), (1014, 430), (930, 200), (972, -60)])
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">',
                   '<g id="s12-cam">',
                   thread(leash, GREY, 2.8, opacity=0.9),
                   dbl, me, sn,
                   '</g></svg>'])
    js = [
      # the only stillness in the film. one 3% breath, so the frame reads as alive.
      f'tl.fromTo("#s12-snarl",{{opacity:0.95}},'
      f'{{opacity:0.88,duration:1.6,ease:"sine.inOut",yoyo:true,repeat:1}},{S+0.2});',
    ]
    return svg, js, {}
