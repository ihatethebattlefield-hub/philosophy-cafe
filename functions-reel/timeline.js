// Single source of truth for timing. Read by the renderer (as window.TL) and by
// score.py (the object literal below is strict JSON). 120 BPM: beat = 0.5 s.
window.TL = {
  "bpm": 120,
  "fps": 30,
  "duration": 60,
  "speed": 2,
  "_speed": "story time below is played back `speed` times slower: real seconds = story seconds × speed",
  "chapters": [
    {"id": "origin",      "t0": 0,    "t1": 2,    "en": "Origin",                "cn": "起点 · 一颗球，一条线"},
    {"id": "basic",       "t0": 2,    "t1": 6,    "en": "Basic Functions",       "cn": "基本函数"},
    {"id": "transform",   "t0": 6,    "t1": 10,   "en": "Transformations",       "cn": "图像变换"},
    {"id": "inverse",     "t0": 10,   "t1": 14,   "en": "Inverse",               "cn": "反函数"},
    {"id": "reciprocal",  "t0": 14,   "t1": 18,   "en": "Reciprocal",            "cn": "倒数"},
    {"id": "derivative",  "t0": 18,   "t1": 24,   "en": "Derivative",            "cn": "导数"},
    {"id": "integral",    "t0": 24,   "t1": 30,   "en": "Integral",              "cn": "定积分"},
    {"id": "ftc",         "t0": 30,   "t1": 34,   "en": "Accumulation & Rate",   "cn": "积累与变化率"},
    {"id": "composition", "t0": 34,   "t1": 40,   "en": "Composition",           "cn": "复合函数"},
    {"id": "trig",        "t0": 40,   "t1": 44,   "en": "Trigonometry",          "cn": "三角函数"},
    {"id": "polar",       "t0": 44,   "t1": 48,   "en": "Polar & Parametric",    "cn": "极坐标与参数曲线"},
    {"id": "heart",       "t0": 48,   "t1": 52,   "en": "A Parametric Heart",    "cn": "参数方程 · 一颗心"},
    {"id": "morph",       "t0": 52,   "t1": 56,   "en": "Contour Morph",         "cn": "轮廓形变"},
    {"id": "recap",       "t0": 56,   "t1": 57.5, "en": "Recap",                 "cn": "快切回顾"},
    {"id": "silence",     "t0": 57.5, "t1": 58,   "en": "",                      "cn": ""},
    {"id": "logo",        "t0": 58,   "t1": 60,   "en": "",                      "cn": ""}
  ],

  "origin": {"line": [0.0, 0.35], "impacts": [[0.5, 0.45], [1.0, 0.22]], "axes": [1.0, 1.5], "roll": [1.5, 2.0], "push": [1.6, 2.4]},

  "basic": {"morph": 0.35, "arrive": [[2.0, "x"], [2.5, "x2"], [3.5, "x3"], [4.5, "abs"], [5.5, "sqrt"]],
            "general": 5.75},

  "transform": {"dur": 0.4, "handle": [6.0, 6.45],
                "steps": [["h", 6.5, 0, 2], ["k", 7.0, 0, 1], ["a", 7.5, 1, 2], ["a", 8.0, 2, -1], ["b", 8.5, 1, 2], ["b", 9.0, 2, 0.5]]},

  "fold": [9.75, 10.25],

  "inverse": {"axis": 10.0, "draw": [10.4, 11.0], "flip": [11.5, 12.5], "swap": 13.0, "collapse": [13.6, 14.0]},

  "reciprocal": {"open": [14.0, 14.4], "drop": [14.5, 14.9],
                 "keys": [[14.9, 2], [15.0, 2], [15.4, 4], [15.95, 0.2], [16.0, 0.2]],
                 "hop": [16.0, 16.3], "neg": [[16.3, -0.2], [17.0, -1.0]], "compare": 17.0, "shoot": [17.6, 18.0]},

  "derivative": {"x0": 0.5, "arrive": [18.0, 18.3], "q": 18.5, "secant": 19.0, "quot": 19.5,
                 "shrink": [20.0, 21.5], "lim": 21.5, "fprime": 22.0,
                 "trace": [[22.0, 0.5], [22.3, -1.8], [22.5, -1.0], [23.5, 1.0], [23.85, 1.8]]},

  "sweep": [23.85, 24.25],

  "integral": {"n": [[24.0, 4], [26.0, 8], [26.5, 16], [27.0, 32], [27.5, 64]], "fade": [28.0, 28.4],
               "scan": [28.4, 29.5], "result": 29.5},

  "ftc": {"intro": [29.75, 30.5], "scan": [30.5, 32.0], "tangent": [32.0, 33.5], "fprime": 32.5},

  "modules": [33.6, 34.4],

  "composition": {"pass1": [[34.5, "in"], [35.0, "g"], [35.5, "f"], [36.0, "out"]], "symbolic": 36.0, "formula": 36.5,
                  "shift": [36.6, 37.0], "swap": [38.0, 38.35],
                  "pass2": [[38.35, "in"], [38.5, "f"], [39.0, "g"], [39.3, "out"]], "formula2": 39.0, "compare": 39.5},

  "orbit": [39.6, 40.4],

  "trig": {"turn": [40.5, 42.0], "phase": [42.0, 42.5], "amp": [43.0, 43.5]},

  "curl": [43.6, 44.4],

  "polar": {"rose": [44.5, 46.0], "sym": [46.0, 46.5], "morph": [46.65, 47.0], "inf": [47.0, 47.6]},

  "unfold": [47.6, 48.3],

  "heart": {"trace": [48.0, 49.5], "converge": [49.5, 50.5], "pulse": 51.0, "contour": [51.5, 52.0]},

  "morph": {"shapes": [[52.0, "circle"], [52.5, "ellipse"], [53.0, "superellipse"], [53.5, "petal"], [55.5, "heart"]],
            "dur": 0.35, "cloud": [54.0, 55.5]},

  "lattice": [55.75, 56.3],

  "recap": {"city": [56.0, 56.5],
            "cuts": [[56.5, "origin", 0.48], [56.625, "basic", 3.3], [56.75, "transform", 6.7], [56.875, "inverse", 12.0],
                     [57.0, "derivative", 22.7], [57.125, "integral", 26.6], [57.25, "composition", 35.05], [57.375, "polar", 45.6]]},

  "silence": [57.5, 58.0],

  "logo": {"hit": 58.0, "bounce": [[58.0, 0.5], [58.5, 0.18]], "subtitle": [58.5, 58.8], "fade": [59.87, 60.0]}
};
