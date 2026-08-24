# -*- coding: utf-8 -*-
"""KESHER — Act One: the wound, the substitute bond. Shots 1-6."""
from build_lib import *

GROUND = 900

# ============================================================ SHOT 1  0.0-3.5
def shot1(S):
    ad,  A = figure(1540, GROUND, 430, "reach_l", color=FIG, gid="s1-adult")
    ch,  C = figure(520,  GROUND, 235, "idle",    color=FIG, gid="s1-child",
                    chest="s1-chest", child=True)
    d, L = sag(A["hand_l"], C["chest"], 26)

    svg = ("".join([
        '<svg class="cv" viewBox="0 0 1920 1080">',
        '<g id="s1-cam">',
        ad, ch,
        thread(d, GOLD, 2.8, gid="s1-thr", dash=L),
        pulse_path(d, "s1-pulse", GOLD, 3.6, 13, 250, 0.0),
        '</g></svg>'
    ]))
    txt = line("אף אחד לא נולד מכור.", "s1-t", "br", 56, 300)

    js = [
      f'tl.fromTo("#s1-cam",{{scale:1.62,x:-655,y:-96,svgOrigin:"960 540"}},'
      f'{{scale:1,x:0,y:0,duration:3.1,ease:"power2.inOut"}},{S});',
      f'tl.fromTo("#s1-thr path",{{strokeDashoffset:{L:.1f}}},'
      f'{{strokeDashoffset:0,duration:1.15,ease:"expo.out"}},{S+0.05});',
      f'tl.fromTo("#s1-adult",{{opacity:0}},{{opacity:1,duration:0.5}},{S});',
      f'tl.fromTo("#s1-child",{{opacity:0}},{{opacity:0,duration:0.01}},{S});',
      f'tl.to("#s1-child",{{opacity:1,duration:0.7,ease:"power2.out"}},{S+0.85});',
      f'tl.to("#s1-chest",{{opacity:1,duration:0.5}},{S+1.1});',
      # pulses travel adult -> child (toward the child = being held)
      f'tl.to("#s1-pulse",{{opacity:0.9,duration:0.4}},{S+1.15});',
      f'tl.fromTo("#s1-pulse",{{strokeDashoffset:0}},'
      f'{{strokeDashoffset:-{3*263},duration:2.3,ease:"none"}},{S+1.15});',
      f'tl.fromTo("#s1-chest",{{scale:1,svgOrigin:"{C["chest"][0]} {C["chest"][1]}"}},'
      f'{{scale:1.5,duration:0.55,ease:"sine.inOut",yoyo:true,repeat:2}},{S+1.4});',
      f'tl.fromTo("#s1-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.6,ease:"power2.out"}},{S+1.45});',
      f'tl.to("#s1-t",{{opacity:0,duration:0.35}},{S+3.15});',
    ]
    return svg + txt, js, {"hand": A["hand_l"], "chest": C["chest"], "L": L, "d": d}


