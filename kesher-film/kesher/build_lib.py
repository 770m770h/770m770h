# -*- coding: utf-8 -*-
"""Shared drawing vocabulary for KESHER."""
import math, base64, os

W, H = 1920, 1080

BG        = "#08080E"
INK       = "#1B1B24"      # figure fill on dark ground (rim-lit silhouettes)
FIG       = "#3D4158"      # near figures
FIG_DIM   = "#2B2E40"      # far figures
GOLD      = "#F5B942"
GOLD_WARM = "#E8A33D"
GREY      = "#7E869A"      # dormant thread
GREY_DK   = "#3F4653"
VIOLET    = "#A78BFA"
PINK      = "#F472B6"
TEXT      = "#F5F2EA"

# ---------------------------------------------------------------- geometry

def _catmull(points, tension=0.5):
    """Catmull-Rom through points -> cubic bezier 'd' string."""
    if len(points) < 2:
        return ""
    p = [points[0]] + list(points) + [points[-1]]
    d = "M %.2f %.2f" % (points[0][0], points[0][1])
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i-1], p[i], p[i+1], p[i+2]
        c1 = (p1[0] + (p2[0]-p0[0]) * tension / 3.0, p1[1] + (p2[1]-p0[1]) * tension / 3.0)
        c2 = (p2[0] - (p3[0]-p1[0]) * tension / 3.0, p2[1] - (p3[1]-p1[1]) * tension / 3.0)
        d += " C %.2f %.2f %.2f %.2f %.2f %.2f" % (c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    return d


def _sample_len(points, tension=0.5, steps=24):
    """Approximate arc length of the catmull-rom curve through points."""
    if len(points) < 2:
        return 0.0
    p = [points[0]] + list(points) + [points[-1]]
    total = 0.0
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i-1], p[i], p[i+1], p[i+2]
        c1 = (p1[0] + (p2[0]-p0[0]) * tension / 3.0, p1[1] + (p2[1]-p0[1]) * tension / 3.0)
        c2 = (p2[0] - (p3[0]-p1[0]) * tension / 3.0, p2[1] - (p3[1]-p1[1]) * tension / 3.0)
        prev = p1
        for s in range(1, steps + 1):
            t = s / float(steps)
            mt = 1 - t
            x = mt**3*p1[0] + 3*mt*mt*t*c1[0] + 3*mt*t*t*c2[0] + t**3*p2[0]
            y = mt**3*p1[1] + 3*mt*mt*t*c1[1] + 3*mt*t*t*c2[1] + t**3*p2[1]
            total += math.hypot(x - prev[0], y - prev[1])
            prev = (x, y)
    return total


def curve(points, tension=0.5):
    """-> (d_string, length)"""
    return _catmull(points, tension), _sample_len(points, tension)


def sag(a, b, amount, n=5, tension=0.5):
    """A hanging catenary-ish curve from a to b with `amount` px of droop."""
    pts = []
    for i in range(n + 1):
        t = i / float(n)
        x = a[0] + (b[0] - a[0]) * t
        y = a[1] + (b[1] - a[1]) * t
        y += amount * math.sin(math.pi * t)
        pts.append((x, y))
    return curve(pts, tension)


class Rand:
    """Deterministic LCG — author-time only, so renders are byte-stable."""
    def __init__(self, seed):
        self.s = seed & 0xFFFFFFFF
    def next(self):
        self.s = (1103515245 * self.s + 12345) & 0x7FFFFFFF
        return self.s / float(0x7FFFFFFF)
    def rng(self, a, b):
        return a + (b - a) * self.next()
    def pick(self, seq):
        return seq[int(self.next() * len(seq)) % len(seq)]

# ---------------------------------------------------------------- figures

def arm(sh, hand, sw, color=FIG, gid=None, bow=0.0, opacity=1.0):
    """A single arm as its own path so it can be rotated about the shoulder."""
    mx = (sh[0] + hand[0]) / 2.0 + bow
    my = (sh[1] + hand[1]) / 2.0 + abs(sw) * 1.4
    return ('<path id="%s" d="M %.1f %.1f Q %.1f %.1f %.1f %.1f" stroke="%s" '
            'stroke-width="%.2f" stroke-linecap="round" fill="none" opacity="%.2f" />'
            % (gid, sh[0], sh[1], mx, my, hand[0], hand[1], color, sw, opacity))