# ============================================================ SHOT 2  3.5-7.5
def shot2(S, prev):
    ad, A = figure(1540, GROUND, 430, "reach_l", color=FIG, gid="s2-adult", hide="l")
    ch, C = figure(520,  GROUND, 235, "idle",    color=FIG, gid="s2-child",
                   chest="s2-chest", child=True)
    # the OCCUPIED hand: she is already holding three grey lines that run off-frame.
    occ = []
    for i, dy in enumerate((-26, 4, 34)):
        p, _ = curve([A["hand_r"], (1740, A["hand_r"][1] + dy * 1.4),
                      (1930, A["hand_r"][1] + dy * 2.6)])
        occ.append('<path d="%s" stroke="%s" stroke-width="2.4" fill="none" '
                   'opacity="0.5" stroke-linecap="round"/>' % (p, GREY))
    armsvg = arm(A["sh_l"], A["hand_l"], A["sw"], FIG, gid="s2-arm")

    taut, L = sag(A["hand_l"], C["chest"], 26)
    slack, _ = sag(A["hand_l"], C["chest"], 150)
    dead,  _ = curve([(1352, 690), (1180, 838), (900, 892), (640, 886), C["chest"]])

    svg = "".join([
        '<svg class="cv" viewBox="0 0 1920 1080">',
        '<g id="s2-cam">',
        "".join(occ), ad, armsvg, ch,
        thread(dead,  GREY, 2.6, gid="s2-dead",  opacity=0),
        thread(slack, GOLD, 2.8, gid="s2-slack", opacity=0),
        thread(taut,  GOLD, 2.8, gid="s2-taut"),
        '</g></svg>'
    ])
    txt = line("לפעמים היד שבצד השני כבר מלאה.", "s2-t", "br", 54, 300)

    ox, oy = A["sh_l"]
    js = [
      f'tl.fromTo("#s2-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.55,ease:"power2.out"}},{S+0.35});',
      f'tl.to("#s2-t",{{opacity:0,duration:0.4}},{S+3.4});',
      # she is at capacity: the occupied lines tug at her
      f'tl.fromTo("#s2-adult",{{x:0}},{{x:9,duration:1.6,ease:"sine.inOut"}},{S+0.4});',
      # the arm gives way — slowly, tiredly, never a full turn
      f'tl.fromTo("#s2-arm",{{rotation:0,svgOrigin:"{ox:.0f} {oy:.0f}"}},'
      f'{{rotation:34,duration:1.5,ease:"power1.inOut"}},{S+0.9});',
      # gold drains out of the thread toward her, and it sags
      f'tl.to("#s2-taut",{{opacity:0,duration:0.5}},{S+1.25});',
      f'tl.to("#s2-slack",{{opacity:1,duration:0.5}},{S+1.25});',
      f'tl.to("#s2-slack",{{opacity:0,duration:0.55}},{S+2.05});',
      f'tl.to("#s2-dead",{{opacity:1,duration:0.55}},{S+2.05});',
      f'tl.to("#s2-chest",{{opacity:0.28,duration:1.4,ease:"power2.in"}},{S+1.9});',
      f'tl.fromTo("#s2-child",{{y:0}},{{y:5,duration:1.8,ease:"power2.out"}},{S+2.0});',
    ]
    return svg + txt, js, {"chest": C["chest"]}


# ============================================================ SHOT 3  7.5-10.5
def shot3(S):
    ch, C = figure(720, GROUND, 330, "hold_l", color=FIG, gid="s3-child",
                   chest="s3-chest", child=True)
    wrist = C["hand_l"]
    far = [(1620, 892), (1310, 900), (1030, 884)]
    states = []
    for i, f in enumerate(far):
        d, _ = curve([f, ((f[0] + wrist[0]) / 2, 906), wrist])
        states.append(thread(d, GREY, 2.6, gid="s3-l%d" % i,
                             opacity=1.0 if i == 0 else 0.0))
    sh, aw = C["sh_l"], C["sw"]
    p0 = (sh[0] + (wrist[0] - sh[0]) * 0.34, sh[1] + (wrist[1] - sh[1]) * 0.34)
    p1 = (sh[0] + (wrist[0] - sh[0]) * 0.97, sh[1] + (wrist[1] - sh[1]) * 0.97)
    cl_svg, cl = coil(p0, p1, 7, aw * 0.82, aw * 0.66, color=GREY,
                      gid="s3-coil", w=3.4)
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s3-cam">',
                   ch, "".join(states), cl_svg, '</g></svg>'])
    txt = (line("אז הילד מחזיק את הקצה לבד.", "s3-t", "br", 54, 300)
           + '<div class="bigword" id="s3-big" dir="rtl" style="position:absolute;'
             'left:0;right:0;top:16%;text-align:center;font-weight:800;font-size:320px;'
             'color:#F5F2EA;opacity:0;letter-spacing:0.02em;">לבד</div>')
    js = [
      f'tl.fromTo("#s3-cam",{{scale:1.0,y:0,svgOrigin:"760 700"}},'
      f'{{scale:1.32,y:-14,duration:3.0,ease:"power1.inOut"}},{S});',
      f'tl.fromTo("#s3-big",{{opacity:0,scale:1.06,transformOrigin:"960px 380px"}},'
      f'{{opacity:0.06,scale:1,duration:1.2,ease:"power2.out"}},{S+0.5});',
      f'tl.fromTo("#s3-coil",{{strokeDashoffset:{cl:.0f}}},'
      f'{{strokeDashoffset:0,duration:1.6,ease:"power1.inOut"}},{S+0.4});',
      # every wind visibly shortens the line: the far end retreats out of reach
      f'tl.to("#s3-l0",{{opacity:0,duration:0.26}},{S+0.85});',
      f'tl.to("#s3-l1",{{opacity:1,duration:0.26}},{S+0.85});',
      f'tl.to("#s3-l1",{{opacity:0,duration:0.26}},{S+1.5});',
      f'tl.to("#s3-l2",{{opacity:1,duration:0.26}},{S+1.5});',
      f'tl.fromTo("#s3-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.55,ease:"power2.out"}},{S+1.0});',
      f'tl.to("#s3-t",{{opacity:0,duration:0.35}},{S+2.55});',
      f'tl.to("#s3-chest",{{opacity:0.4,duration:1.6}},{S+1.0});',
    ]
    return svg + txt, js, {"wrist": wrist}