def figure(cx, base, h, pose="idle", color=FIG, gid=None, chest=None,
           opacity=1.0, extra="", hide=None, child=False, outline=False):
    """A filled flat-vector silhouette. No faces, no features — one warm dot
    at the chest for the person's own light. Returns (svg, anchors)."""
    seated = (pose == "seated")
    aw = h * (0.088 if child else 0.078)
    hr = h * (0.128 if child else (0.092 if not seated else 0.100))

    if seated:
        head_cy = base - h * 0.78
        crown   = base - h * 0.700
        shy     = base - h * 0.645
        sw      = h * 0.150
        hipy    = base - h * 0.250
        hipw    = h * 0.140
        body = (
            "M %.1f %.1f C %.1f %.1f %.1f %.1f %.1f %.1f "
            "C %.1f %.1f %.1f %.1f %.1f %.1f L %.1f %.1f "
            "Q %.1f %.1f %.1f %.1f L %.1f %.1f Q %.1f %.1f %.1f %.1f Z"
            % (cx - sw, shy,
               cx - sw, crown, cx - sw * 0.52, crown - h * 0.022, cx, crown - h * 0.022,
               cx + sw * 0.52, crown - h * 0.022, cx + sw, crown, cx + sw, shy,
               cx + hipw, hipy,
               cx + hipw, hipy + h * 0.045, cx + hipw - h * 0.03, hipy + h * 0.045,
               cx - hipw + h * 0.03, hipy + h * 0.045,
               cx - hipw, hipy + h * 0.045, cx - hipw, hipy))
        legs = ('<path d="M %.1f %.1f L %.1f %.1f" stroke="%s" stroke-width="%.1f" '
                'stroke-linecap="round" fill="none"/>'
                '<path d="M %.1f %.1f L %.1f %.1f" stroke="%s" stroke-width="%.1f" '
                'stroke-linecap="round" fill="none"/>'
                % (cx - h * 0.075, hipy + h * 0.04, cx - h * 0.115, base, color, h * 0.075,
                   cx + h * 0.075, hipy + h * 0.04, cx + h * 0.115, base, color, h * 0.075))
        chest_y = base - h * 0.50
        sl = (cx - h * 0.125, shy + h * 0.03)
        sr = (cx + h * 0.125, shy + h * 0.03)
    else:
        if child:
            head_cy = base - h * 0.868
            crown   = base - h * 0.735
            shy     = base - h * 0.680
            sw      = h * 0.150
            hipy    = base - h * 0.380
            hipw    = h * 0.132
            crotch  = base - h * 0.300
            lo, li  = h * 0.126, h * 0.032
        else:
            head_cy = base - h * 0.900
            crown   = base - h * 0.795
            shy     = base - h * 0.735
            sw      = h * 0.152
            hipy    = base - h * 0.420
            hipw    = h * 0.126
            crotch  = base - h * 0.330
            lo, li  = h * 0.120, h * 0.030
        body = (
            "M %.1f %.1f C %.1f %.1f %.1f %.1f %.1f %.1f "
            "C %.1f %.1f %.1f %.1f %.1f %.1f "
            "L %.1f %.1f L %.1f %.1f Q %.1f %.1f %.1f %.1f "
            "L %.1f %.1f L %.1f %.1f L %.1f %.1f "
            "Q %.1f %.1f %.1f %.1f L %.1f %.1f Z"
            % (cx - sw, shy,
               cx - sw, crown, cx - sw * 0.50, crown - h * 0.020, cx, crown - h * 0.020,
               cx + sw * 0.50, crown - h * 0.020, cx + sw, crown, cx + sw, shy,
               cx + hipw, hipy,
               cx + lo, base - h * 0.018,
               cx + lo, base, cx + lo - h * 0.088, base,
               cx + li, crotch,
               cx - li, crotch,
               cx - lo + h * 0.088, base,
               cx - lo, base, cx - lo, base - h * 0.018,
               cx - hipw, hipy))
        legs = ""
        chest_y = base - h * (0.575 if child else 0.620)
        sl = (cx - h * 0.130, shy + h * 0.030)
        sr = (cx + h * 0.130, shy + h * 0.030)

    # arms are drawn only when the pose needs one — the silhouette implies the rest
    hl = hr_ = None
    limbs = ""
    ay = 0.645 if child else 0.700
    if pose in ("reach_l", "hold_l", "up_l"):
        hl = {"reach_l": (cx - h * 0.470, base - h * ay),
              "hold_l":  (cx - h * 0.330, base - h * (ay - 0.18)),
              "up_l":    (cx - h * 0.380, base - h * 0.930)}[pose]
        if hide != "l":
            limbs += arm(sl, hl, aw, color, gid=(gid + "-arm") if gid else None,
                         bow=-h * 0.02)
    if pose in ("reach_r", "hold_r", "up_r"):
        hr_ = {"reach_r": (cx + h * 0.470, base - h * ay),
               "hold_r":  (cx + h * 0.330, base - h * (ay - 0.18)),
               "up_r":    (cx + h * 0.380, base - h * 0.930)}[pose]
        if hide != "r":
            limbs += arm(sr, hr_, aw, color, gid=(gid + "-arm") if gid else None,
                         bow=h * 0.02)
    if hl is None:
        hl = (cx - h * 0.150, base - h * 0.470)
    if hr_ is None:
        hr_ = (cx + h * 0.150, base - h * 0.470)

    dot = ""
    if chest:
        dot = ('<circle id="%s" cx="%.1f" cy="%.1f" r="%.2f" fill="%s" />'
               % (chest, cx, chest_y, max(2.2, h * 0.042), GOLD))

    gid_attr = ' id="%s"' % gid if gid else ""
    if outline:
        # a hollow echo of a person, not a second person
        ow = max(1.6, h * 0.016)
        svg = ('<g%s class="fig" opacity="%.3f" fill="none" stroke="%s" '
               'stroke-width="%.2f" stroke-linejoin="round"%s>'
               '<circle cx="%.1f" cy="%.1f" r="%.2f"/>'
               '<path d="%s"/>%s%s</g>'
               % (gid_attr, opacity, color, ow, (" " + extra) if extra else "",
                  cx, head_cy, hr, body,
                  legs.replace('stroke="%s"' % color, 'stroke="%s"' % color), dot))
    else:
        svg = ('<g%s class="fig" opacity="%.3f"%s>'
               '<circle cx="%.1f" cy="%.1f" r="%.2f" fill="%s"/>'
               '<path d="%s" fill="%s"/>%s%s%s</g>'
               % (gid_attr, opacity, (" " + extra) if extra else "",
                  cx, head_cy, hr, color, body, color, legs, limbs, dot))

    return svg, {"hand_l": hl, "hand_r": hr_, "chest": (cx, chest_y),
                 "head": (cx, head_cy), "base": (cx, base), "sw": aw,
                 "sh_l": sl, "sh_r": sr}