# ============================================================ SHOT 4  10.5-13.5
def shot4(S):
    # placed by hand: three depths, uneven spacing, nobody sharing a baseline
    others = [(286, 940, 296), (1672, 966, 318), (600, 806, 222),
              (1452, 786, 206), (966, 726, 166)]
    teen, T = figure(1136, 952, 388, "hold_l", color=FIG, gid="s4-teen",
                     chest="s4-chest")
    back, front, tb, tf = [], [], [], []
    for i, (x, base, h) in enumerate(others):
        col = FIG if h > 260 else FIG_DIM
        f, F = figure(x, base, h, "hold_l", color=col, gid="s4-o%d" % i, opacity=0)
        end = (F["hand_l"][0] - h * 0.34, base + h * 0.03)
        d, _ = curve([F["hand_l"], ((F["hand_l"][0] + end[0]) / 2, base - h * 0.03), end])
        t = '<g id="s4-l%d" opacity="0">%s</g>' % (i, thread(d, GREY, 2.2, glow=False))
        (front if h > 260 else back).append(f)
        (tf if h > 260 else tb).append(t)
    dt, _ = curve([T["hand_l"], (T["hand_l"][0] - 130, 942), (T["hand_l"][0] - 232, 964)])
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s4-cam">',
                   "".join(back), "".join(tb), teen,
                   thread(dt, GREY, 2.5, glow=False), "".join(front), "".join(tf),
                   '</g></svg>'])
    txt = line("ומוצא אחרים שמחזיקים קצה חופשי.", "s4-t", "tr", 54, 300)
    js = [
      f'tl.fromTo("#s4-cam",{{x:230,scale:1.18,svgOrigin:"1136 780"}},'
      f'{{x:0,scale:1,duration:0.9,ease:"expo.out"}},{S});',
      f'tl.fromTo("#s4-t",{{opacity:0,y:16}},{{opacity:1,y:0,duration:0.5,ease:"power2.out"}},{S+0.55});',
      f'tl.to("#s4-t",{{opacity:0,duration:0.35}},{S+2.5});',
    ]
    for i in range(5):
        t = S + 0.5 + i * 0.19
        js.append(f'tl.to("#s4-o{i}",{{opacity:{0.95 if others[i][2] > 260 else 0.62:.2f},'
                  f'duration:0.5,ease:"power2.out"}},{t:.2f});')
        js.append(f'tl.to("#s4-l{i}",{{opacity:0.8,duration:0.5}},{t+0.08:.2f});')
    return svg + txt, js, {}