def forearm(entry, wrist, w, color=FIG, gid=None, opacity=1.0):
    """A forearm ending in an open palm — never a pipe with a ball on it."""
    ang = math.atan2(wrist[1] - entry[1], wrist[0] - entry[0])
    px, py = wrist[0] + math.cos(ang) * w * 0.42, wrist[1] + math.sin(ang) * w * 0.42
    deg = ang * 180 / math.pi
    tx = px + math.cos(ang - 1.15) * w * 0.62
    ty = py + math.sin(ang - 1.15) * w * 0.62
    gid_attr = ' id="%s"' % gid if gid else ""
    return ('<g%s opacity="%.2f">'
            '<path d="M %.1f %.1f L %.1f %.1f" stroke="%s" stroke-width="%.1f" '
            'stroke-linecap="round" fill="none"/>'
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" '
            'transform="rotate(%.1f %.1f %.1f)"/>'
            '<ellipse cx="%.1f" cy="%.1f" rx="%.1f" ry="%.1f" fill="%s" '
            'transform="rotate(%.1f %.1f %.1f)"/></g>'
            % (gid_attr, opacity,
               entry[0], entry[1], wrist[0], wrist[1], color, w,
               px, py, w * 0.80, w * 0.56, color, deg, px, py,
               tx, ty, w * 0.34, w * 0.24, color, deg, tx, ty))


def coil(a, b, turns, r0, r1, color=GOLD_WARM, gid=None, w=4.0, opacity=1.0):
    """A thread winding around a limb from a to b. Returns (svg, length)."""
    ang = math.atan2(b[1] - a[1], b[0] - a[0]) + math.pi / 2
    segs = []
    for i in range(turns):
        t = i / float(max(1, turns - 1))
        x = a[0] + (b[0] - a[0]) * t
        y = a[1] + (b[1] - a[1]) * t
        r = r0 + (r1 - r0) * t
        segs.append("M %.1f %.1f a %.1f %.1f %.1f 1 1 0.1 0"
                    % (x - r * math.cos(ang), y - r * math.sin(ang),
                       r, r * 0.40, ang * 180 / math.pi))
    d = " ".join(segs)
    L = turns * 2 * math.pi * ((r0 + r1) / 2.0) * 0.72
    return ('<path id="%s" d="%s" stroke="%s" stroke-width="%.1f" fill="none" '
            'stroke-linecap="round" opacity="%.2f" stroke-dasharray="%.0f" '
            'stroke-dashoffset="%.0f"/>' % (gid, d, color, w, opacity, L, L)), L


# ---------------------------------------------------------------- threads

def thread(d, color=GOLD, w=2.6, gid=None, opacity=1.0, glow=True, cls="thr",
           dash=None):
    """A luminous thread: three stacked strokes, no filters (no banding, free).

    dash=<length> pre-arms every layer for a draw-on (offset == length == hidden).
    """
    gid_attr = ' id="%s"' % gid if gid else ""
    da = ('stroke-dasharray="%.1f" stroke-dashoffset="%.1f" ' % (dash, dash)) if dash else ""
    layers = []
    if glow:
        layers.append('<path d="%s" stroke="%s" stroke-width="%.1f" opacity="0.055" '
                      '%sfill="none" stroke-linecap="round" />' % (d, color, w * 5.4, da))
        layers.append('<path d="%s" stroke="%s" stroke-width="%.1f" opacity="0.13" '
                      '%sfill="none" stroke-linecap="round" />' % (d, color, w * 2.4, da))
    layers.append('<path d="%s" stroke="%s" stroke-width="%.2f" opacity="1" %sfill="none" '
                  'stroke-linecap="round" />' % (d, color, w, da))
    return ('<g%s class="%s" opacity="%.3f">%s</g>'
            % (gid_attr, cls, opacity, "".join(layers)))


def draw_path(d, length, color=GOLD, w=2.6, gid=None, opacity=1.0):
    """A single stroke pre-set for a draw-on (dasharray = length)."""
    return ('<path id="%s" d="%s" stroke="%s" stroke-width="%.2f" fill="none" '
            'stroke-linecap="round" opacity="%.3f" '
            'stroke-dasharray="%.1f" stroke-dashoffset="%.1f" />'
            % (gid, d, color, w, opacity, length, length))


def pulse_path(d, gid, color=GOLD, w=3.4, dash=16, gap=260, opacity=0.95):
    """Travelling pulse dashes riding a thread. Direction is set by the tween."""
    return ('<path id="%s" d="%s" stroke="%s" stroke-width="%.2f" fill="none" '
            'stroke-linecap="round" opacity="%.2f" stroke-dasharray="%d %d" '
            'stroke-dashoffset="0" />' % (gid, d, color, w, opacity, dash, gap))


def circle_path(cx, cy, r):
    """A full circle as a path, centred exactly on (cx, cy) — an `a` arc back to
    its own start point is not centred where you think it is."""
    d = ("M %.1f %.1f A %.1f %.1f 0 1 1 %.1f %.1f A %.1f %.1f 0 1 1 %.1f %.1f"
         % (cx - r, cy, r, r, cx + r, cy, r, r, cx - r, cy))
    return d, 2 * math.pi * r


def knot(x, y, r=7.0, gid=None, color=GOLD, opacity=1.0):
    """A visible tie: a small looped overhand knot glyph."""
    gid_attr = ' id="%s"' % gid if gid else ""
    d = ("M %.1f %.1f C %.1f %.1f %.1f %.1f %.1f %.1f "
         "C %.1f %.1f %.1f %.1f %.1f %.1f" %
         (x - r*1.5, y + r*0.5,  x - r*0.7, y - r*1.25,  x + r*0.85, y - r*0.95,
          x + r*0.35, y + r*0.35,
          x - r*0.55, y + r*1.15,  x + r*0.75, y + r*1.05,  x + r*1.5, y - r*0.35))
    return ('<g%s class="knot" opacity="%.2f">'
            '<path d="%s" stroke="%s" stroke-width="%.1f" fill="none" opacity="0.14" '
            'stroke-linecap="round"/>'
            '<path d="%s" stroke="%s" stroke-width="%.1f" fill="none" '
            'stroke-linecap="round"/></g>'
            % (gid_attr, opacity, d, color, r*1.15, d, color, r*0.44))

# ---------------------------------------------------------------- typography

def line(text, gid, pos="br", size=54, weight=300, color=TEXT, track="-0.005em",
         width=1180, lh=1.32):
    """A Hebrew display line. RTL, right-aligned, masked reveal wrapper."""
    zones = {
        "br": 'right:150px; bottom:132px; text-align:right;',
        "tr": 'right:150px; top:132px;    text-align:right;',
        "cc": 'left:0; right:0; top:44%%; text-align:center;',
        "cb": 'left:0; right:0; bottom:150px; text-align:center;',
        "bl": 'left:150px; bottom:132px;  text-align:left;',
    }
    z = zones.get(pos, zones["br"])
    if pos in ("cc", "cb"):
        wrap_w = ""
    else:
        wrap_w = "width:%dpx;" % width
    rows = "".join('<div class="lnrow">%s</div>' % t for t in text.split("<br>"))
    return ('<div class="ln" id="%s" dir="rtl" data-layout-allow-caption-zone="true" '
            'style="position:absolute; %s %s font-weight:%d; font-size:%dpx; '
            'line-height:%.2f; letter-spacing:%s; color:%s; opacity:0;">%s</div>'
            % (gid, z, wrap_w, weight, size, lh, track, color, rows))

# ---------------------------------------------------------------- misc

def vignette(strength=0.62):
    return ('<div class="vig" style="position:absolute; inset:0; pointer-events:none;'
            'background: radial-gradient(120%% 90%% at 50%% 46%%, rgba(0,0,0,0) 38%%, '
            'rgba(0,0,0,%.2f) 100%%);"></div>' % strength)


def b64(path):
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("ascii")