# ---------------------------------------------------------- the ring geometry
RING = dict(cx=960, cy=632, rx=470, ry=252)

# 18 degrees: any offset that is not a multiple of 30 keeps all six x-positions
# distinct, so front and back figures never stack on the same column.
RING_PHASE = math.pi / 10.0

RING_CORE = (992, 598)

def ring_h(depth):
    return 200 + 200 * depth

def ring_pos(i, n, phase=RING_PHASE):
    th = math.pi / 2 + phase + i * 2 * math.pi / n
    x = RING["cx"] + RING["rx"] * math.cos(th)
    y = RING["cy"] + RING["ry"] * math.sin(th)
    depth = (y - (RING["cy"] - RING["ry"])) / (2.0 * RING["ry"])
    return x, y, depth


# ============================================================ SHOT 5  13.5-17.5
def shot5(S):
    n = 6
    ctr = RING_CORE
    back, front, tb, tf = [], [], [], []
    for i in range(n):
        x, y, depth = ring_pos(i, n)
        h = ring_h(depth)
        f, F = figure(x, y, h, "idle", color=FIG if depth > .5 else FIG_DIM,
                      gid="s5-f%d" % i, opacity=0.0)
        src_pt = F["chest"]
        d, L = curve([src_pt, ((src_pt[0] + ctr[0]) / 2, (src_pt[1] + ctr[1]) / 2 + 26), ctr])
        t = thread(d, "#9C8FC6", 2.3, gid="s5-t%d" % i, dash=L)
        (front if depth >= 0.5 else back).append(f)
        (tf if depth >= 0.5 else tb).append((t, L, i))

    core = ('<g id="s5-core" opacity="0">'
            '<circle cx="%.0f" cy="%.0f" r="118" fill="%s" opacity="0.085"/>'
            '<circle cx="%.0f" cy="%.0f" r="62"  fill="%s" opacity="0.26"/>'
            '<circle cx="%.0f" cy="%.0f" r="25"  fill="#EFE6FF"/></g>'
            % (ctr[0], ctr[1], VIOLET, ctr[0], ctr[1], VIOLET, ctr[0], ctr[1]))

    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s5-cam">',
                   "".join(back), core, "".join(t for t, _, _ in tb),
                   "".join(front), "".join(t for t, _, _ in tf), '</g></svg>'])
    wash = ('<div id="s5-wash" style="position:absolute;inset:0;background:'
            'radial-gradient(46%% 52%% at 50%% 58%%, rgba(167,139,250,0.26) 0%%,'
            'rgba(167,139,250,0.08) 48%%, rgba(8,8,14,0) 80%%);opacity:0;"></div>')
    txt = line("סוף סוף — שייכות.", "s5-t", "cb", 76, 500)
    js = [
      f'tl.fromTo("#s5-cam",{{scale:1.1,y:26,svgOrigin:"960 632"}},'
      f'{{scale:1,y:0,duration:1.6,ease:"power3.out"}},{S});',
    ]
    for i in range(n):
        js.append(f'tl.to("#s5-f{i}",{{opacity:1,duration:0.42}},{S + 0.12*i:.2f});')
    for _, L, i in tb + tf:
        js.append(f'tl.fromTo("#s5-t{i} path",{{strokeDashoffset:{L:.0f}}},'
                  f'{{strokeDashoffset:0,duration:0.75,ease:"power2.inOut"}},{S + 0.95 + 0.09*i:.2f});')
    js += [
      # the centre lights. it moves on strictly linear tweens, always: it is not a person.
      f'tl.to("#s5-core",{{opacity:1,duration:0.5,ease:"none"}},{S+1.55});',
      f'tl.fromTo("#s5-core",{{scale:0.5,svgOrigin:"{ctr[0]} {ctr[1]}"}},'
      f'{{scale:1,duration:0.6,ease:"none"}},{S+1.55});',
      f'tl.to("#s5-wash",{{opacity:1,duration:0.85,ease:"power2.out"}},{S+1.7});',
      f'tl.fromTo("#s5-t",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.6,ease:"power2.out"}},{S+2.15});',
      f'tl.to("#s5-t",{{opacity:0,duration:0.4}},{S+3.4});',
    ]
    # belonging on loan: the ring only stays up while it is fed. a sag runs round it.
    for i in range(n):
        js.append(f'tl.fromTo("#s5-t{i}",{{y:0}},{{y:13,duration:0.44,ease:"sine.inOut",'
                  f'yoyo:true,repeat:1}},{S + 2.85 + 0.10*i:.2f});')
    return svg + wash + txt, js, {"ctr": ctr}


# ============================================================ SHOT 6  17.5-20.5
def shot6(S, prev):
    n = 6
    ctr = RING_CORE
    back, front, tb, tf = [], [], [], []
    for i in range(n):
        x, y, depth = ring_pos(i, n)
        h = ring_h(depth)
        f, F = figure(x, y, h, "idle", color=FIG if depth > .5 else FIG_DIM,
                      gid="s6-f%d" % i, opacity=1.0)
        src_pt = F["chest"]
        d, _ = curve([src_pt, ((src_pt[0] + ctr[0]) / 2, (src_pt[1] + ctr[1]) / 2 + 26), ctr])
        t = thread(d, "#9C8FC6", 2.3, gid="s6-t%d" % i)
        (front if depth >= 0.5 else back).append(f)
        (tf if depth >= 0.5 else tb).append(t)
    core = ('<g id="s6-core">'
            '<circle cx="%.0f" cy="%.0f" r="118" fill="%s" opacity="0.085"/>'
            '<circle cx="%.0f" cy="%.0f" r="62"  fill="%s" opacity="0.26"/>'
            '<circle cx="%.0f" cy="%.0f" r="25"  fill="#EFE6FF"/></g>'
            % (ctr[0], ctr[1], VIOLET, ctr[0], ctr[1], VIOLET, ctr[0], ctr[1]))
    svg = "".join(['<svg class="cv" viewBox="0 0 1920 1080">', '<g id="s6-cam">',
                   "".join(back), core, "".join(tb), "".join(front), "".join(tf),
                   '</g></svg>'])
    wash = ('<div id="s6-wash" style="position:absolute;inset:0;background:'
            'radial-gradient(46%% 52%% at 50%% 58%%, rgba(167,139,250,0.26) 0%%,'
            'rgba(167,139,250,0.08) 48%%, rgba(8,8,14,0) 80%%);opacity:1;"></div>')
    txt = line("אבל הקשר אף פעם לא היה ביניהם.", "s6-t", "cb", 62, 300)
    js = [f'tl.to("#s6-wash",{{opacity:0.30,duration:1.5,ease:"power2.in"}},{S+0.45});']
    for i in range(n):
        t = S + 0.40 + i * 0.13
        js.append(f'tl.to("#s6-f{i}",{{opacity:0,duration:0.80,ease:"power2.in"}},{t:.2f});')
        js.append(f'tl.fromTo("#s6-f{i}",{{y:0}},{{y:-30,duration:1.2,ease:"power1.out"}},{t:.2f});')
    js += [
      f'tl.fromTo("#s6-t",{{opacity:0,y:20}},{{opacity:1,y:0,duration:0.6,ease:"power2.out"}},{S+1.30});',
      f'tl.to("#s6-t",{{opacity:0,duration:0.4}},{S+2.55});',
      f'tl.fromTo("#s6-core",{{scale:1,svgOrigin:"{ctr[0]} {ctr[1]}"}},'
      f'{{scale:1.14,duration:2.4,ease:"none"}},{S+0.5});',
    ]
    return svg + wash + txt, js, {"ctr": ctr}
