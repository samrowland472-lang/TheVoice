(function () {
  if (window.__voiceDawSession) return;
  window.__voiceDawSession = true;

  var SCENES = 8;
  var STEPS = 16;
  var BARS = 32;
  var STEPS_PER_BAR = 16;
  var BAR_W = 56;
  var LANE_H = 48;
  var COLORS = ["#3fc6ff", "#ffb238", "#7dffb3", "#ff6b8a", "#c9a6ff", "#ffe08a"];
  var TRACKS = [
    { id: "drums", name: "Drums", kind: "drums" },
    { id: "bass", name: "Bass", kind: "bass" },
    { id: "keys", name: "Keys", kind: "keys" },
    { id: "lead", name: "Lead", kind: "lead" },
    { id: "pad", name: "Pad", kind: "pad" },
    { id: "perc", name: "Perc", kind: "perc" },
  ];

  function emptyGrid() {
    var g = [];
    for (var i = 0; i < STEPS; i++) g.push(0);
    return g;
  }

  function clip(name, color, notes) {
    return { name: name, color: color, notes: notes, length: STEPS };
  }

  function activeEditableClip() {
    if (state.view === "arrange" && state.selectedArrange) {
      for (var i = 0; i < state.arrangeClips.length; i++) {
        if (state.arrangeClips[i].id === state.selectedArrange) return state.arrangeClips[i];
      }
    }
    return state.selectedSession && state.selectedSession.clip;
  }

  function renameClip(c) {
    if (!c) c = activeEditableClip();
    if (!c) return;
    var next = window.prompt("Clip name", c.name || "");
    if (next == null) return;
    next = String(next).trim();
    if (!next) return;
    pushUndo();
    c.name = next;
    paint();
    paintArrange();
    setMidiLabel(next);
  }

  function cycleClipColor(c) {
    if (!c) c = activeEditableClip();
    if (!c) return;
    pushUndo();
    var i = COLORS.indexOf(c.color);
    c.color = COLORS[(i + 1 + COLORS.length) % COLORS.length];
    paint();
    paintArrange();
    setMidiLabel("Color");
  }

  function cloneNotes(n) {
    var buf = n && n.buffer;
    var copy = JSON.parse(JSON.stringify(n || {}));
    if (buf) copy.buffer = buf;
    return copy;
  }

  function reversedBuffer(buf) {
    if (!buf || !buf.getChannelData) return buf;
    if (buf._rev) return buf._rev;
    ensureAudio();
    var out = ctx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
    for (var c = 0; c < buf.numberOfChannels; c++) {
      var s = buf.getChannelData(c);
      var d = out.getChannelData(c);
      for (var i = 0; i < s.length; i++) d[i] = s[s.length - 1 - i];
    }
    buf._rev = out;
    out._fwd = buf;
    return out;
  }

  function selectedClip() {
    return (state.selectedSession && state.selectedSession.clip) || null;
  }

  function clipXpose(n) {
    return (n && n.transpose) || 0;
  }

  function toggleClipReverse() {
    var clip = selectedClip();
    if (!clip) return;
    if (!clip.notes) clip.notes = {};
    pushUndo();
    clip.notes.reverse = !clip.notes.reverse;
    paint();
    paintWarp();
    paintRoll();
    setMidiLabel(clip.notes.reverse ? "Reverse" : "Forward");
  }

  function nudgeClipTranspose(delta) {
    var clip = selectedClip();
    if (!clip) return;
    if (!clip.notes) clip.notes = {};
    pushUndo();
    clip.notes.transpose = Math.max(-24, Math.min(24, clipXpose(clip.notes) + delta));
    paint();
    paintWarp();
    paintRoll();
    setMidiLabel((clip.notes.transpose > 0 ? "+" : "") + clip.notes.transpose + " st");
  }

  function syncXformUi(rootEl, clip) {
    if (!rootEl) return;
    var n = clip && clip.notes;
    var xp = rootEl.querySelector("[data-xpose]");
    var rv = rootEl.querySelector("[data-rev]");
    if (xp) xp.value = String(n && n.transpose ? n.transpose : 0);
    if (rv) rv.classList.toggle("on", !!(n && n.reverse));
  }

  function bindClipXform(container) {
    var lab = el("label", "daw-ctl");
    lab.appendChild(document.createTextNode("Trans"));
    var inp = document.createElement("input");
    inp.type = "number";
    inp.min = "-24";
    inp.max = "24";
    inp.step = "1";
    inp.value = "0";
    inp.setAttribute("data-xpose", "1");
    inp.setAttribute("aria-label", "Clip transpose in semitones");
    inp.addEventListener("change", function () {
      var clip = selectedClip();
      if (!clip) return;
      if (!clip.notes) clip.notes = {};
      pushUndo();
      clip.notes.transpose = Math.max(-24, Math.min(24, Number(inp.value) || 0));
      setMidiLabel((clip.notes.transpose > 0 ? "+" : "") + clip.notes.transpose + " st");
    });
    lab.appendChild(inp);
    container.appendChild(lab);
    var rev = el("button", "daw-btn", "Rev");
    rev.type = "button";
    rev.setAttribute("data-rev", "1");
    rev.setAttribute("aria-label", "Reverse clip");
    rev.addEventListener("click", toggleClipReverse);
    container.appendChild(rev);
  }

  function makeSet() {
    var tracks = TRACKS.map(function (t, i) {
      return {
        id: t.id,
        name: t.name,
        kind: t.kind,
        color: COLORS[i % COLORS.length],
        volume: 0.85,
        pan: 0,
        mute: false,
        solo: false,
        arm: false,
        sendA: 0,
        sendB: 0,
        role: "midi",
        devices: defaultDevices(t.kind),
        clips: new Array(SCENES).fill(null),
      };
    });

    function put(tid, scene, name, notes) {
      var tr = tracks.find(function (x) {
        return x.id === tid;
      });
      tr.clips[scene] = clip(name, tr.color, notes);
    }

    var k = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0];
    var s = [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    var h = [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0];
    put("drums", 0, "Pulse", { k: k.map(function (v, i) { return i % 8 === 0 ? 1 : 0; }), s: emptyGrid(), h: h });
    put("drums", 1, "Groove", { k: k, s: s, h: h });
    put("drums", 2, "Drive", {
      k: [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0],
      s: [0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1],
      h: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    });

    put("bass", 1, "Root", { seq: [0, -1, -1, -1, 7, -1, -1, -1, 0, -1, 3, -1, 7, -1, -1, 12] });
    put("bass", 2, "Run", { seq: [0, -1, 12, -1, 7, -1, 3, -1, 0, 12, 7, -1, 5, -1, 7, 12] });

    put("keys", 0, "Air", { chord: [0, 3, 7], hits: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0] });
    put("keys", 1, "Stab", { chord: [0, 3, 7], hits: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0] });
    put("keys", 2, "Lift", { chord: [0, 4, 7, 11], hits: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0] });

    put("lead", 2, "Hook", { seq: [12, -1, 15, -1, 12, -1, 19, 17, 15, -1, 12, -1, 10, -1, 12, -1] });

    put("pad", 0, "Wash", { chord: [0, 7, 12], hold: true });
    tracks.find(function (x) { return x.id === "pad"; }).sendB = 0.28;
    put("pad", 1, "Warm", { chord: [0, 3, 7, 10], hold: true });
    put("pad", 2, "Open", { chord: [0, 4, 7, 11], hold: true });

    put("perc", 1, "Shaker", { seq: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1] });
    put("perc", 2, "Rim", { seq: [0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1] });

    return tracks;
  }

  function seedArrange(tracks) {
    var out = [];
    var map = [
      [0, 0, 2],
      [1, 2, 2],
      [2, 4, 4],
    ];
    tracks.forEach(function (tr) {
      map.forEach(function (m) {
        var c = tr.clips[m[0]];
        if (!c) return;
        out.push({
          id: tr.id + "-" + m[0] + "-" + m[1],
          trackId: tr.id,
          start: m[1] * STEPS_PER_BAR,
          length: m[2] * STEPS_PER_BAR,
          name: c.name,
          color: c.color,
          notes: cloneNotes(c.notes),
        });
      });
    });
    return out;
  }

  var state = {
    tracks: makeSet(),
    bpm: 112,
    quantize: 16,
    playing: false,
    step: 0,
    launched: {},
    queued: {},
    selectedSession: null,
    view: "session",
    arrangeClips: [],
    loopOn: true,
    loopStart: 0,
    loopEnd: 8,
    follow: true,
    punch: false,
    selectedArrange: null,
    locators: [],
    selectedLocator: null,
    timeNum: 4,
    timeDen: 4,
    metro: false,
    recording: false,
    countIn: 0,
    swing: 0,
    masterVol: 0.72,
    cueVol: 0.8,
    xfade: 0.5,
    returnAVol: 0.85,
    returnBVol: 0.7,
    rollSnap: 1,
    rollScale: "minor",
    selectedNote: null,
    selectedPad: null,
    selectedTrackId: "drums",
    ccMap: { 7: "volume", 10: "pan", 74: "cutoff" },
    midiHooked: false,
    mode: "prod",
    noteMap: {},
  };
  state.arrangeClips = seedArrange(state.tracks);
  attachDefaultRacks(state.tracks);

  var ctx = null;
  var master = null;
  var cueGain = null;
  var cueTimer = 0;
  var cueNext = 0;
  var cueStep = 0;
  var cueTrack = null;
  var cueClip = null;
  var trackNodes = {};
  var trackGraph = {};
  var masterAnalyser = null;
  var returnAGain = null;
  var returnBGain = null;
  var mixerEl = null;
  var rollEl = null;
  var rollGrid = null;
  var rollKeys = null;
  var rollVel = null;
  var rollTitle = null;
  var noteSeq = 1;
  var rackEl = null;
  var rackPadsEl = null;
  var rackStepsEl = null;
  var rackTitle = null;
  var padVoices = {};
  var devicesEl = null;
  var browserEl = null;
  var libItems = [];
  var liveEl = null;
  var lastAnnouncedBar = -1;
  var meterRaf = 0;
  var timer = 0;
  var nextTime = 0;
  var padHold = {};
  var lastPadClip = {};
  var metroGain = null;
  var taps = [];
  var bpmInput = null;
  var fxDelay = null;
  var fxConv = null;
  var extraReturns = [];
  var trackSeq = 1;
  var audioHold = {};

  function ensureAudio() {
    if (ctx) return;
    var AC = window.AudioContext || window.webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    metroGain = ctx.createGain();
    metroGain.gain.value = 0.9;
    metroGain.connect(ctx.destination);
    masterAnalyser = ctx.createAnalyser();
    masterAnalyser.fftSize = 256;
    master.connect(masterAnalyser);
    masterAnalyser.connect(ctx.destination);
    master.gain.value = state.masterVol;
    cueGain = ctx.createGain();
    cueGain.gain.value = state.cueVol == null ? 0.8 : state.cueVol;
    cueGain.connect(ctx.destination);

    var delay = ctx.createDelay(1.0);
    delay.delayTime.value = 0.38;
    var delayFb = ctx.createGain();
    delayFb.gain.value = 0.32;
    var delayFilt = ctx.createBiquadFilter();
    delayFilt.type = "lowpass";
    delayFilt.frequency.value = 2400;
    fxDelay = delay;
    delay.connect(delayFilt);
    delayFilt.connect(delayFb);
    delayFb.connect(delay);
    returnAGain = ctx.createGain();
    returnAGain.gain.value = state.returnAVol;
    delay.connect(returnAGain);
    returnAGain.connect(master);

    var conv = ctx.createConvolver();
    var impLen = Math.floor(ctx.sampleRate * 1.3);
    var imp = ctx.createBuffer(2, impLen, ctx.sampleRate);
    for (var ch = 0; ch < 2; ch++) {
      var d = imp.getChannelData(ch);
      for (var i = 0; i < impLen; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impLen, 2.4);
      }
    }
    fxConv = conv;
    conv.buffer = imp;
    returnBGain = ctx.createGain();
    returnBGain.gain.value = state.returnBVol;
    conv.connect(returnBGain);
    returnBGain.connect(master);

    state.tracks.forEach(function (tr) {
      wireTrack(tr);
    });
    ensureDeckGraph();
    applyMix();
    startMeters();
    hookMidi();
  }

  function defaultDevices(kind) {
    var midi = kind !== "drums" && kind !== "perc" && kind !== "audio";
    return [
      { type: "analog", on: midi, wave: kind === "lead" ? "square" : kind === "keys" || kind === "pad" ? "triangle" : "sawtooth", cutoff: kind === "bass" ? 520 : 2400, res: 0.85, attack: 0.01, decay: 0.22 },
      { type: "scale", on: false, mode: "minor", root: 0 },
      { type: "chord", on: false, intervals: "maj" },
      { type: "arp", on: false, rate: 1, style: "up", oct: 1, gate: 0.7 },
      { type: "eq", on: true, low: 0, mid: 0, high: 0 },
      { type: "comp", on: kind === "drums" || kind === "bass" || kind === "perc", thresh: -18, ratio: 3.2, attack: 0.01, release: 0.14 },
      { type: "delay", on: kind === "pad" || kind === "lead", time: 0.3, fb: 0.28, mix: 0.2 },
      { type: "auto", on: false, mode: "lowpass", freq: 1400, res: 2.2, rate: 0.35, amt: 900 },
      { type: "chorus", on: kind === "pad", rate: 0.75, depth: 0.0035, mix: 0.32, fb: 0.12 },
      { type: "util", on: true, gain: 0, width: 1, dc: false, invert: false },
    ];
  }

  function getDevice(tr, type) {
    if (!tr.devices) tr.devices = defaultDevices(tr.kind);
    for (var i = 0; i < tr.devices.length; i++) {
      if (tr.devices[i].type === type) return tr.devices[i];
    }
    return null;
  }

  function analogOf(tr) {
    var d = getDevice(tr, "analog");
    return d && d.on ? d : null;
  }

  function ensureMidiFx(tr) {
    if (!tr || tr.kind === "drums" || tr.kind === "perc" || tr.kind === "audio") return;
    if (!tr.devices) tr.devices = defaultDevices(tr.kind);
    var types = {};
    tr.devices.forEach(function (d) { types[d.type] = true; });
    function add(dev, after) {
      if (types[dev.type]) return;
      var idx = -1;
      for (var i = 0; i < tr.devices.length; i++) {
        if (tr.devices[i].type === after) idx = i;
      }
      tr.devices.splice(idx + 1, 0, dev);
      types[dev.type] = true;
    }
    add({ type: "scale", on: false, mode: "minor", root: 0 }, "analog");
    add({ type: "chord", on: false, intervals: "maj" }, "scale");
    add({ type: "arp", on: false, rate: 1, style: "up", oct: 1, gate: 0.7 }, "chord");
  }

  function ensureAudioFx(tr) {
    if (!tr) return;
    if (!tr.devices) tr.devices = defaultDevices(tr.kind);
    var types = {};
    tr.devices.forEach(function (d) { types[d.type] = true; });
    function add(dev, after) {
      if (types[dev.type]) return;
      var idx = -1;
      for (var i = 0; i < tr.devices.length; i++) {
        if (tr.devices[i].type === after) idx = i;
      }
      tr.devices.splice(idx + 1, 0, dev);
      types[dev.type] = true;
    }
    add({ type: "auto", on: false, mode: "lowpass", freq: 1400, res: 2.2, rate: 0.35, amt: 900 }, "delay");
    add({ type: "chorus", on: false, rate: 0.75, depth: 0.0035, mix: 0.32, fb: 0.12 }, "auto");
    add({ type: "util", on: true, gain: 0, width: 1, dc: false, invert: false }, "chorus");
  }

  function snapScalePitch(pitch, mode, root) {
    var tones = SCALE_TONES[mode] || SCALE_TONES.minor;
    root = ((root || 0) % 12 + 12) % 12;
    var pc = ((pitch - root) % 12 + 12) % 12;
    if (tones.indexOf(pc) >= 0) return pitch;
    for (var d = 1; d <= 6; d++) {
      if (tones.indexOf((pc + d) % 12) >= 0) return pitch + d;
      if (tones.indexOf((pc - d + 12) % 12) >= 0) return pitch - d;
    }
    return pitch;
  }

  function chordIntervals(kind) {
    var map = {
      "5": [0, 7],
      maj: [0, 4, 7],
      min: [0, 3, 7],
      sus4: [0, 5, 7],
      maj7: [0, 4, 7, 11],
      min7: [0, 3, 7, 10],
    };
    return map[kind] || [0, 4, 7];
  }

  function arpPick(pitches, step, style, octaves) {
    var pool = [];
    var o;
    for (o = 0; o < Math.max(1, octaves || 1); o++) {
      pitches.forEach(function (p) { pool.push(p + o * 12); });
    }
    if (!pool.length) return pitches;
    var n = pool.length;
    var i = ((step % n) + n) % n;
    if (style === "down") i = n - 1 - i;
    else if (style === "updown") {
      var cycle = Math.max(1, n * 2 - 2);
      var m = ((step % cycle) + cycle) % cycle;
      i = m < n ? m : cycle - m;
    } else if (style === "rand") i = Math.floor(Math.random() * n);
    return [pool[i]];
  }

  function midiOut(track, pitches, step) {
    ensureMidiFx(track);
    var out = (pitches || []).slice();
    var sc = getDevice(track, "scale");
    var ch = getDevice(track, "chord");
    var ar = getDevice(track, "arp");
    if (sc && sc.on) {
      out = out.map(function (p) { return snapScalePitch(p, sc.mode || "minor", sc.root || 0); });
    }
    if (ch && ch.on) {
      var next = [];
      out.forEach(function (p) {
        chordIntervals(ch.intervals || "maj").forEach(function (s) { next.push(p + s); });
      });
      out = next;
    }
    if (ar && ar.on) {
      var rate = Math.max(1, ar.rate || 1);
      if (step % rate !== 0) return [];
      out = arpPick(out, Math.floor(step / rate), ar.style || "up", ar.oct || 1);
    }
    return out;
  }

  function fireMidi(track, dest, time, pitches, step, asChord) {
    var out = midiOut(track, pitches, step);
    if (!out.length) return;
    if (asChord && out.length > 1 && !(getDevice(track, "arp") && getDevice(track, "arp").on)) {
      trigChord(dest, time, out, 0.28, 0.16, track);
      return;
    }
    out.forEach(function (p) {
      if (track.kind === "bass") trigBass(dest, time, p, track);
      else trigLead(dest, time, p, track);
    });
  }

  function wireTrack(tr, delayNode, convNode) {
    delayNode = delayNode || fxDelay;
    convNode = convNode || fxConv;
    if (trackNodes[tr.id]) return;
    if (!tr.devices) tr.devices = defaultDevices(tr.kind);
    var input = ctx.createGain();
    var analogFilt = ctx.createBiquadFilter();
    analogFilt.type = "lowpass";
    analogFilt.frequency.value = 18000;
    analogFilt.Q.value = 0.7;
    var eqLow = ctx.createBiquadFilter();
    eqLow.type = "lowshelf";
    eqLow.frequency.value = 120;
    var eqMid = ctx.createBiquadFilter();
    eqMid.type = "peaking";
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 0.85;
    var eqHigh = ctx.createBiquadFilter();
    eqHigh.type = "highshelf";
    eqHigh.frequency.value = 6500;
    var comp = ctx.createDynamicsCompressor();
    var dry = ctx.createGain();
    var delaySend = ctx.createGain();
    var insDelay = ctx.createDelay(1.5);
    insDelay.delayTime.value = 0.3;
    var delayFb = ctx.createGain();
    delayFb.gain.value = 0.2;
    var wet = ctx.createGain();
    wet.gain.value = 0;
    var vol = ctx.createGain();
    vol.gain.value = tr.volume;
    var pan = ctx.createStereoPanner ? ctx.createStereoPanner() : ctx.createGain();
    if (pan.pan) pan.pan.value = tr.pan || 0;
    var mute = ctx.createGain();
    mute.gain.value = 1;
    var analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    var sendA = ctx.createGain();
    sendA.gain.value = tr.sendA || 0;
    var sendB = ctx.createGain();
    sendB.gain.value = tr.sendB || 0;
    var autoFilt = ctx.createBiquadFilter();
    autoFilt.type = "lowpass";
    autoFilt.frequency.value = 18000;
    autoFilt.Q.value = 0.7;
    var autoLfo = ctx.createOscillator();
    autoLfo.type = "sine";
    autoLfo.frequency.value = 0.35;
    var autoLfoG = ctx.createGain();
    autoLfoG.gain.value = 0;
    autoLfo.connect(autoLfoG);
    autoLfoG.connect(autoFilt.frequency);
    try { autoLfo.start(); } catch (eAf) {}

    var chorDry = ctx.createGain();
    chorDry.gain.value = 1;
    var chorSend = ctx.createGain();
    chorSend.gain.value = 0;
    var chorDelayL = ctx.createDelay(0.08);
    chorDelayL.delayTime.value = 0.018;
    var chorDelayR = ctx.createDelay(0.08);
    chorDelayR.delayTime.value = 0.022;
    var chorFb = ctx.createGain();
    chorFb.gain.value = 0;
    var chorWetL = ctx.createGain();
    chorWetL.gain.value = 0;
    var chorWetR = ctx.createGain();
    chorWetR.gain.value = 0;
    var chorMerge = ctx.createChannelMerger(2);
    var chorLfo = ctx.createOscillator();
    chorLfo.type = "sine";
    chorLfo.frequency.value = 0.75;
    var chorLfoGL = ctx.createGain();
    chorLfoGL.gain.value = 0;
    var chorInv = ctx.createGain();
    chorInv.gain.value = -1;
    var chorLfoGR = ctx.createGain();
    chorLfoGR.gain.value = 0;
    chorLfo.connect(chorLfoGL);
    chorLfo.connect(chorInv);
    chorInv.connect(chorLfoGR);
    chorLfoGL.connect(chorDelayL.delayTime);
    chorLfoGR.connect(chorDelayR.delayTime);
    try { chorLfo.start(); } catch (eCh) {}

    var utilGain = ctx.createGain();
    utilGain.gain.value = 1;
    var utilDc = ctx.createBiquadFilter();
    utilDc.type = "highpass";
    utilDc.frequency.value = 8;
    var utilSplit = ctx.createChannelSplitter(2);
    var LtoL = ctx.createGain();
    var RtoL = ctx.createGain();
    var LtoR = ctx.createGain();
    var RtoR = ctx.createGain();
    LtoL.gain.value = 1;
    RtoR.gain.value = 1;
    LtoR.gain.value = 0;
    RtoL.gain.value = 0;
    var utilMerge = ctx.createChannelMerger(2);

    input.connect(analogFilt);
    analogFilt.connect(autoFilt);
    autoFilt.connect(chorDry);
    autoFilt.connect(chorSend);
    chorSend.connect(chorDelayL);
    chorSend.connect(chorDelayR);
    chorDelayL.connect(chorFb);
    chorDelayR.connect(chorFb);
    chorFb.connect(chorDelayL);
    chorFb.connect(chorDelayR);
    chorDelayL.connect(chorWetL);
    chorDelayR.connect(chorWetR);
    chorWetL.connect(chorMerge, 0, 0);
    chorWetR.connect(chorMerge, 0, 1);
    chorDry.connect(eqLow);
    chorMerge.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(comp);
    comp.connect(dry);
    comp.connect(delaySend);
    delaySend.connect(insDelay);
    insDelay.connect(delayFb);
    delayFb.connect(insDelay);
    insDelay.connect(wet);
    dry.connect(utilGain);
    wet.connect(utilGain);
    utilGain.connect(utilDc);
    utilDc.connect(utilSplit);
    utilSplit.connect(LtoL, 0);
    utilSplit.connect(LtoR, 0);
    utilSplit.connect(RtoL, 1);
    utilSplit.connect(RtoR, 1);
    LtoL.connect(utilMerge, 0, 0);
    RtoL.connect(utilMerge, 0, 0);
    LtoR.connect(utilMerge, 0, 1);
    RtoR.connect(utilMerge, 0, 1);
    utilMerge.connect(vol);
    var xf = ctx.createGain();
    xf.gain.value = 1;
    vol.connect(xf);
    xf.connect(pan);
    var pflSend = ctx.createGain();
    pflSend.gain.value = 0;
    pan.connect(pflSend);
    if (cueGain) pflSend.connect(cueGain);
    pan.connect(mute);
    mute.connect(analyser);
    analyser.connect(master);
    analyser.connect(sendA);
    analyser.connect(sendB);
    if (delayNode) sendA.connect(delayNode);
    if (convNode) sendB.connect(convNode);
    trackNodes[tr.id] = input;
    trackGraph[tr.id] = {
      vol: vol,
      xf: xf,
      pan: pan,
      mute: mute,
      analyser: analyser,
      sendA: sendA,
      sendB: sendB,
      analogFilt: analogFilt,
      eqLow: eqLow,
      eqMid: eqMid,
      eqHigh: eqHigh,
      comp: comp,
      insDelay: insDelay,
      delayFb: delayFb,
      delaySend: delaySend,
      dry: dry,
      wet: wet,
      autoFilt: autoFilt,
      autoLfo: autoLfo,
      autoLfoG: autoLfoG,
      chorDry: chorDry,
      chorSend: chorSend,
      chorDelayL: chorDelayL,
      chorDelayR: chorDelayR,
      chorFb: chorFb,
      chorWetL: chorWetL,
      chorWetR: chorWetR,
      chorLfo: chorLfo,
      chorLfoGL: chorLfoGL,
      chorLfoGR: chorLfoGR,
      pflSend: pflSend,
      utilGain: utilGain,
      utilDc: utilDc,
      LtoL: LtoL,
      RtoL: RtoL,
      LtoR: LtoR,
      RtoR: RtoR,
      meter: (mixerEl && mixerEl._pendingMeters && mixerEl._pendingMeters[tr.id]) || null,
    };
    applyDevices(tr);
  }

  function applyDevices(tr) {
    if (!ctx) return;
    var g = trackGraph[tr.id];
    if (!g) return;
    if (!tr.devices) tr.devices = defaultDevices(tr.kind);
    var now = ctx.currentTime;
    ensureAudioFx(tr);
    var analog = getDevice(tr, "analog") || {};
    var eq = getDevice(tr, "eq") || {};
    var compD = getDevice(tr, "comp") || {};
    var del = getDevice(tr, "delay") || {};
    var af = getDevice(tr, "auto") || {};
    var ch = getDevice(tr, "chorus") || {};
    var util = getDevice(tr, "util") || {};
    if (g.analogFilt) {
      g.analogFilt.Q.setTargetAtTime(analog.on ? Math.max(0.2, analog.res || 0.7) : 0.7, now, 0.02);
    }
    var eqOn = !!eq.on;
    if (g.eqLow) g.eqLow.gain.setTargetAtTime(eqOn ? eq.low || 0 : 0, now, 0.02);
    if (g.eqMid) g.eqMid.gain.setTargetAtTime(eqOn ? eq.mid || 0 : 0, now, 0.02);
    if (g.eqHigh) g.eqHigh.gain.setTargetAtTime(eqOn ? eq.high || 0 : 0, now, 0.02);
    if (g.comp) {
      g.comp.threshold.setTargetAtTime(compD.on ? (compD.thresh || -18) : 0, now, 0.02);
      g.comp.ratio.setTargetAtTime(compD.on ? Math.max(1, compD.ratio || 1) : 1, now, 0.02);
      g.comp.attack.setTargetAtTime(Math.max(0.001, compD.attack || 0.01), now, 0.02);
      g.comp.release.setTargetAtTime(Math.max(0.02, compD.release || 0.12), now, 0.02);
      g.comp.knee.setValueAtTime(8, now);
    }
    var mix = del.on ? Math.max(0, Math.min(0.95, del.mix || 0)) : 0;
    if (g.insDelay) g.insDelay.delayTime.setTargetAtTime(Math.max(0.02, Math.min(1.2, del.time || 0.3)), now, 0.02);
    if (g.delayFb) g.delayFb.gain.setTargetAtTime(del.on ? Math.max(0, Math.min(0.85, del.fb || 0)) : 0, now, 0.02);
    if (g.wet) g.wet.gain.setTargetAtTime(mix, now, 0.02);
    if (g.dry) g.dry.gain.setTargetAtTime(1 - mix * 0.45, now, 0.02);
    if (g.delaySend) g.delaySend.gain.setTargetAtTime(del.on ? 1 : 0, now, 0.02);

    if (g.autoFilt) {
      try { g.autoFilt.type = af.on ? (af.mode || "lowpass") : "lowpass"; } catch (eType) {}
      g.autoFilt.frequency.setTargetAtTime(af.on ? Math.max(80, af.freq || 1400) : 18000, now, 0.03);
      g.autoFilt.Q.setTargetAtTime(af.on ? Math.max(0.2, af.res || 1) : 0.7, now, 0.03);
    }
    if (g.autoLfo) g.autoLfo.frequency.setTargetAtTime(af.on ? Math.max(0.05, af.rate || 0.35) : 0.05, now, 0.03);
    if (g.autoLfoG) g.autoLfoG.gain.setTargetAtTime(af.on ? Math.max(0, af.amt || 0) : 0, now, 0.05);

    var cmix = ch.on ? Math.max(0, Math.min(0.9, ch.mix || 0)) : 0;
    if (g.chorSend) g.chorSend.gain.setTargetAtTime(ch.on ? 1 : 0, now, 0.02);
    if (g.chorDry) g.chorDry.gain.setTargetAtTime(ch.on ? Math.max(0.35, 1 - cmix * 0.4) : 1, now, 0.02);
    if (g.chorWetL) g.chorWetL.gain.setTargetAtTime(cmix, now, 0.02);
    if (g.chorWetR) g.chorWetR.gain.setTargetAtTime(cmix, now, 0.02);
    if (g.chorFb) g.chorFb.gain.setTargetAtTime(ch.on ? Math.max(0, Math.min(0.65, ch.fb || 0)) : 0, now, 0.02);
    if (g.chorLfo) g.chorLfo.frequency.setTargetAtTime(ch.on ? Math.max(0.05, ch.rate || 0.75) : 0.05, now, 0.03);
    var depth = ch.on ? Math.max(0.0002, Math.min(0.012, ch.depth || 0.003)) : 0;
    if (g.chorLfoGL) g.chorLfoGL.gain.setTargetAtTime(depth, now, 0.03);
    if (g.chorLfoGR) g.chorLfoGR.gain.setTargetAtTime(depth, now, 0.03);

    var db = util.on ? (util.gain || 0) : 0;
    var lin = Math.pow(10, Math.max(-24, Math.min(12, db)) / 20);
    if (util.on && util.invert) lin = -lin;
    if (g.utilGain) g.utilGain.gain.setTargetAtTime(lin, now, 0.02);
    if (g.utilDc) g.utilDc.frequency.setTargetAtTime(util.on && util.dc ? 30 : 8, now, 0.03);
    var w = util.on ? (util.width == null ? 1 : util.width) : 1;
    w = Math.max(0, Math.min(2, w));
    var a = (1 + w) / 2;
    var b = (1 - w) / 2;
    if (g.LtoL) g.LtoL.gain.setTargetAtTime(a, now, 0.02);
    if (g.RtoR) g.RtoR.gain.setTargetAtTime(a, now, 0.02);
    if (g.LtoR) g.LtoR.gain.setTargetAtTime(b, now, 0.02);
    if (g.RtoL) g.RtoL.gain.setTargetAtTime(b, now, 0.02);
  }

  function anySolo() {
    return state.tracks.some(function (tr) {
      return tr.solo;
    });
  }

  function trackAudible(tr) {
    if (tr.mute) return false;
    if (anySolo() && !tr.solo) return false;
    return true;
  }

  function xfMul(tr) {
    var x = Math.max(0, Math.min(1, state.xfade == null ? 0.5 : state.xfade));
    if (tr.xf === "A") return Math.cos((x * Math.PI) / 2);
    if (tr.xf === "B") return Math.sin((x * Math.PI) / 2);
    return 1;
  }

  function applyXfade() {
    if (!ctx) return;
    state.tracks.forEach(function (tr) {
      var g = trackGraph[tr.id];
      if (!g || !g.xf) return;
      g.xf.gain.setTargetAtTime(xfMul(tr), ctx.currentTime, 0.015);
    });
    document.querySelectorAll("#daw-session .daw-xfade").forEach(function (el) {
      if (document.activeElement === el) return;
      el.value = String(state.xfade == null ? 0.5 : state.xfade);
    });
    applyDeckMix();
  }

  var HOT_COLORS = ["#3fc6ff", "#ff6b8a", "#7dffb3", "#ffb238", "#c9a6ff", "#ffe08a", "#ff4d4d", "#9ad0ff"];
  function blankDeck() {
    return {
      playing: false, rate: 1, vol: 0.85, sync: false, pfl: false, cueAt: 0, pos: 0, next: 0, timer: 0,
      name: "Empty", kind: null, trackId: null, clip: null, buf: null, t0: 0, off: 0,
      bpm: 0, beat0: 0, eqHi: 0, eqMid: 0, eqLow: 0, filter: 0.5,
      killHi: false, killMid: false, killLow: false,
      hot: [null, null, null, null, null, null, null, null],
      loopOn: false, loopStart: 0, loopEnd: 0, loopBeats: 0,
      wave: null, quantize: true,
    };
  }
  var decks = { A: blankDeck(), B: blankDeck() };
  var deckGraph = { A: null, B: null };
  var djEl = null;
  var recMix = null;
  var recChunks = [];
  var recDest = null;
  var midiAccess = null;
  var audioInNodes = { A: null, B: null };
  var audioInStreams = { A: null, B: null };

  function dummyDeckTrack(id, kind) {
    return { id: "deck-" + id, name: "Deck " + id, kind: kind || "midi", devices: defaultDevices(kind || "midi"), color: id === "A" ? "#3fc6ff" : "#ffb238" };
  }

  function fmtDjTime(sec) {
    sec = Math.max(0, sec || 0);
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    var t = Math.floor((sec % 1) * 10);
    return m + ":" + (s < 10 ? "0" : "") + s + "." + t;
  }

  function detectBpm(buf) {
    if (!buf || !buf.getChannelData) return { bpm: state.bpm || 120, beat0: 0 };
    var sr = buf.sampleRate;
    var ch = buf.getChannelData(0);
    var hop = Math.max(64, Math.floor(sr / 100));
    var n = Math.min(ch.length, sr * 40);
    var env = [];
    var prev = 0;
    for (var i = 0; i < n; i += hop) {
      var sum = 0, end = Math.min(n, i + hop), j;
      for (j = i; j < end; j++) sum += ch[j] * ch[j];
      var e = Math.sqrt(sum / (end - i || 1));
      env.push(Math.max(0, e - prev));
      prev = e * 0.7 + prev * 0.3;
    }
    var hopsPerSec = sr / hop;
    var minLag = Math.max(2, Math.round(60 / 180 * hopsPerSec));
    var maxLag = Math.min(env.length - 2, Math.round(60 / 70 * hopsPerSec));
    var best = 0, bestLag = minLag;
    for (var lag = minLag; lag <= maxLag; lag++) {
      var c = 0, k, lim = env.length - lag;
      for (k = 0; k < lim; k++) c += env[k] * env[k + lag];
      c /= lim || 1;
      if (c > best) { best = c; bestLag = lag; }
    }
    var bpm = 60 * hopsPerSec / bestLag;
    while (bpm > 180) bpm /= 2;
    while (bpm < 70) bpm *= 2;
    bpm = Math.round(bpm * 10) / 10;
    var mean = 0;
    for (i = 0; i < Math.min(env.length, 500); i++) mean += env[i];
    mean = (mean / Math.min(env.length, 500)) * 1.8;
    var beat0 = 0;
    for (i = 0; i < env.length; i++) {
      if (env[i] > mean) { beat0 = i / hopsPerSec; break; }
    }
    return { bpm: bpm, beat0: beat0 };
  }

  function analyzeWave(buf, bins) {
    bins = bins || 900;
    var ch = buf.getChannelData(0);
    var sr = buf.sampleRate;
    var low = new Float32Array(bins);
    var mid = new Float32Array(bins);
    var high = new Float32Array(bins);
    var spb = Math.max(1, Math.floor(ch.length / bins));
    var lp = 0, hp = 0, prev = 0;
    var aL = Math.exp(-2 * Math.PI * 180 / sr);
    var aH = Math.exp(-2 * Math.PI * 2200 / sr);
    var max = 0.0001;
    for (var b = 0; b < bins; b++) {
      var s0 = b * spb, end = Math.min(ch.length, s0 + spb), sl = 0, sm = 0, sh = 0, i, x, band;
      for (i = s0; i < end; i++) {
        x = ch[i];
        lp = aL * lp + (1 - aL) * x;
        hp = aH * (hp + x - prev);
        prev = x;
        band = x - lp - hp;
        sl += lp * lp;
        sm += band * band;
        sh += hp * hp;
      }
      var nrm = (end - s0) || 1;
      low[b] = Math.sqrt(sl / nrm);
      mid[b] = Math.sqrt(sm / nrm);
      high[b] = Math.sqrt(sh / nrm);
      if (low[b] > max) max = low[b];
      if (mid[b] > max) max = mid[b];
      if (high[b] > max) max = high[b];
    }
    for (b = 0; b < bins; b++) {
      low[b] /= max;
      mid[b] /= max;
      high[b] /= max;
    }
    return { low: low, mid: mid, high: high, n: bins };
  }

  function qTime(id, sec) {
    var d = decks[id];
    if (!d || !d.quantize) return sec;
    var bpm = d.bpm || state.bpm || 120;
    var spb = 60 / bpm;
    var g = d.beat0 || 0;
    return Math.max(0, g + Math.round((sec - g) / spb) * spb);
  }

  function ensureDeckGraph() {
    if (!ctx || !master) return;
    ["A", "B"].forEach(function (id) {
      if (deckGraph[id]) return;
      var input = ctx.createGain();
      var eqLow = ctx.createBiquadFilter();
      eqLow.type = "lowshelf";
      eqLow.frequency.value = 250;
      var eqMid = ctx.createBiquadFilter();
      eqMid.type = "peaking";
      eqMid.frequency.value = 1000;
      eqMid.Q.value = 0.9;
      var eqHigh = ctx.createBiquadFilter();
      eqHigh.type = "highshelf";
      eqHigh.frequency.value = 4200;
      var filt = ctx.createBiquadFilter();
      filt.type = "lowpass";
      filt.frequency.value = 18000;
      var vol = ctx.createGain();
      vol.gain.value = decks[id].vol;
      var xf = ctx.createGain();
      xf.gain.value = xfMul({ xf: id });
      var pfl = ctx.createGain();
      pfl.gain.value = 0;
      var an = ctx.createAnalyser();
      an.fftSize = 256;
      input.connect(eqLow);
      eqLow.connect(eqMid);
      eqMid.connect(eqHigh);
      eqHigh.connect(filt);
      filt.connect(vol);
      vol.connect(xf);
      xf.connect(master);
      vol.connect(pfl);
      if (cueGain) pfl.connect(cueGain);
      vol.connect(an);
      deckGraph[id] = { in: input, eqLow: eqLow, eqMid: eqMid, eqHigh: eqHigh, filt: filt, vol: vol, xf: xf, pfl: pfl, analyser: an, src: null };
    });
  }

  function applyDeckEq(id) {
    if (!ctx) return;
    var g = deckGraph[id];
    var d = decks[id];
    if (!g || !d) return;
    var now = ctx.currentTime;
    if (g.eqHigh) g.eqHigh.gain.setTargetAtTime(d.killHi ? -48 : (d.eqHi || 0), now, 0.02);
    if (g.eqMid) g.eqMid.gain.setTargetAtTime(d.killMid ? -48 : (d.eqMid || 0), now, 0.02);
    if (g.eqLow) g.eqLow.gain.setTargetAtTime(d.killLow ? -48 : (d.eqLow || 0), now, 0.02);
    if (!g.filt) return;
    var f = d.filter == null ? 0.5 : d.filter;
    if (f < 0.48) {
      g.filt.type = "lowpass";
      var u = f / 0.48;
      g.filt.frequency.setTargetAtTime(180 + Math.pow(u, 1.6) * 17000, now, 0.03);
      g.filt.Q.setTargetAtTime(0.7 + (0.48 - f) * 6, now, 0.03);
    } else if (f > 0.52) {
      g.filt.type = "highpass";
      var v = (f - 0.52) / 0.48;
      g.filt.frequency.setTargetAtTime(40 + Math.pow(v, 1.7) * 6500, now, 0.03);
      g.filt.Q.setTargetAtTime(0.7 + v * 4, now, 0.03);
    } else {
      g.filt.type = "lowpass";
      g.filt.frequency.setTargetAtTime(18000, now, 0.03);
      g.filt.Q.setTargetAtTime(0.7, now, 0.03);
    }
  }

  function applyDeckMix() {
    if (!ctx) return;
    ["A", "B"].forEach(function (id) {
      var g = deckGraph[id];
      var d = decks[id];
      if (!g) return;
      g.vol.gain.setTargetAtTime(Math.max(0, d.vol || 0), ctx.currentTime, 0.02);
      g.pfl.gain.setTargetAtTime(d.pfl ? 1 : 0, ctx.currentTime, 0.02);
      if (g.xf) g.xf.gain.setTargetAtTime(xfMul({ xf: id }), ctx.currentTime, 0.015);
      applyDeckEq(id);
    });
  }

  function applyDeckRate(id) {
    var d = decks[id];
    var g = deckGraph[id];
    if (!d || !g || !g.src || !g.src.playbackRate || !ctx) return;
    try { g.src.playbackRate.setTargetAtTime(Math.max(0.01, d.rate || 1), ctx.currentTime, 0.03); } catch (e) {}
  }

  function deckPosSec(id) {
    var d = decks[id];
    if (!d || !d.buf || !ctx) return d ? d.cueAt : 0;
    if (!d.playing) return d.cueAt;
    var dt = (ctx.currentTime - (d.t0 || 0)) * (d.rate || 1) + (d.off || 0);
    var dur = d.buf.duration || 1;
    return ((dt % dur) + dur) % dur;
  }

  function stopDeckAudio(id) {
    var g = deckGraph[id];
    var d = decks[id];
    if (d) {
      window.clearTimeout(d.timer);
      d.timer = 0;
    }
    if (g && g.src) {
      try { g.src.stop(); } catch (e) {}
      try { g.src.disconnect(); } catch (e2) {}
      g.src = null;
    }
    try { stopPad("deck-" + id); } catch (e3) {}
    try { stopWarpVoices("deck-" + id); } catch (e4) {}
  }

  function disconnectLineIn(id) {
    if (audioInNodes[id]) {
      try { audioInNodes[id].disconnect(); } catch (e) {}
      audioInNodes[id] = null;
    }
    if (audioInStreams[id]) {
      try { audioInStreams[id].getTracks().forEach(function (t) { t.stop(); }); } catch (e2) {}
      audioInStreams[id] = null;
    }
  }

  function loadDeck(id, clip, track) {
    if (!decks[id]) return;
    ensureAudio();
    ensureDeckGraph();
    ctx.resume();
    stopDeckAudio(id);
    disconnectLineIn(id);
    var d = decks[id];
    var keepVol = d.vol;
    var keepEq = { eqHi: d.eqHi, eqMid: d.eqMid, eqLow: d.eqLow, filter: d.filter };
    decks[id] = blankDeck();
    d = decks[id];
    d.vol = keepVol;
    d.eqHi = keepEq.eqHi; d.eqMid = keepEq.eqMid; d.eqLow = keepEq.eqLow; d.filter = keepEq.filter;
    d.clip = clip || null;
    d.trackId = track ? track.id : null;
    d.buf = clip && clip.notes && clip.notes.buffer ? clip.notes.buffer : null;
    d.kind = d.buf ? "audio" : (clip ? ((track && track.kind) || "midi") : null);
    d.name = clip ? ((track ? track.name + " · " : "") + (clip.name || "Clip")) : "Empty";
    if (d.buf) {
      var info = detectBpm(d.buf);
      d.bpm = info.bpm;
      d.beat0 = info.beat0;
      d.wave = analyzeWave(d.buf, 900);
    } else {
      d.bpm = state.bpm || 120;
    }
    applyDeckMix();
    paintDj();
    setMidiLabel("Deck " + id + " · " + d.bpm + " BPM");
  }

  function loadSelectedToDeck(id) {
    var sel = state.selectedSession;
    if (sel && sel.clip) {
      loadDeck(id, sel.clip, sel.track);
      return;
    }
    var launched = null, tr0 = null;
    state.tracks.forEach(function (tr) {
      if (!launched && state.launched[tr.id] && state.launched[tr.id] !== "stop") {
        launched = state.launched[tr.id];
        tr0 = tr;
      }
    });
    if (launched) loadDeck(id, launched, tr0);
    else setMidiLabel("Select a clip, then Load " + id);
  }

  function startPadTo(dest, tr, clipObj, holdKey) {
    stopPad(holdKey);
    if (!ctx || !clipObj || !dest) return;
    var analog = analogOf(tr);
    var g = ctx.createGain();
    g.gain.value = 0.08;
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = analog ? analog.cutoff : 4200;
    f.Q.value = analog ? analog.res : 0.7;
    f.connect(dest);
    g.connect(f);
    var wave = analog ? analog.wave : "sine";
    var oscs = (clipObj.notes.chord || [0, 7, 12]).map(function (s, i) {
      var o = ctx.createOscillator();
      o.type = wave;
      o.frequency.value = midiHz(s + 12) * (i === 1 ? 1.003 : 1);
      o.connect(g);
      o.start();
      return o;
    });
    padHold[holdKey] = { g: g, oscs: oscs };
  }

  function deckSched(id) {
    var d = decks[id];
    var g = deckGraph[id];
    if (!d || !g || !d.playing || !d.clip || d.kind === "audio" || d.kind === "in") return;
    var tr = (d.trackId && state.tracks.find(function (x) { return x.id === d.trackId; })) || dummyDeckTrack(id, d.kind);
    var horizon = ctx.currentTime + 0.12;
    var stepDur = secondsPerStep() / Math.max(0.25, d.rate || 1);
    while (d.next < horizon) {
      playStepAt(tr, d.clip, d.pos, d.next, 1, g.in);
      d.next += stepDur;
      d.pos += 1;
      if (d.pos >= (d.clip.length || STEPS)) d.pos = 0;
    }
    d.timer = window.setTimeout(function () { deckSched(id); }, 25);
  }

  function startAudioAt(id, time) {
    var d = decks[id];
    var g = deckGraph[id];
    if (!d || !g || !d.buf) return;
    if (g.src) {
      try { g.src.onended = null; g.src.stop(); } catch (e) {}
      try { g.src.disconnect(); } catch (e2) {}
      g.src = null;
    }
    var src = ctx.createBufferSource();
    src.buffer = d.buf;
    src.playbackRate.value = Math.max(0.01, d.rate || 1);
    var off = Math.max(0, Math.min(d.buf.duration - 0.005, time || 0));
    if (d.loopOn && d.loopEnd > d.loopStart + 0.04) {
      src.loop = true;
      src.loopStart = d.loopStart;
      src.loopEnd = d.loopEnd;
      if (off < d.loopStart || off >= d.loopEnd) off = d.loopStart;
    } else {
      src.loop = false;
    }
    src.connect(g.in);
    src.start(0, off);
    src.onended = function () {
      if (!g || g.src !== src) return;
      d.playing = false;
      d.cueAt = d.buf.duration;
      g.src = null;
      paintDj();
    };
    g.src = src;
    d.t0 = ctx.currentTime;
    d.off = off;
    d.cueAt = off;
    d.playing = true;
  }

  function seekDeck(id, time) {
    var d = decks[id];
    if (!d) return;
    time = Math.max(0, time);
    if (d.quantize) time = qTime(id, time);
    if (d.kind === "audio" && d.playing) startAudioAt(id, time);
    else d.cueAt = time;
    paintDj();
  }

  function jumpHot(id, i) {
    var d = decks[id];
    if (!d) return;
    if (d.hot[i] == null) {
      d.hot[i] = qTime(id, d.kind === "audio" && d.playing ? deckPosSec(id) : (d.cueAt || 0));
      paintDj();
      setMidiLabel("Hot " + (i + 1) + " set");
      return;
    }
    if (d.kind === "audio") {
      ensureAudio();
      ctx.resume();
      ensureDeckGraph();
      startAudioAt(id, d.hot[i]);
      applyDeckMix();
    } else {
      d.pos = Math.floor(d.hot[i]);
      d.cueAt = d.hot[i];
      if (!d.playing) playDeck(id);
    }
    paintDj();
  }

  function clearHot(id, i) {
    var d = decks[id];
    if (!d) return;
    d.hot[i] = null;
    paintDj();
  }

  function setLoop(id, beats) {
    var d = decks[id];
    if (!d) return;
    if (d.loopOn && d.loopBeats === beats) {
      d.loopOn = false;
      d.loopBeats = 0;
      if (d.playing && d.kind === "audio") startAudioAt(id, deckPosSec(id));
      paintDj();
      return;
    }
    var bpm = d.bpm || state.bpm || 120;
    var dur = (beats * 60) / bpm;
    var start = qTime(id, d.kind === "audio" && d.playing ? deckPosSec(id) : (d.cueAt || 0));
    d.loopOn = true;
    d.loopBeats = beats;
    d.loopStart = start;
    d.loopEnd = start + dur;
    if (d.buf) d.loopEnd = Math.min(d.buf.duration, d.loopEnd);
    if (d.playing && d.kind === "audio") startAudioAt(id, start);
    paintDj();
    setMidiLabel("Loop " + beats + " beats");
  }

  function beatJump(id, beats) {
    var d = decks[id];
    if (!d) return;
    var bpm = d.bpm || state.bpm || 120;
    var now = d.kind === "audio" && d.playing ? deckPosSec(id) : (d.cueAt || 0);
    seekDeck(id, now + beats * (60 / bpm));
  }

  function playDeck(id) {
    var d = decks[id];
    if (!d) return;
    ensureAudio();
    ensureDeckGraph();
    ctx.resume();
    var g = deckGraph[id];
    if (d.playing) return;
    if (d.kind === "in") {
      d.playing = true;
      applyDeckMix();
      paintDj();
      return;
    }
    if (!d.clip && !d.buf) {
      loadSelectedToDeck(id);
      if (!d.clip && !d.buf) return;
    }
    stopDeckAudio(id);
    d.playing = true;
    if (d.kind === "audio" && d.buf) {
      startAudioAt(id, d.cueAt || 0);
    } else if (d.kind === "pad" || (d.clip && d.clip.notes && d.clip.notes.hold && !(d.clip.notes.roll && d.clip.notes.roll.length))) {
      var tr = (d.trackId && state.tracks.find(function (x) { return x.id === d.trackId; })) || dummyDeckTrack(id, "pad");
      startPadTo(g.in, tr, d.clip, "deck-" + id);
    } else {
      d.pos = 0;
      d.next = ctx.currentTime + 0.02;
      deckSched(id);
    }
    applyDeckMix();
    paintDj();
  }

  function pauseDeck(id) {
    var d = decks[id];
    if (!d || !d.playing) return;
    if (d.kind === "audio") d.cueAt = deckPosSec(id);
    d.playing = false;
    stopDeckAudio(id);
    paintDj();
  }

  function toggleDeck(id) {
    if (decks[id] && decks[id].playing) pauseDeck(id);
    else playDeck(id);
  }

  function cueDeck(id) {
    var d = decks[id];
    if (!d) return;
    if (d.playing) {
      pauseDeck(id);
      d.cueAt = d.cueAt || 0;
      paintDj();
      return;
    }
    playDeck(id);
  }

  function jogDeck(id, amount) {
    var d = decks[id];
    var g = deckGraph[id];
    if (!d) return;
    amount = Number(amount) || 0;
    if (d.playing && g && g.src && g.src.playbackRate) {
      var base = d.rate || 1;
      try { g.src.playbackRate.setTargetAtTime(Math.max(0.01, base * (1 + amount * 0.2)), ctx.currentTime, 0.008); } catch (e) {}
      window.clearTimeout(d._jogT);
      d._jogT = window.setTimeout(function () { applyDeckRate(id); }, 90);
    } else if (d.buf) {
      d.cueAt = Math.max(0, Math.min((d.buf.duration || 1) - 0.01, (d.cueAt || 0) + amount * 0.08));
      paintDjWave(id);
    } else {
      d.pos = Math.max(0, (d.pos || 0) + (amount > 0 ? 1 : -1));
    }
  }

  function syncDeck(id) {
    var d = decks[id];
    if (!d) return;
    var otherId = id === "A" ? "B" : "A";
    var o = decks[otherId];
    d.sync = !d.sync;
    if (!d.sync) { paintDj(); return; }
    var targetBpm = (o.bpm && (o.playing || o.buf)) ? (o.bpm * (o.rate || 1)) : (state.bpm || 120);
    if (d.bpm) d.rate = Math.max(0.84, Math.min(1.16, targetBpm / d.bpm));
    else d.rate = 1;
    applyDeckRate(id);
    if (d.playing && o.playing && d.buf && o.buf && d.bpm && o.bpm) {
      var posO = deckPosSec(otherId);
      var beatO = ((posO - (o.beat0 || 0)) / (60 / o.bpm));
      var frac = beatO - Math.floor(beatO);
      var posD = deckPosSec(id);
      var beatD = Math.floor((posD - (d.beat0 || 0)) / (60 / d.bpm));
      seekDeck(id, (d.beat0 || 0) + (beatD + frac) * (60 / d.bpm));
    }
    paintDj();
    setMidiLabel("Sync " + id + " → " + Math.round(targetBpm * 10) / 10);
  }

  function handleDjMap(name, down) {
    if (!name) return;
    if (!down) return;
    if (name === "playA") toggleDeck("A");
    else if (name === "playB") toggleDeck("B");
    else if (name === "cueA") cueDeck("A");
    else if (name === "cueB") cueDeck("B");
    else if (name === "syncA") syncDeck("A");
    else if (name === "syncB") syncDeck("B");
  }

  function drawColoredWave(ctx2, d, w, h, viewStart, viewDur) {
    ctx2.fillStyle = "#070908";
    ctx2.fillRect(0, 0, w, h);
    if (!d.wave) return;
    var dur = d.buf ? d.buf.duration : 1;
    var a = Math.max(0, viewStart || 0);
    var b = Math.min(dur, a + (viewDur || dur));
    var n = d.wave.n;
    for (var x = 0; x < w; x++) {
      var t0 = a + (x / w) * (b - a);
      var idx = Math.max(0, Math.min(n - 1, Math.floor((t0 / dur) * n)));
      var lo = d.wave.low[idx], md = d.wave.mid[idx], hi = d.wave.high[idx];
      var mag = Math.max(lo, md, hi);
      var hh = mag * (h * 0.48);
      ctx2.fillStyle = "rgba(63,198,255,0.95)";
      ctx2.fillRect(x, h / 2 - hh * lo, 1, hh * lo);
      ctx2.fillRect(x, h / 2, 1, hh * lo);
      ctx2.fillStyle = "rgba(125,255,179,0.9)";
      var hm = hh * md * 0.75;
      ctx2.fillRect(x, h / 2 - hm, 1, hm * 2);
      ctx2.fillStyle = "rgba(255,255,255,0.85)";
      var hh2 = hh * hi * 0.45;
      ctx2.fillRect(x, h / 2 - hh2, 1, hh2 * 2);
    }
    if (d.bpm) {
      var spb = 60 / d.bpm;
      ctx2.fillStyle = "rgba(255,255,255,0.08)";
      var bt = d.beat0 || 0;
      while (bt < a) bt += spb * 4;
      for (; bt < b; bt += spb * 4) {
        var px = ((bt - a) / (b - a)) * w;
        ctx2.fillRect(px, 0, 1, h);
      }
    }
    if (d.loopOn) {
      var x0 = ((d.loopStart - a) / (b - a)) * w;
      var x1 = ((d.loopEnd - a) / (b - a)) * w;
      ctx2.fillStyle = "rgba(63,198,255,0.18)";
      ctx2.fillRect(x0, 0, Math.max(2, x1 - x0), h);
      ctx2.strokeStyle = "#3fc6ff";
      ctx2.strokeRect(x0, 0.5, Math.max(2, x1 - x0), h - 1);
    }
    (d.hot || []).forEach(function (ht, i) {
      if (ht == null) return;
      var hx = ((ht - a) / (b - a)) * w;
      ctx2.fillStyle = HOT_COLORS[i];
      ctx2.fillRect(hx - 1, 0, 2, h);
      ctx2.fillRect(hx - 3, 0, 6, 6);
    });
    var pos = d.kind === "audio" && d.playing ? deckPosSec(d === decks.A ? "A" : "B") : (d.cueAt || 0);
  }

  function drawDeckWave(id) {
    if (!djEl) return;
    var d = decks[id];
    var ov = djEl.querySelector('[data-dj-ov="' + id + '"]');
    var cv = djEl.querySelector('[data-dj-wave="' + id + '"]');
    var pos = (d.kind === "audio" && d.playing && d.buf) ? deckPosSec(id) : (d.cueAt || 0);
    var dur = d.buf ? d.buf.duration : 1;
    if (ov) {
      var octx = ov.getContext("2d");
      var ow = ov.width, oh = ov.height;
      if (d.wave) drawColoredWave(octx, d, ow, oh, 0, dur);
      else { octx.fillStyle = "#070908"; octx.fillRect(0, 0, ow, oh); }
      var px = (pos / dur) * ow;
      octx.fillStyle = "#ff4d4d";
      octx.fillRect(px, 0, 2, oh);
    }
    if (!cv) return;
    var ctx2 = cv.getContext("2d");
    var w = cv.width, h = cv.height;
    if (d.wave && d.buf) {
      var window = Math.min(dur, 8);
      var start = Math.max(0, Math.min(dur - window, pos - window * 0.35));
      drawColoredWave(ctx2, d, w, h, start, window);
      var px2 = ((pos - start) / window) * w;
      ctx2.fillStyle = "#ff4d4d";
      ctx2.fillRect(px2, 0, 2, h);
      ctx2.fillStyle = "rgba(255,77,77,0.12)";
      ctx2.fillRect(px2, 0, Math.max(0, w - px2), h);
    } else {
      ctx2.fillStyle = "#070908";
      ctx2.fillRect(0, 0, w, h);
      if (d.kind === "in") {
        var g = deckGraph[id];
        ctx2.fillStyle = id === "A" ? "#3fc6ff" : "#ffb238";
        ctx2.font = "11px Share Tech Mono, monospace";
        ctx2.fillText("LINE IN", 10, 18);
        if (g && g.analyser) {
          var buf = new Uint8Array(g.analyser.fftSize);
          g.analyser.getByteTimeDomainData(buf);
          ctx2.strokeStyle = id === "A" ? "#3fc6ff" : "#ffb238";
          ctx2.beginPath();
          for (var x2 = 0; x2 < w; x2++) {
            var v = (buf[Math.floor((x2 / w) * buf.length)] - 128) / 128;
            var y2 = h / 2 + v * (h * 0.4);
            if (x2 === 0) ctx2.moveTo(x2, y2);
            else ctx2.lineTo(x2, y2);
          }
          ctx2.stroke();
        }
      } else if (d.clip) {
        ctx2.fillStyle = id === "A" ? "#3fc6ff" : "#ffb238";
        ctx2.font = "11px Share Tech Mono, monospace";
        ctx2.fillText((d.name || "MIDI") + " · " + (d.bpm || state.bpm) + " BPM", 10, h / 2);
      } else {
        ctx2.fillStyle = "#4c5f56";
        ctx2.font = "11px Share Tech Mono, monospace";
        ctx2.fillText("Load a clip or line-in", 10, h / 2);
      }
    }
  }

  function paintDjWave(id) { drawDeckWave(id); }

  var djRaf = 0;
  function tickDjWaves() {
    if (!djEl || !root || !root.classList.contains("is-dj")) {
      djRaf = 0;
      return;
    }
    djRaf = window.requestAnimationFrame(tickDjWaves);
    drawDeckWave("A");
    drawDeckWave("B");
    ["A", "B"].forEach(function (id) {
      var d = decks[id];
      var tEl = djEl.querySelector('[data-dj-time="' + id + '"]');
      if (!tEl) return;
      var pos = (d.kind === "audio" && d.playing && d.buf) ? deckPosSec(id) : (d.cueAt || 0);
      var remain = d.buf ? Math.max(0, d.buf.duration - pos) : 0;
      tEl.textContent = fmtDjTime(pos) + "  −" + fmtDjTime(remain);
    });
  }

  function paintDj() {
    if (!djEl) return;
    ["A", "B"].forEach(function (id) {
      var d = decks[id];
      var name = djEl.querySelector('[data-dj-name="' + id + '"]');
      if (name) name.textContent = "Deck " + id + " · " + (d.name || "Empty");
      var play = djEl.querySelector('[data-dj-play="' + id + '"]');
      if (play) {
        play.classList.toggle("on", !!d.playing);
        play.textContent = d.playing ? "Pause" : "Play";
      }
      var sync = djEl.querySelector('[data-dj-sync="' + id + '"]');
      if (sync) sync.classList.toggle("on", !!d.sync);
      var pfl = djEl.querySelector('[data-dj-pfl="' + id + '"]');
      if (pfl) pfl.classList.toggle("on", !!d.pfl);
      var rate = djEl.querySelector('[data-dj-rate="' + id + '"]');
      if (rate && document.activeElement !== rate) rate.value = String(d.rate);
      var vol = djEl.querySelector('[data-dj-vol="' + id + '"]');
      if (vol && document.activeElement !== vol) vol.value = String(d.vol);
      var rateLab = djEl.querySelector('[data-dj-rate-lab="' + id + '"]');
      if (rateLab) rateLab.textContent = ((d.rate || 1) >= 1 ? "+" : "") + (Math.round(((d.rate || 1) - 1) * 1000) / 10) + "%";
      var bpmEl = djEl.querySelector('[data-dj-bpm="' + id + '"]');
      if (bpmEl) bpmEl.textContent = (d.bpm ? d.bpm.toFixed(1) : "—") + " BPM";
      var tEl = djEl.querySelector('[data-dj-time="' + id + '"]');
      if (tEl) {
        var pos = (d.kind === "audio" && d.playing && d.buf) ? deckPosSec(id) : (d.cueAt || 0);
        var remain = d.buf ? Math.max(0, d.buf.duration - pos) : 0;
        tEl.textContent = fmtDjTime(pos) + "  −" + fmtDjTime(remain);
      }
      var qBtn = djEl.querySelector('[data-dj-q="' + id + '"]');
      if (qBtn) qBtn.classList.toggle("on", d.quantize !== false);
      var loopOff = djEl.querySelector('[data-dj-loopoff="' + id + '"]');
      djEl.querySelectorAll('[data-dj-loop="' + id + '"]').forEach(function (b) {
        b.classList.toggle("on", !!d.loopOn && String(d.loopBeats) === b.getAttribute("data-beats"));
      });
      (d.hot || []).forEach(function (ht, i) {
        var pad = djEl.querySelector('[data-hot="' + id + i + '"]');
        if (!pad) return;
        pad.classList.toggle("on", ht != null);
        pad.style.borderColor = ht != null ? HOT_COLORS[i] : "";
        pad.style.background = ht != null ? HOT_COLORS[i] : "";
        pad.style.color = ht != null ? "#06170f" : "";
      });
      [["hi", "eqHi", "killHi"], ["mid", "eqMid", "killMid"], ["low", "eqLow", "killLow"]].forEach(function (row) {
        var k = djEl.querySelector('[data-eq="' + id + row[0] + '"]');
        if (k && document.activeElement !== k) k.value = String(d[row[1]] || 0);
        var kill = djEl.querySelector('[data-kill="' + id + row[0] + '"]');
        if (kill) kill.classList.toggle("on", !!d[row[2]]);
      });
      var fl = djEl.querySelector('[data-filt="' + id + '"]');
      if (fl && document.activeElement !== fl) fl.value = String(d.filter == null ? 0.5 : d.filter);
      drawDeckWave(id);
    });
    var phase = djEl.querySelector("[data-dj-phase]");
    if (phase) {
      var pctx = phase.getContext("2d");
      var pw = phase.width, ph = phase.height;
      pctx.fillStyle = "#070908";
      pctx.fillRect(0, 0, pw, ph);
      function beatFrac(id) {
        var d = decks[id];
        if (!d.bpm) return 0;
        var pos = (d.playing && d.buf) ? deckPosSec(id) : (d.cueAt || 0);
        var b = ((pos - (d.beat0 || 0)) * d.bpm) / 60;
        return ((b % 1) + 1) % 1;
      }
      var fa = beatFrac("A"), fb = beatFrac("B");
      pctx.fillStyle = "#3fc6ff";
      pctx.fillRect(fa * (pw - 4), 4, 4, 10);
      pctx.fillStyle = "#ffb238";
      pctx.fillRect(fb * (pw - 4), 16, 4, 10);
      pctx.fillStyle = "#4c5f56";
      pctx.font = "9px Share Tech Mono, monospace";
      pctx.fillText("PHASE", 4, ph - 4);
    }
    var recBtn = djEl.querySelector("[data-dj-rec]");
    if (recBtn) recBtn.classList.toggle("on", !!(recMix && recMix.state === "recording"));
    if (root && root.classList.contains("is-dj") && !djRaf) tickDjWaves();
  }

  function bindJog(node, id) {
    node.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      node.setPointerCapture(ev.pointerId);
      var last = ev.clientX;
      function move(e) {
        var dx = e.clientX - last;
        last = e.clientX;
        jogDeck(id, dx / 40);
      }
      function up() {
        node.releasePointerCapture(ev.pointerId);
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", up);
      }
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", up);
    });
  }

  function populateIo() {
    if (!djEl) return;
    var midiSel = djEl.querySelector("[data-dj-midi]");
    if (midiSel) {
      midiSel.replaceChildren();
      var o0 = document.createElement("option");
      o0.value = "";
      o0.textContent = midiAccess ? "MIDI inputs" : "No MIDI access";
      midiSel.appendChild(o0);
      if (midiAccess) {
        midiAccess.inputs.forEach(function (p) {
          var o = document.createElement("option");
          o.value = p.id;
          o.textContent = p.name || p.id;
          midiSel.appendChild(o);
        });
      }
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(function (list) {
      function fill(sel, kind, blank) {
        if (!sel) return;
        var cur = sel.value;
        sel.replaceChildren();
        var z = document.createElement("option");
        z.value = "";
        z.textContent = blank;
        sel.appendChild(z);
        list.filter(function (d) { return d.kind === kind; }).forEach(function (d) {
          var o = document.createElement("option");
          o.value = d.deviceId;
          o.textContent = d.label || (kind + " " + d.deviceId.slice(0, 6));
          sel.appendChild(o);
        });
        if (cur) sel.value = cur;
      }
      fill(djEl.querySelector("[data-dj-in-a]"), "audioinput", "Deck A input");
      fill(djEl.querySelector("[data-dj-in-b]"), "audioinput", "Deck B input");
      fill(djEl.querySelector("[data-dj-out]"), "audiooutput", "Output device");
    }).catch(function () {});
  }

  function lineInDeck(id, deviceId) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMidiLabel("No audio capture");
      return;
    }
    ensureAudio();
    ensureDeckGraph();
    ctx.resume();
    var extra = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    };
    if (deviceId) extra.deviceId = { exact: deviceId };
    navigator.mediaDevices.getUserMedia({ audio: extra }).then(function (stream) {
      disconnectLineIn(id);
      stopDeckAudio(id);
      var src = ctx.createMediaStreamSource(stream);
      src.connect(deckGraph[id].in);
      audioInNodes[id] = src;
      audioInStreams[id] = stream;
      var d = decks[id];
      d.kind = "in";
      d.clip = null;
      d.buf = null;
      d.name = "Line in";
      d.playing = true;
      applyDeckMix();
      populateIo();
      paintDj();
      setMidiLabel("Deck " + id + " line-in");
    }).catch(function () {
      setMidiLabel("Input denied");
    });
  }

  function setOutputDevice(id) {
    if (!ctx || !id) return;
    if (typeof ctx.setSinkId === "function") {
      ctx.setSinkId(id).then(function () { setMidiLabel("Output set"); }).catch(function () { setMidiLabel("Output failed"); });
    } else setMidiLabel("Output lock n/a");
  }

  function toggleRecordMix() {
    ensureAudio();
    ctx.resume();
    if (recMix && recMix.state === "recording") {
      try { recMix.stop(); } catch (e) {}
      paintDj();
      return;
    }
    if (typeof MediaRecorder === "undefined") {
      setMidiLabel("Recorder n/a");
      return;
    }
    if (!recDest) {
      recDest = ctx.createMediaStreamDestination();
      master.connect(recDest);
    }
    recChunks = [];
    try {
      recMix = new MediaRecorder(recDest.stream);
    } catch (e2) {
      setMidiLabel("Recorder n/a");
      return;
    }
    recMix.ondataavailable = function (ev) {
      if (ev.data && ev.data.size) recChunks.push(ev.data);
    };
    recMix.onstop = function () {
      var blob = new Blob(recChunks, { type: recMix.mimeType || "audio/webm" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "the-voice-dj-mix.webm";
      a.click();
      window.setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
      recMix = null;
      setMidiLabel("Mix saved");
      paintDj();
    };
    recMix.start(200);
    setMidiLabel("Recording mix");
    paintDj();
  }

  function handleDjKey(e) {
    if (state.view !== "dj") return false;
    if (e.code === "KeyF") { toggleDeck("A"); return true; }
    if (e.code === "KeyG") { cueDeck("A"); return true; }
    if (e.code === "KeyH") { cueDeck("B"); return true; }
    if (e.code === "KeyJ") { toggleDeck("B"); return true; }
    if (e.code === "KeyT") { syncDeck("A"); return true; }
    if (e.code === "KeyY") { syncDeck("B"); return true; }
    if (e.code.indexOf("Digit") === 0 && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      var n = Number(e.code.slice(5));
      if (n >= 1 && n <= 8) { jumpHot(e.altKey ? "B" : "A", n - 1); return true; }
    }
    if (e.code === "KeyZ" && !e.ctrlKey) { setLoop("A", 4); return true; }
    if (e.code === "KeyX" && !e.ctrlKey) { setLoop("B", 4); return true; }
    return false;
  }

  function buildDjPanel() {
    djEl = el("div", "daw-dj");
    djEl.setAttribute("aria-label", "DJ live");
    var io = el("div", "daw-dj-io");
    io.appendChild(el("div", "daw-brand", "DJ Live"));
    var midiSel = document.createElement("select");
    midiSel.setAttribute("data-dj-midi", "1");
    midiSel.setAttribute("aria-label", "MIDI inputs");
    io.appendChild(midiSel);
    function inSel(which, lab) {
      var s = document.createElement("select");
      s.setAttribute("data-dj-in-" + which.toLowerCase(), "1");
      s.setAttribute("aria-label", lab);
      var o = document.createElement("option");
      o.value = "";
      o.textContent = lab;
      s.appendChild(o);
      s.addEventListener("change", function () {
        if (s.value) lineInDeck(which, s.value);
      });
      io.appendChild(s);
    }
    inSel("A", "Deck A input");
    inSel("B", "Deck B input");
    var outSel = document.createElement("select");
    outSel.setAttribute("data-dj-out", "1");
    outSel.setAttribute("aria-label", "Audio output");
    var oo = document.createElement("option");
    oo.value = "";
    oo.textContent = "Output device";
    outSel.appendChild(oo);
    outSel.addEventListener("change", function () { if (outSel.value) setOutputDevice(outSel.value); });
    io.appendChild(outSel);
    var rec = el("button", "daw-btn rec", "Rec mix");
    rec.type = "button";
    rec.setAttribute("data-dj-rec", "1");
    rec.setAttribute("aria-label", "Record DJ mix");
    rec.addEventListener("click", toggleRecordMix);
    io.appendChild(rec);
    var learnSel = document.createElement("select");
    learnSel.setAttribute("data-dj-learn", "1");
    learnSel.setAttribute("aria-label", "MIDI learn target");
    [["xfade", "XF"], ["volA", "Vol A"], ["volB", "Vol B"], ["pitchA", "Pitch A"], ["pitchB", "Pitch B"], ["jogA", "Jog A"], ["jogB", "Jog B"], ["eqLowA", "EQ Low A"], ["eqMidA", "EQ Mid A"], ["eqHiA", "EQ Hi A"], ["filterA", "Filter A"], ["eqLowB", "EQ Low B"], ["eqMidB", "EQ Mid B"], ["eqHiB", "EQ Hi B"], ["filterB", "Filter B"], ["playA", "Play A"], ["cueA", "Cue A"], ["playB", "Play B"], ["cueB", "Cue B"], ["syncA", "Sync A"], ["syncB", "Sync B"]].forEach(function (row) {
      var o = document.createElement("option");
      o.value = row[0];
      o.textContent = "Learn " + row[1];
      learnSel.appendChild(o);
    });
    io.appendChild(learnSel);
    var armLearn = el("button", "daw-btn", "Arm MIDI");
    armLearn.type = "button";
    armLearn.setAttribute("aria-label", "Arm MIDI learn for DJ control");
    armLearn.addEventListener("click", function () {
      midiLearn = learnSel.value;
      armLearn.classList.add("on");
      setMidiLabel("Move hardware for " + midiLearn);
      window.setTimeout(function () { armLearn.classList.remove("on"); }, 5000);
    });
    io.appendChild(armLearn);
    djEl.appendChild(io);

    var board = el("div", "daw-dj-board");
    function deckCol(id) {
      var col = el("div", "daw-dj-deck");
      col.setAttribute("data-dj-deck", id);
      var title = el("div", "daw-brand");
      title.setAttribute("data-dj-name", id);
      title.textContent = "Deck " + id + " · Empty";
      col.appendChild(title);
      var tools = el("div", "daw-dj-tools");
      var load = el("button", "daw-btn", "Load clip");
      load.type = "button";
      load.setAttribute("aria-label", "Load selected clip onto deck " + id);
      load.addEventListener("click", function () { loadSelectedToDeck(id); });
      tools.appendChild(load);
      var line = el("button", "daw-btn", "Line in");
      line.type = "button";
      line.setAttribute("aria-label", "Route audio interface into deck " + id);
      line.addEventListener("click", function () { lineInDeck(id); });
      tools.appendChild(line);
      var play = el("button", "daw-btn", "Play");
      play.type = "button";
      play.setAttribute("data-dj-play", id);
      play.setAttribute("aria-label", "Play deck " + id);
      play.addEventListener("click", function () { toggleDeck(id); });
      tools.appendChild(play);
      var cue = el("button", "daw-btn", "Cue");
      cue.type = "button";
      cue.setAttribute("aria-label", "Cue deck " + id);
      cue.addEventListener("click", function () { cueDeck(id); });
      tools.appendChild(cue);
      var sync = el("button", "daw-btn", "Sync");
      sync.type = "button";
      sync.setAttribute("data-dj-sync", id);
      sync.setAttribute("aria-label", "Sync deck " + id + " to BPM");
      sync.addEventListener("click", function () { syncDeck(id); });
      tools.appendChild(sync);
      var pfl = el("button", "daw-btn", "CUE");
      pfl.type = "button";
      pfl.setAttribute("data-dj-pfl", id);
      pfl.setAttribute("aria-label", "Headphones cue deck " + id);
      pfl.addEventListener("click", function () {
        decks[id].pfl = !decks[id].pfl;
        applyDeckMix();
        paintDj();
      });
      tools.appendChild(pfl);
      col.appendChild(tools);
      var meta = el("div", "daw-dj-meta");
      var bpmEl = el("div", "daw-brand");
      bpmEl.setAttribute("data-dj-bpm", id);
      bpmEl.textContent = "— BPM";
      var tEl = el("div", "daw-pos");
      tEl.setAttribute("data-dj-time", id);
      tEl.textContent = "0:00.0";
      var qBtn = el("button", "daw-btn on", "Q");
      qBtn.type = "button";
      qBtn.setAttribute("data-dj-q", id);
      qBtn.setAttribute("aria-label", "Quantize");
      qBtn.addEventListener("click", function () {
        decks[id].quantize = !decks[id].quantize;
        paintDj();
      });
      meta.appendChild(bpmEl);
      meta.appendChild(tEl);
      meta.appendChild(qBtn);
      col.appendChild(meta);
      var ov = document.createElement("canvas");
      ov.className = "daw-dj-ov";
      ov.width = 420;
      ov.height = 28;
      ov.setAttribute("data-dj-ov", id);
      ov.setAttribute("aria-label", "Deck " + id + " overview");
      ov.addEventListener("pointerdown", function (ev) {
        var d = decks[id];
        if (!d.buf) return;
        var rect = ov.getBoundingClientRect();
        seekDeck(id, ((ev.clientX - rect.left) / rect.width) * d.buf.duration);
      });
      col.appendChild(ov);
      var wave = document.createElement("canvas");
      wave.className = "daw-dj-wave";
      wave.width = 420;
      wave.height = 88;
      wave.setAttribute("data-dj-wave", id);
      wave.setAttribute("aria-label", "Deck " + id + " waveform");
      wave.addEventListener("pointerdown", function (ev) {
        var d = decks[id];
        if (!d.buf) return;
        var rect = wave.getBoundingClientRect();
        var pos = (d.playing && d.buf) ? deckPosSec(id) : (d.cueAt || 0);
        var window = Math.min(d.buf.duration, 8);
        var start = Math.max(0, Math.min(d.buf.duration - window, pos - window * 0.35));
        var x = (ev.clientX - rect.left) / rect.width;
        seekDeck(id, start + x * window);
      });
      col.appendChild(wave);
      var pads = el("div", "daw-dj-hots");
      for (var hi = 0; hi < 8; hi++) {
        (function (i) {
          var pad = el("button", "daw-btn daw-hot", String(i + 1));
          pad.type = "button";
          pad.setAttribute("data-hot", id + i);
          pad.setAttribute("aria-label", "Hot cue " + (i + 1));
          pad.addEventListener("click", function (ev) {
            if (ev.altKey || ev.shiftKey) clearHot(id, i);
            else jumpHot(id, i);
          });
          pads.appendChild(pad);
        })(hi);
      }
      col.appendChild(pads);
      var loops = el("div", "daw-dj-tools");
      [1, 2, 4, 8].forEach(function (beats) {
        var b = el("button", "daw-btn", beats + "B");
        b.type = "button";
        b.setAttribute("data-dj-loop", id);
        b.setAttribute("data-beats", String(beats));
        b.setAttribute("aria-label", beats + " beat loop");
        b.addEventListener("click", function () { setLoop(id, beats); });
        loops.appendChild(b);
      });
      var jn = el("button", "daw-btn", "−1");
      jn.type = "button";
      jn.setAttribute("aria-label", "Jump back one beat");
      jn.addEventListener("click", function () { beatJump(id, -1); });
      var jp = el("button", "daw-btn", "+1");
      jp.type = "button";
      jp.setAttribute("aria-label", "Jump forward one beat");
      jp.addEventListener("click", function () { beatJump(id, 1); });
      loops.appendChild(jn);
      loops.appendChild(jp);
      col.appendChild(loops);
      var eqRow = el("div", "daw-dj-eq");
      [["hi", "HI", "eqHi", "killHi"], ["mid", "MID", "eqMid", "killMid"], ["low", "LOW", "eqLow", "killLow"]].forEach(function (row) {
        var wrap = el("div", "daw-dj-eqcol");
        var kill = el("button", "daw-btn", row[1]);
        kill.type = "button";
        kill.setAttribute("data-kill", id + row[0]);
        kill.setAttribute("aria-label", row[1] + " kill");
        kill.addEventListener("click", function () {
          decks[id][row[3]] = !decks[id][row[3]];
          applyDeckEq(id);
          paintDj();
        });
        wrap.appendChild(kill);
        var kn = document.createElement("input");
        kn.type = "range";
        kn.min = "-18";
        kn.max = "6";
        kn.step = "0.1";
        kn.value = "0";
        kn.className = "daw-fader";
        kn.setAttribute("data-eq", id + row[0]);
        kn.setAttribute("aria-label", row[1] + " EQ");
        kn.addEventListener("input", function () {
          decks[id][row[2]] = Number(kn.value);
          applyDeckEq(id);
        });
        wrap.appendChild(kn);
        eqRow.appendChild(wrap);
      });
      var fwrap = el("div", "daw-dj-eqcol");
      fwrap.appendChild(el("span", "daw-knob-lab", "Filter"));
      var filt = document.createElement("input");
      filt.type = "range";
      filt.min = "0";
      filt.max = "1";
      filt.step = "0.01";
      filt.value = "0.5";
      filt.className = "daw-fader";
      filt.setAttribute("data-filt", id);
      filt.setAttribute("aria-label", "Channel filter");
      filt.addEventListener("input", function () {
        decks[id].filter = Number(filt.value);
        applyDeckEq(id);
      });
      fwrap.appendChild(filt);
      eqRow.appendChild(fwrap);
      col.appendChild(eqRow);
      var jog = el("div", "daw-dj-jog", id);
      jog.setAttribute("aria-label", "Deck " + id + " jog");
      bindJog(jog, id);
      col.appendChild(jog);
      var pitch = el("label", "daw-ctl");
      pitch.appendChild(document.createTextNode("Pitch"));
      var rate = document.createElement("input");
      rate.type = "range";
      rate.min = "0.84";
      rate.max = "1.16";
      rate.step = "0.001";
      rate.value = "1";
      rate.className = "daw-knob";
      rate.setAttribute("data-dj-rate", id);
      rate.setAttribute("aria-label", "Deck " + id + " pitch");
      var rateLab = el("span", "daw-pos");
      rateLab.setAttribute("data-dj-rate-lab", id);
      rateLab.textContent = "100%";
      rate.addEventListener("input", function () {
        decks[id].rate = Number(rate.value);
        applyDeckRate(id);
        rateLab.textContent = Math.round(decks[id].rate * 100) + "%";
      });
      pitch.appendChild(rate);
      pitch.appendChild(rateLab);
      col.appendChild(pitch);
      var volL = el("label", "daw-ctl");
      volL.appendChild(document.createTextNode("Level"));
      var vol = document.createElement("input");
      vol.type = "range";
      vol.min = "0";
      vol.max = "1.2";
      vol.step = "0.01";
      vol.value = "0.85";
      vol.className = "daw-knob";
      vol.setAttribute("data-dj-vol", id);
      vol.setAttribute("aria-label", "Deck " + id + " volume");
      vol.addEventListener("input", function () {
        decks[id].vol = Number(vol.value);
        applyDeckMix();
      });
      volL.appendChild(vol);
      col.appendChild(volL);
      return col;
    }
    board.appendChild(deckCol("A"));
    var mid = el("div", "daw-dj-mid");
    var phase = document.createElement("canvas");
    phase.width = 100;
    phase.height = 36;
    phase.className = "daw-dj-phase";
    phase.setAttribute("data-dj-phase", "1");
    phase.setAttribute("aria-label", "Beat phase");
    mid.appendChild(phase);
    mid.appendChild(el("div", "daw-knob-lab", "Crossfader"));
    var xf = document.createElement("input");
    xf.type = "range";
    xf.min = "0";
    xf.max = "1";
    xf.step = "0.01";
    xf.value = String(state.xfade == null ? 0.5 : state.xfade);
    xf.className = "daw-xfade";
    xf.setAttribute("aria-label", "DJ crossfader");
    xf.addEventListener("input", function () {
      state.xfade = Number(xf.value);
      applyXfade();
    });
    mid.appendChild(xf);
    mid.appendChild(el("div", "daw-roll-hint", "A ← → B"));
    board.appendChild(mid);
    board.appendChild(deckCol("B"));
    djEl.appendChild(board);
    djEl.appendChild(el("div", "daw-roll-hint", "Production stays on Session/Arrange. DJ Live is two independent decks. Load a clip or route any audio interface (Line in). MIDI controllers: Arm MIDI, then move a knob or pad. Pitch-bend jogs platters. F/G and J/H are play/cue. Rekordbox-style: colored waveforms, 8 hot cues, 1–8 beat loops, 3-band EQ + kill, channel filter, BPM detect, beat-sync + phase. Alt-click a pad to clear. Rec mix records the master bus."));
    return djEl;
  }

  function setMode(m) {
    state.mode = m;
    if (root) {
      root.classList.toggle("is-dj", m === "dj");
    }
    root.querySelectorAll("[data-mode]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === m);
    });
    if (m === "dj") {
      state.view = "dj";
      ensureAudio();
      ensureDeckGraph();
      applyDeckMix();
      populateIo();
      paintDj();
    } else if (state.view === "dj") {
      setView("session");
    }
    paint();
  }


  function applyMix() {
    if (!ctx) return;
    var soloed = anySolo();
    state.tracks.forEach(function (tr) {
      var g = trackGraph[tr.id];
      if (!g) return;
      var silent = tr.mute || (soloed && !tr.solo);
      g.mute.gain.setTargetAtTime(silent ? 0 : 1, ctx.currentTime, 0.01);
      if (g.pflSend) g.pflSend.gain.setTargetAtTime(tr.pfl ? 1 : 0, ctx.currentTime, 0.01);
      applyAutoAt(tr, state.step);
      applyDevices(tr);
    });
    applyXfade();
    if (master) master.gain.setTargetAtTime(state.masterVol, ctx.currentTime, 0.01);
    if (cueGain) cueGain.gain.setTargetAtTime(state.cueVol == null ? 0.8 : state.cueVol, ctx.currentTime, 0.01);
    if (returnAGain) returnAGain.gain.setTargetAtTime(state.returnAVol, ctx.currentTime, 0.01);
    if (returnBGain) returnBGain.gain.setTargetAtTime(state.returnBVol, ctx.currentTime, 0.01);
    paintMixer();
  }

  function autoMaxStep() {
    return BARS * STEPS_PER_BAR;
  }

  function ensureAuto(tr, key, defV) {
    key = key || "autoVol";
    if (defV == null) defV = key === "autoPan" ? 0.5 : 1;
    if (!tr[key] || tr[key].length < 2) {
      tr[key] = [{ step: 0, v: defV }, { step: autoMaxStep(), v: defV }];
    }
    tr[key].sort(function (a, b) { return a.step - b.step; });
    return tr[key];
  }

  function autoAt(tr, key, step, defV) {
    var pts = ensureAuto(tr, key, defV);
    if (step <= pts[0].step) return pts[0].v;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      if (step >= a.step && step <= b.step) {
        var u = (step - a.step) / (b.step - a.step || 1);
        return a.v + (b.v - a.v) * u;
      }
    }
    return pts[pts.length - 1].v;
  }

  function applyAutoAt(tr, step, time) {
    var g = trackGraph[tr.id];
    if (!g || !ctx) return;
    var val = Math.max(0, Math.min(1.2, tr.volume * autoAt(tr, "autoVol", step, 1)));
    var pan = Math.max(-1, Math.min(1, (tr.pan || 0) + (autoAt(tr, "autoPan", step, 0.5) - 0.5) * 2));
    var sA = Math.max(0, Math.min(1, (tr.sendA || 0) + autoAt(tr, "autoSendA", step, 0)));
    var sB = Math.max(0, Math.min(1, (tr.sendB || 0) + autoAt(tr, "autoSendB", step, 0)));
    var analog = getDevice(tr, "analog") || {};
    var base = analog.on ? Math.max(80, analog.cutoff || 2000) : 18000;
    var cutN = Math.max(0, Math.min(1, autoAt(tr, "autoCut", step, 1)));
    var hz = 80 * Math.pow(base / 80, cutN);
    if (time != null) {
      g.vol.gain.setValueAtTime(val, time);
      if (g.pan && g.pan.pan) g.pan.pan.setValueAtTime(pan, time);
      if (g.sendA) g.sendA.gain.setValueAtTime(sA, time);
      if (g.sendB) g.sendB.gain.setValueAtTime(sB, time);
      if (g.analogFilt) g.analogFilt.frequency.setValueAtTime(hz, time);
    } else {
      g.vol.gain.setTargetAtTime(val, ctx.currentTime, 0.01);
      if (g.pan && g.pan.pan) g.pan.pan.setTargetAtTime(pan, ctx.currentTime, 0.01);
      if (g.sendA) g.sendA.gain.setTargetAtTime(sA, ctx.currentTime, 0.01);
      if (g.sendB) g.sendB.gain.setTargetAtTime(sB, ctx.currentTime, 0.01);
      if (g.analogFilt) g.analogFilt.frequency.setTargetAtTime(hz, ctx.currentTime, 0.01);
    }
  }

  function meterLevel(analyser) {
    if (!analyser) return 0;
    var buf = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(buf);
    var peak = 0;
    for (var i = 0; i < buf.length; i++) {
      var v = Math.abs((buf[i] - 128) / 128);
      if (v > peak) peak = v;
    }
    return peak;
  }

  function dawOnScreen() {
    var music = document.getElementById("music-view");
    return !document.hidden && music && !music.hidden;
  }

  function stopMeters() {
    if (meterRaf) window.cancelAnimationFrame(meterRaf);
    meterRaf = 0;
  }

  function startMeters() {
    if (meterRaf) return;
    function tick() {
      if (!dawOnScreen()) {
        meterRaf = 0;
        return;
      }
      meterRaf = window.requestAnimationFrame(tick);
      state.tracks.forEach(function (tr) {
        var g = trackGraph[tr.id];
        if (!g || !g.meter) return;
        var lvl = meterLevel(g.analyser);
        g.peak = Math.max(lvl, (g.peak || 0) * 0.82);
        g.meter.style.transform = "scaleY(" + Math.max(0.02, g.peak) + ")";
      });
      if (masterAnalyser && mixerEl) {
        var mm = mixerEl.querySelector("[data-master-meter]");
        if (mm) {
          var ml = meterLevel(masterAnalyser);
          mixerEl._mpeak = Math.max(ml, (mixerEl._mpeak || 0) * 0.82);
          mm.style.transform = "scaleY(" + Math.max(0.02, mixerEl._mpeak) + ")";
        }
      }
    }
    tick();
  }

  function secondsPerStep() {
    return 60 / state.bpm / 4;
  }

  function clipFadeMul(clipObj, localStep) {
    var n = (clipObj && clipObj.notes) || {};
    var len = clipObj.length || STEPS;
    var fi = Math.max(0, n.fadeIn || 0);
    var fo = Math.max(0, n.fadeOut || 0);
    var mul = 1;
    if (fi > 0 && localStep < fi) mul *= localStep / fi;
    if (fo > 0 && localStep >= len - fo) mul *= Math.max(0, (len - localStep) / fo);
    return Math.max(0, Math.min(1, mul));
  }

  function ensureClipEnv(clipObj) {
    if (!clipObj.notes) clipObj.notes = {};
    var n = clipObj.notes;
    var len = Math.max(2, clipObj.length || STEPS);
    if (!n.env || n.env.length < 2) {
      n.env = [{ step: 0, v: 1 }, { step: len, v: 1 }];
    }
    n.env.sort(function (a, b) { return a.step - b.step; });
    n.env[0].step = 0;
    n.env[n.env.length - 1].step = len;
    return n.env;
  }

  function clipEnvMul(clipObj, localStep) {
    if (!clipObj) return 1;
    var pts = ensureClipEnv(clipObj);
    var len = Math.max(1, clipObj.length || STEPS);
    var step = ((localStep % len) + len) % len;
    if (step <= pts[0].step) return pts[0].v;
    for (var i = 0; i < pts.length - 1; i++) {
      var a = pts[i], b = pts[i + 1];
      if (step >= a.step && step <= b.step) {
        var u = (step - a.step) / (b.step - a.step || 1);
        return Math.max(0, Math.min(1.2, a.v + (b.v - a.v) * u));
      }
    }
    return pts[pts.length - 1].v;
  }

  function fadedDest(dest, time, mul) {
    if (!ctx || mul >= 0.999) return dest;
    var g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.0001, mul), time);
    g.connect(dest);
    return g;
  }

  function clipsAt(trackId, step) {
    var out = [];
    for (var i = 0; i < state.arrangeClips.length; i++) {
      var c = state.arrangeClips[i];
      if (c.trackId === trackId && step >= c.start && step < c.start + c.length) out.push(c);
    }
    out.sort(function (a, b) { return a.start - b.start; });
    return out;
  }

  var clipXfGain = {};

  function xfDest(track, clip, time, mul) {
    var id = (clip && clip.id) || track.id;
    var g = clipXfGain[id];
    if (!g) {
      g = ctx.createGain();
      g.connect(trackNodes[track.id]);
      clipXfGain[id] = g;
    }
    g.gain.setValueAtTime(Math.max(0.0001, mul), time);
    return g;
  }

  function xfadeMul(clip, step, hits) {
    if (!hits || hits.length < 2) return 1;
    var mul = 1;
    for (var i = 0; i < hits.length; i++) {
      var o = hits[i];
      if (o === clip) continue;
      var ov0 = Math.max(clip.start, o.start);
      var ov1 = Math.min(clip.start + clip.length, o.start + o.length);
      if (step < ov0 || step >= ov1 || ov1 <= ov0) continue;
      var t = (step - ov0) / (ov1 - ov0);
      if (clip.start <= o.start) mul *= 1 - t;
      else mul *= t;
    }
    return Math.max(0, Math.min(1, mul));
  }

  function stepsPerBeat() {
    return Math.max(1, Math.round(16 / state.timeDen));
  }

  function stepsPerBar() {
    return Math.max(4, state.timeNum * stepsPerBeat());
  }

  function clickMetro(time, accent) {
    if (!ctx || !metroGain) return;
    var dest = metroGain;
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, time);
    g.gain.exponentialRampToValueAtTime(accent ? 0.45 : 0.18, time + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, time + (accent ? 0.09 : 0.045));
    g.connect(dest);
    var o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(accent ? 1760 : 1174, time);
    o.connect(g);
    o.start(time);
    o.stop(time + 0.1);
  }

  function syncBpmField() {
    if (bpmInput) bpmInput.value = String(state.bpm);
  }

  function tapTempo() {
    var now = (typeof performance !== "undefined" ? performance.now() : Date.now());
    if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
    taps.push(now);
    if (taps.length > 6) taps = taps.slice(-6);
    if (taps.length < 2) return;
    var sum = 0;
    for (var i = 1; i < taps.length; i++) sum += taps[i] - taps[i - 1];
    var avg = sum / (taps.length - 1);
    state.bpm = Math.min(240, Math.max(40, Math.round(60000 / avg)));
    syncBpmField();
  }

  function armRecord() {
    ensureAudio();
    ctx.resume();
    state.recording = !state.recording;
    if (state.recording) {
      state.punch = true;
      if (!state.playing) {
        state.countIn = stepsPerBar();
        state.metro = true;
        startTransport();
      }
    }
    paint();
  }

  function envGain(dest, t0, peak, a, d) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + a + d);
    g.connect(dest);
    return g;
  }

  function osc(type, freq, dest, t0, dur) {
    var o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.connect(dest);
    o.start(t0);
    o.stop(t0 + dur);
    return o;
  }

  function noiseBuffer() {
    var len = Math.floor(ctx.sampleRate * 0.4);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  var noiseBuf = null;
  function noiseBurst(dest, t0, dur, hpHz) {
    if (!noiseBuf) noiseBuf = noiseBuffer();
    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var f = ctx.createBiquadFilter();
    f.type = hpHz > 2000 ? "highpass" : "bandpass";
    f.frequency.value = hpHz;
    f.Q.value = hpHz > 2000 ? 0.7 : 1.2;
    src.connect(f);
    f.connect(dest);
    src.start(t0);
    src.stop(t0 + dur);
  }

  function midiHz(semi) {
    return 55 * Math.pow(2, semi / 12);
  }

  function trigKick(dest, t) {
    var g = envGain(dest, t, 0.95, 0.004, 0.28);
    var o = osc("sine", 150, g, t, 0.3);
    o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  }
  function trigSnare(dest, t) {
    var g = envGain(dest, t, 0.45, 0.002, 0.16);
    osc("triangle", 190, g, t, 0.12);
    var ng = envGain(dest, t, 0.55, 0.001, 0.14);
    noiseBurst(ng, t, 0.16, 1800);
  }
  function trigHat(dest, t, open) {
    var g = envGain(dest, t, open ? 0.22 : 0.16, 0.001, open ? 0.18 : 0.05);
    noiseBurst(g, t, open ? 0.2 : 0.06, 7000);
  }
  function trigBass(dest, t, semi, track) {
    var analog = analogOf(track);
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = analog ? analog.cutoff : 420;
    f.Q.value = analog ? analog.res : 0.8;
    f.connect(dest);
    var g = envGain(f, t, 0.38, analog ? analog.attack : 0.01, analog ? analog.decay : 0.22);
    osc(analog ? analog.wave : "sawtooth", midiHz(semi), g, t, (analog ? analog.decay : 0.22) + 0.04);
  }
  function trigChord(dest, t, semis, dur, peak, track) {
    var analog = analogOf(track);
    var wave = analog ? analog.wave : "triangle";
    var atk = analog ? analog.attack : 0.02;
    var d = analog ? analog.decay : dur;
    semis.forEach(function (s, i) {
      var g = envGain(dest, t, (peak || 0.12) / (i + 1), atk, d);
      osc(wave, midiHz(s + 12), g, t, d + 0.02);
    });
  }
  function trigLead(dest, t, semi, track) {
    var analog = analogOf(track);
    var wave = analog ? analog.wave : "square";
    var g = envGain(dest, t, 0.18, analog ? analog.attack : 0.008, analog ? analog.decay : 0.2);
    osc(wave, midiHz(semi + 12), g, t, (analog ? analog.decay : 0.2) + 0.02);
  }
  function trigPerc(dest, t, kind) {
    var g = envGain(dest, t, kind ? 0.2 : 0.12, 0.001, 0.07);
    noiseBurst(g, t, 0.08, kind ? 2400 : 5000);
  }
  function trigTom(dest, t) {
    var g = envGain(dest, t, 0.5, 0.004, 0.22);
    var o = osc("sine", 180, g, t, 0.26);
    o.frequency.exponentialRampToValueAtTime(88, t + 0.14);
  }
  function trigClap(dest, t) {
    [0, 0.014, 0.028].forEach(function (off) {
      noiseBurst(envGain(dest, t + off, 0.38, 0.001, 0.09), t + off, 0.1, 1600);
    });
  }
  function trigRim(dest, t) {
    var g = envGain(dest, t, 0.32, 0.001, 0.05);
    osc("square", 400, g, t, 0.045);
    noiseBurst(envGain(dest, t, 0.18, 0.001, 0.04), t, 0.05, 2600);
  }

  function startPad(tr, clipObj) {
    stopPad(tr.id);
    if (!ctx || !clipObj) return;
    var dest = trackNodes[tr.id];
    var analog = analogOf(tr);
    var g = ctx.createGain();
    g.gain.value = 0.08;
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = analog ? analog.cutoff : 4200;
    f.Q.value = analog ? analog.res : 0.7;
    f.connect(dest);
    g.connect(f);
    var wave = analog ? analog.wave : "sine";
    var oscs = (clipObj.notes.chord || [0, 7, 12]).map(function (s, i) {
      var o = ctx.createOscillator();
      o.type = wave;
      o.frequency.value = midiHz(s + 12) * (i === 1 ? 1.003 : 1);
      o.connect(g);
      o.start();
      return o;
    });
    padHold[tr.id] = { g: g, oscs: oscs };
    lastPadClip[tr.id] = clipObj;
  }

  function stopPad(id) {
    var h = padHold[id];
    if (!h) return;
    try {
      h.oscs.forEach(function (o) {
        o.stop();
      });
    } catch (e) {}
    try {
      h.g.disconnect();
    } catch (e2) {}

    delete padHold[id];
    delete lastPadClip[id];
  }

  function startAudioLoop(tr, clipObj) {
    stopAudioLoop(tr.id);
    if (!ctx || !clipObj || !clipObj.notes || !clipObj.notes.buffer) return;
    var dest = trackNodes[tr.id];
    if (!dest) return;
    var src = ctx.createBufferSource();
    src.buffer = clipObj.notes.buffer;
    src.loop = true;
    src.connect(dest);
    src.start();
    audioHold[tr.id] = src;
  }

  function stopAudioLoop(id) {
    var s = audioHold[id];
    if (!s) return;
    try { s.stop(); } catch (e) {}
    try { s.disconnect(); } catch (e2) {}
    delete audioHold[id];
  }

  function makeToneBuffer(freq) {
    ensureAudio();
    var beat = 60 / state.bpm;
    var len = Math.floor(ctx.sampleRate * beat * 4);
    var buf = ctx.createBuffer(1, Math.max(ctx.sampleRate, len), ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) {
      var tm = i / ctx.sampleRate;
      var env = Math.exp(-tm * 2.2);
      var bar = (i / (ctx.sampleRate * beat)) % 4;
      var click = bar % 1 < 0.08 ? 1 : 0.35;
      d[i] = Math.sin(2 * Math.PI * freq * tm) * env * click * 0.28;
    }
    return buf;
  }

  function blankTrack(kind, name) {
    var id = kind + "-" + trackSeq++;
    return {
      id: id,
      name: name,
      kind: kind,
      role: kind === "audio" ? "audio" : "midi",
      color: COLORS[state.tracks.length % COLORS.length],
      volume: 0.85,
      xf: "",
      pan: 0,
      mute: false,
      solo: false,
      arm: false,
      sendA: 0,
      sendB: 0,
      devices: defaultDevices(kind),
      clips: new Array(SCENES).fill(null),
    };
  }

  var undoStack = [];
  var redoStack = [];
  var undoLock = false;

  function lightClip(c) {
    if (!c) return null;
    return { name: c.name, color: c.color, length: c.length, notes: cloneNotes(c.notes) };
  }

  function lightSnap() {
    return {
      tracks: state.tracks.map(function (tr) {
        return {
          id: tr.id,
          name: tr.name,
          kind: tr.kind,
          role: tr.role,
          color: tr.color,
          volume: tr.volume,
          xf: tr.xf || "",
          pan: tr.pan,
          mute: tr.mute,
          solo: tr.solo,
          arm: tr.arm,
          pfl: !!tr.pfl,
          sendA: tr.sendA,
          sendB: tr.sendB,
          devices: JSON.parse(JSON.stringify(tr.devices || [])),
          clips: tr.clips.map(lightClip),
          autoVol: (tr.autoVol || []).map(function (p) { return { step: p.step, v: p.v }; }),
          autoPan: (tr.autoPan || []).map(function (p) { return { step: p.step, v: p.v }; }),
          autoSendA: (tr.autoSendA || []).map(function (p) { return { step: p.step, v: p.v }; }),
          autoSendB: (tr.autoSendB || []).map(function (p) { return { step: p.step, v: p.v }; }),
          autoCut: (tr.autoCut || []).map(function (p) { return { step: p.step, v: p.v }; }),
        };
      }),
      arrangeClips: state.arrangeClips.map(function (c) {
        return {
          id: c.id,
          trackId: c.trackId,
          start: c.start,
          length: c.length,
          name: c.name,
          color: c.color,
          notes: cloneNotes(c.notes),
        };
      }),
      locators: (state.locators || []).map(function (l) { return { id: l.id, bar: l.bar, name: l.name }; }),
    };
  }

  function pushUndo() {
    if (undoLock) return;
    undoStack.push(lightSnap());
    if (undoStack.length > 24) undoStack.shift();
    redoStack.length = 0;
  }

  function restoreLight(snap) {
    if (!snap) return;
    undoLock = true;
    var keep = {};
    snap.tracks.forEach(function (s) { keep[s.id] = true; });
    state.tracks.slice().forEach(function (tr) {
      if (!keep[tr.id]) removeTrack(tr.id);
    });
    var next = [];
    snap.tracks.forEach(function (s) {
      var tr = state.tracks.find(function (x) { return x.id === s.id; });
      if (!tr) {
        tr = blankTrack(s.kind || "midi", s.name);
        tr.id = s.id;
        tr.kind = s.kind;
        tr.role = s.role;
        tr.color = s.color;
        wireTrack(tr);
      }
      tr.name = s.name;
      tr.volume = s.volume;
      tr.xf = s.xf || "";
      tr.pan = s.pan;
      tr.mute = s.mute;
      tr.solo = s.solo;
      tr.arm = s.arm;
      tr.pfl = !!s.pfl;
      tr.sendA = s.sendA;
      tr.sendB = s.sendB;
      tr.devices = s.devices;
      tr.clips = (s.clips || []).map(function (c) {
        return c ? clip(c.name, c.color, cloneNotes(c.notes)) : null;
      });
      tr.autoVol = (s.autoVol || []).map(function (p) { return { step: p.step, v: p.v }; });
      tr.autoPan = (s.autoPan || []).map(function (p) { return { step: p.step, v: p.v }; });
      tr.autoSendA = (s.autoSendA || []).map(function (p) { return { step: p.step, v: p.v }; });
      tr.autoSendB = (s.autoSendB || []).map(function (p) { return { step: p.step, v: p.v }; });
      tr.autoCut = (s.autoCut || []).map(function (p) { return { step: p.step, v: p.v }; });
      next.push(tr);
    });
    state.tracks = next;
    state.arrangeClips = (snap.arrangeClips || []).map(function (c) {
      return {
        id: c.id,
        trackId: c.trackId,
        start: c.start,
        length: c.length,
        name: c.name,
        color: c.color,
        notes: cloneNotes(c.notes),
      };
    });
    state.locators = (snap.locators || []).map(function (l) { return { id: l.id, bar: l.bar, name: l.name }; });
    applyMix();
    rebuildTrackUi();
    paintArrange();
    undoLock = false;
  }

  function undoEdit() {
    if (!undoStack.length) return;
    redoStack.push(lightSnap());
    restoreLight(undoStack.pop());
    setMidiLabel("Undo");
  }

  function redoEdit() {
    if (!redoStack.length) return;
    undoStack.push(lightSnap());
    restoreLight(redoStack.pop());
    setMidiLabel("Redo");
  }

  function splitRollAt(notes, cut) {
    var roll = (notes && notes.roll) || [];
    if (!roll.length) return { left: notes, right: cloneNotes(notes) };
    var L = [], R = [];
    roll.forEach(function (n) {
      var s = n.start || 0;
      var e = s + (n.length || 1);
      if (e <= cut) L.push({ id: n.id, start: s, length: n.length, pitch: n.pitch, vel: n.vel });
      else if (s >= cut) R.push({ id: n.id + "-r", start: s - cut, length: n.length, pitch: n.pitch, vel: n.vel });
      else {
        L.push({ id: n.id, start: s, length: cut - s, pitch: n.pitch, vel: n.vel });
        R.push({ id: n.id + "-r", start: 0, length: e - cut, pitch: n.pitch, vel: n.vel });
      }
    });
    var left = cloneNotes(notes);
    var right = cloneNotes(notes);
    left.roll = L;
    right.roll = R;
    return { left: left, right: right };
  }

  function splitGrid(arr, cut) {
    if (!arr) return { left: arr, right: arr };
    return { left: arr.slice(0, cut), right: arr.slice(cut) };
  }

  function splitSelectedArrange() {
    if (state.view !== "arrange" || !state.selectedArrange) return false;
    var c = null;
    state.arrangeClips.forEach(function (x) { if (x.id === state.selectedArrange) c = x; });
    if (!c) return false;
    var cut = state.step;
    if (cut <= c.start + 1 || cut >= c.start + c.length - 1) {
      setMidiLabel("Move playhead over clip");
      return true;
    }
    pushUndo();
    var leftLen = cut - c.start;
    var rightLen = c.length - leftLen;
    var notes = c.notes || {};
    var parts = splitRollAt(notes, leftLen);
    var rightNotes = parts.right;
    c.notes = parts.left;
    if (notes.k) {
      var gk = splitGrid(notes.k, leftLen % (notes.k.length || STEPS));
      c.notes.k = gk.left; rightNotes.k = gk.right;
    }
    rightNotes.offset = (notes.offset || 0) + leftLen;
    c.length = leftLen;
    var right = {
      id: c.trackId + "-split-" + Date.now(),
      trackId: c.trackId,
      start: cut,
      length: rightLen,
      name: c.name,
      color: c.color,
      notes: rightNotes,
    };
    state.arrangeClips.push(right);
    state.selectedArrange = right.id;
    paintArrange();
    setMidiLabel("Split");
    return true;
  }

  function duplicateArrangeClip() {
    var c = null;
    state.arrangeClips.forEach(function (x) { if (x.id === state.selectedArrange) c = x; });
    if (!c) return false;
    pushUndo();
    var copy = {
      id: c.trackId + "-dup-" + Date.now(),
      trackId: c.trackId,
      start: c.start + c.length,
      length: c.length,
      name: c.name,
      color: c.color,
      notes: cloneNotes(c.notes),
    };
    state.arrangeClips.push(copy);
    state.selectedArrange = copy.id;
    paintArrange();
    setMidiLabel("Dup clip");
    return true;
  }

  function toggleClipLoop() {
    pushUndo();
    var clip = null;
    if (state.view === "arrange" && state.selectedArrange) {
      state.arrangeClips.forEach(function (x) { if (x.id === state.selectedArrange) clip = x; });
    }
    if (!clip && state.selectedSession) clip = state.selectedSession.clip;
    if (!clip) return;
    if (!clip.notes) clip.notes = {};
    if (!clip.notes.loopLen) clip.notes.loopLen = clip.length || STEPS;
    clip.notes.loop = clip.notes.loop === false;
    setMidiLabel(clip.notes.loop !== false ? "Loop on" : "Loop off");
    paintArrange();
    paint();
  }

  function duplicateSelectedClip() {
    if (state.view === "arrange" && state.selectedArrange && duplicateArrangeClip()) return;
    var sel = state.selectedSession;
    if (!sel || !sel.track || !sel.clip) return;
    var clips = sel.track.clips;
    var from = clips.indexOf(sel.clip);
    if (from < 0) {
      for (var i = 0; i < clips.length; i++) if (clips[i] === sel.clip) from = i;
    }
    var dest = -1;
    var start = from < 0 ? 0 : from + 1;
    for (var j = start; j < SCENES; j++) if (!clips[j]) { dest = j; break; }
    if (dest < 0) for (var k = 0; k < SCENES; k++) if (!clips[k]) { dest = k; break; }
    if (dest < 0) return;
    pushUndo();
    clips[dest] = clip(sel.clip.name, sel.clip.color, cloneNotes(sel.clip.notes));
    rebuildSessionGrid();
    paint();
    setMidiLabel("Dup " + sel.clip.name);
  }

  function addTrack(kind) {
    pushUndo();
    ensureAudio();
    ctx.resume();
    var nMidi = state.tracks.filter(function (x) { return x.role !== "audio"; }).length + 1;
    var nAud = state.tracks.filter(function (x) { return x.role === "audio"; }).length + 1;
    var tr;
    if (kind === "audio") {
      tr = blankTrack("audio", "Audio " + nAud);
      tr.clips[0] = clip("Tone", tr.color, { buffer: makeToneBuffer(110 + nAud * 37) });
    } else {
      tr = blankTrack("midi", "MIDI " + nMidi);
      tr.kind = "midi";
      tr.clips[0] = clip("Stab", tr.color, { chord: [0, 3, 7], hits: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0] });
    }
    state.tracks.push(tr);
    wireTrack(tr);
    applyMix();
    rebuildTrackUi();
  }

  function addReturn() {
    pushUndo();
    ensureAudio();
    ctx.resume();
    var n = extraReturns.length + 3;
    var delay = ctx.createDelay(1);
    delay.delayTime.value = 0.18 + extraReturns.length * 0.07;
    var fb = ctx.createGain();
    fb.gain.value = 0.28;
    delay.connect(fb);
    fb.connect(delay);
    var g = ctx.createGain();
    g.gain.value = 0.75;
    delay.connect(g);
    g.connect(master);
    extraReturns.push({ id: "ret-" + n, name: "Return " + n, delay: delay, gain: g, volume: 0.75 });
    rebuildTrackUi();
  }

  function removeTrack(id) {
    if (state.tracks.length <= 1) return;
    pushUndo();
    stopPad(id);
    stopAudioLoop(id);
    delete state.launched[id];
    delete state.queued[id];
    state.arrangeClips = state.arrangeClips.filter(function (c) { return c.trackId !== id; });
    delete trackGraph[id];
    delete trackNodes[id];
    state.tracks = state.tracks.filter(function (x) { return x.id !== id; });
    rebuildTrackUi();
    applyMix();
  }

  function moveTrack(id, dir) {
    var i = -1;
    state.tracks.forEach(function (tr, idx) { if (tr.id === id) i = idx; });
    var j = i + dir;
    if (i < 0 || j < 0 || j >= state.tracks.length) return;
    pushUndo();
    var tmp = state.tracks[i];
    state.tracks[i] = state.tracks[j];
    state.tracks[j] = tmp;
    rebuildTrackUi();
  }

  function loadAudioFile(track) {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "audio/*,.wav,.mp3,.ogg,.m4a";
    inp.addEventListener("change", function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      ensureAudio();
      f.arrayBuffer().then(function (ab) {
        return ctx.decodeAudioData(ab.slice(0));
      }).then(function (buf) {
        pushUndo();
        track.clips[0] = clip((f.name || "Sample").replace(/\.[^.]+$/, ""), track.color, { buffer: buf });
        rebuildTrackUi();
        paint();
      }).catch(function () {});
    });
    inp.click();
  }


  function playBufferShot(dest, buf, time, gain) {
    if (!ctx || !dest || !buf) return;
    var g = ctx.createGain();
    g.gain.setValueAtTime(Math.max(0.05, gain == null ? 1 : gain), time);
    g.connect(dest);
    var src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(g);
    src.start(time);
  }

  function makeKickBuffer() {
    ensureAudio();
    var sr = ctx.sampleRate, len = Math.floor(sr * 0.42);
    var buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var tm = i / sr;
      d[i] = Math.sin(2 * Math.PI * (48 + 110 * Math.exp(-tm * 22)) * tm) * Math.exp(-tm * 7) * 0.95;
    }
    return buf;
  }
  function makeSnareBuffer() {
    ensureAudio();
    var sr = ctx.sampleRate, len = Math.floor(sr * 0.28);
    var buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var tm = i / sr;
      var nz = Math.random() * 2 - 1;
      d[i] = (Math.sin(2 * Math.PI * 190 * tm) * 0.35 + nz * 0.7) * Math.exp(-tm * 14) * 0.85;
    }
    return buf;
  }
  function makeHatBuffer(open) {
    ensureAudio();
    var sr = ctx.sampleRate, len = Math.floor(sr * (open ? 0.32 : 0.08));
    var buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var tm = i / sr;
      d[i] = (Math.random() * 2 - 1) * Math.exp(-tm * (open ? 8 : 38)) * 0.45;
    }
    return buf;
  }
  function makeTomBuffer() {
    ensureAudio();
    var sr = ctx.sampleRate, len = Math.floor(sr * 0.36);
    var buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var tm = i / sr;
      d[i] = Math.sin(2 * Math.PI * (88 + 90 * Math.exp(-tm * 10)) * tm) * Math.exp(-tm * 6) * 0.7;
    }
    return buf;
  }
  function makeClapBuffer() {
    ensureAudio();
    var sr = ctx.sampleRate, len = Math.floor(sr * 0.22);
    var buf = ctx.createBuffer(1, len, sr), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      var tm = i / sr;
      var burst = (tm % 0.016) < 0.006 ? 1 : 0.25;
      d[i] = (Math.random() * 2 - 1) * burst * Math.exp(-tm * 12) * 0.7;
    }
    return buf;
  }
  function makeLoopBuffer() {
    ensureAudio();
    var sr = ctx.sampleRate, beat = 60 / state.bpm, len = Math.floor(sr * beat * 4);
    var buf = ctx.createBuffer(1, Math.max(sr, len), sr), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) {
      var tm = i / sr, env = Math.exp(-(tm % beat) * 8);
      d[i] = Math.sin(2 * Math.PI * 110 * tm) * env * 0.28 + Math.sin(2 * Math.PI * 165 * tm) * env * 0.12;
    }
    return buf;
  }

  function ensureLib() {
    if (libItems.length) return libItems;
    libItems = [
      { id: "inst-saw", cat: "Instruments", name: "Analog Saw", kind: "instrument", analog: { wave: "sawtooth", cutoff: 2400, res: 0.9, attack: 0.01, decay: 0.22 } },
      { id: "inst-square", cat: "Instruments", name: "Analog Square", kind: "instrument", analog: { wave: "square", cutoff: 1600, res: 1.3, attack: 0.008, decay: 0.18 } },
      { id: "inst-bass", cat: "Instruments", name: "Analog Bass", kind: "instrument", analog: { wave: "sawtooth", cutoff: 420, res: 1.5, attack: 0.012, decay: 0.3 } },
      { id: "inst-keys", cat: "Instruments", name: "Analog Keys", kind: "instrument", analog: { wave: "triangle", cutoff: 3200, res: 0.7, attack: 0.02, decay: 0.35 } },
      { id: "inst-pad", cat: "Instruments", name: "Analog Pad", kind: "instrument", analog: { wave: "sine", cutoff: 1400, res: 0.45, attack: 0.14, decay: 0.9 } },
      { id: "smp-kick", cat: "Samples", name: "Kick", kind: "sample", make: makeKickBuffer },
      { id: "smp-snare", cat: "Samples", name: "Snare", kind: "sample", make: makeSnareBuffer },
      { id: "smp-hat", cat: "Samples", name: "Closed Hat", kind: "sample", make: function () { return makeHatBuffer(false); } },
      { id: "smp-oh", cat: "Samples", name: "Open Hat", kind: "sample", make: function () { return makeHatBuffer(true); } },
      { id: "smp-tom", cat: "Samples", name: "Tom", kind: "sample", make: makeTomBuffer },
      { id: "smp-clap", cat: "Samples", name: "Clap", kind: "sample", make: makeClapBuffer },
      { id: "smp-loop", cat: "Samples", name: "Pulse Loop", kind: "sample", make: makeLoopBuffer },
    ];
    return libItems;
  }

  function libById(id) {
    ensureLib();
    for (var i = 0; i < libItems.length; i++) if (libItems[i].id === id) return libItems[i];
    return null;
  }

  function sampleBuffer(item) {
    if (!item) return null;
    if (item.buffer) return item.buffer;
    if (item.make) item.buffer = item.make();
    return item.buffer || null;
  }

  function previewLib(item) {
    ensureAudio();
    ctx.resume();
    if (item.kind === "instrument") {
      var dest = cueGain || master || ctx.destination;
      var a = item.analog;
      var f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = a.cutoff;
      f.Q.value = a.res;
      f.connect(dest);
      var g = envGain(f, ctx.currentTime, 0.22, a.attack, a.decay);
      osc(a.wave, midiHz(12), g, ctx.currentTime, a.decay + 0.05);
      return;
    }
    var buf = sampleBuffer(item);
    if (!buf) return;
    playBufferShot(cueGain || master || ctx.destination, buf, ctx.currentTime, 0.9);
  }

  function applyInstrument(track, analog) {
    var d = getDevice(track, "analog");
    if (!d) return;
    d.on = true;
    d.wave = analog.wave;
    d.cutoff = analog.cutoff;
    d.res = analog.res;
    d.attack = analog.attack;
    d.decay = analog.decay;
    ensureAudio();
    applyDevices(track);
    state.selectedTrackId = track.id;
    paintDevices();
    previewLib({ kind: "instrument", analog: analog });
  }

  function placeSampleClip(track, scene, buf, name) {
    if (scene == null) scene = 0;
    pushUndo();
    var c = clip(name, track.color, { buffer: buf });
    track.clips[scene] = c;
    state.selectedSession = { track: track, clip: c };
    rebuildTrackUi();
    paint();
  }

  function handleLibDrop(ev, track, scene, pad) {
    if (!track) return;
    var files = ev.dataTransfer && ev.dataTransfer.files;
    if (files && files[0]) {
      var f = files[0];
      ensureAudio();
      f.arrayBuffer().then(function (ab) { return ctx.decodeAudioData(ab.slice(0)); }).then(function (buf) {
        var item = { id: "user-" + Date.now(), cat: "User", name: (f.name || "User").replace(/\.[^.]+$/, ""), kind: "sample", buffer: buf };
        ensureLib();
        libItems.push(item);
        paintBrowser();
        finishSampleDrop(track, scene, pad, buf, item.name);
      }).catch(function () {});
      return;
    }
    var raw = "";
    try { raw = ev.dataTransfer.getData("application/x-voice-lib") || ev.dataTransfer.getData("text/plain"); } catch (e) {}
    var spec = null;
    try { spec = raw ? JSON.parse(raw) : null; } catch (e2) {}
    if (!spec || spec.lib !== "voice") return;
    var item = libById(spec.id);
    if (!item) return;
    if (item.kind === "instrument") {
      applyInstrument(track, item.analog);
      return;
    }
    var buf = sampleBuffer(item);
    if (!buf) return;
    finishSampleDrop(track, scene, pad, buf, item.name);
  }

  function finishSampleDrop(track, scene, pad, buf, name) {
    ensureAudio();
    ctx.resume();
    if ((track.kind === "drums" || track.kind === "perc") && track.rack) {
      ensureRack(track);
      var p = pad || track.rack.pads.find(function (x) { return x.id === state.selectedPad; }) || track.rack.pads[0];
      p.buffer = buf;
      p.name = String(name || p.name).slice(0, 10);
      state.selectedPad = p.id;
      state.selectedSession = { track: track, clip: track.clips.find(function (c) { return !!c; }) || track.clips[0] };
      paintRack();
      trigRackPad(track, p, ctx.currentTime, 1);
      return;
    }
    placeSampleClip(track, scene == null ? 0 : scene, buf, name);
    if (state.view === "arrange") dropOnLane(track, Math.floor(state.step / STEPS_PER_BAR) || 0);
    if (!state.playing && track.kind === "audio") {
      state.queued[track.id] = track.clips[scene == null ? 0 : scene];
      startTransport();
    }
  }

  function enableDrop(node, getTarget) {
    node.addEventListener("dragover", function (ev) {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = "copy";
      node.classList.add("drop-ok");
    });
    node.addEventListener("dragleave", function () { node.classList.remove("drop-ok"); });
    node.addEventListener("drop", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      node.classList.remove("drop-ok");
      var tgt = getTarget(ev) || {};
      handleLibDrop(ev, tgt.track, tgt.scene, tgt.pad);
    });
  }

  function paintBrowser() {
    if (!browserEl) return;
    ensureLib();
    browserEl.replaceChildren();
    browserEl.appendChild(el("div", "daw-brand", "Browser"));
    var cats = [];
    libItems.forEach(function (it) {
      if (cats.indexOf(it.cat) < 0) cats.push(it.cat);
    });
    cats.forEach(function (cat) {
      browserEl.appendChild(el("div", "daw-cat", cat));
      libItems.filter(function (it) { return it.cat === cat; }).forEach(function (item) {
        var b = el("button", "daw-lib", item.name);
        b.type = "button";
        b.draggable = true;
        b.setAttribute("aria-label", item.name);
        b.addEventListener("click", function () { previewLib(item); });
        b.addEventListener("dragstart", function (ev) {
          var payload = JSON.stringify({ lib: "voice", id: item.id });
          ev.dataTransfer.setData("application/x-voice-lib", payload);
          ev.dataTransfer.setData("text/plain", payload);
          ev.dataTransfer.effectAllowed = "copy";
        });
        browserEl.appendChild(b);
      });
    });
    var imp = el("button", "daw-btn", "Import audio");
    imp.type = "button";
    imp.style.marginTop = "8px";
    imp.setAttribute("aria-label", "Import audio into browser");
    imp.addEventListener("click", function () {
      var inp = document.createElement("input");
      inp.type = "file";
      inp.accept = "audio/*,.wav,.mp3,.ogg,.m4a";
      inp.addEventListener("change", function () {
        var f = inp.files && inp.files[0];
        if (!f) return;
        ensureAudio();
        f.arrayBuffer().then(function (ab) { return ctx.decodeAudioData(ab.slice(0)); }).then(function (buf) {
          libItems.push({ id: "user-" + Date.now(), cat: "User", name: (f.name || "User").replace(/\.[^.]+$/, ""), kind: "sample", buffer: buf });
          paintBrowser();
          previewLib(libItems[libItems.length - 1]);
        }).catch(function () {});
      });
      inp.click();
    });
    browserEl.appendChild(imp);
    browserEl.appendChild(el("div", "daw-roll-hint", "Drag onto a clip slot, mixer strip, lane, or drum pad. Click to preview."));
  }


  var warpHold = {};
  var warpEl = null;
  var warpCanvas = null;
  var warpTitle = null;
  var markerSeq = 1;

  function clipBeats(clipObj) {
    return Math.max(0.25, (clipObj.length || STEPS) / 4);
  }

  function ensureMarkers(clipObj) {
    if (!clipObj.notes) clipObj.notes = {};
    var n = clipObj.notes;
    if (n.gain == null) n.gain = 1;
    if (!n.warpMode) n.warpMode = "beats";
    if (n.warpOn == null) n.warpOn = true;
    var dur = n.buffer ? n.buffer.duration : 1;
    var beats = clipBeats(clipObj);
    if (!n.markers || n.markers.length < 2) {
      n.markers = [
        { id: "w0", beat: 0, time: 0 },
        { id: "w1", beat: beats, time: dur },
      ];
    } else {
      n.markers[n.markers.length - 1].beat = beats;
    }
    n.markers.sort(function (a, b) { return a.beat - b.beat; });
    return n.markers;
  }

  function stopWarpVoices(id) {
    var list = warpHold[id] || [];
    list.forEach(function (s) {
      try { s.stop(); } catch (e) {}
      try { s.disconnect(); } catch (e2) {}
    });
    warpHold[id] = [];
  }

  function holdVoice(id, node) {
    if (!warpHold[id]) warpHold[id] = [];
    warpHold[id].push(node);
  }

  function playWarpSeg(dest, buf, srcStart, srcDur, destDur, when, gain, mode, trackId, rateMul) {
    if (!ctx || !buf || destDur <= 0.01) return;
    srcStart = Math.max(0, srcStart);
    srcDur = Math.max(0.01, srcDur);
    gain = Math.max(0.02, Math.min(1.5, gain == null ? 1 : gain));
    mode = mode || "beats";
    rateMul = rateMul || 1;
    if (mode === "re-pitch") {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = (srcDur / destDur) * rateMul;
      var g = ctx.createGain();
      g.gain.setValueAtTime(gain, when);
      src.connect(g);
      g.connect(dest);
      src.start(when, srcStart, srcDur);
      try { src.stop(when + destDur + 0.02); } catch (e) {}
      holdVoice(trackId, src);
      holdVoice(trackId, g);
      return;
    }
    if (mode === "beats") {
      var src2 = ctx.createBufferSource();
      src2.buffer = buf;
      src2.playbackRate.value = rateMul;
      var g2 = ctx.createGain();
      g2.gain.setValueAtTime(gain, when);
      g2.gain.setValueAtTime(gain, when + Math.min(srcDur, destDur) * 0.85);
      g2.gain.exponentialRampToValueAtTime(0.0001, when + destDur);
      src2.connect(g2);
      g2.connect(dest);
      src2.start(when, srcStart, Math.min(srcDur, destDur));
      try { src2.stop(when + destDur + 0.02); } catch (e3) {}
      holdVoice(trackId, src2);
      holdVoice(trackId, g2);
      return;
    }
    var grain = mode === "texture" ? 0.18 : 0.08;
    var hop = grain * (mode === "texture" ? 0.35 : 0.45);
    for (var t = 0; t < destDur; t += hop) {
      var srcPos = srcStart + (t / destDur) * srcDur;
      if (srcPos >= buf.duration) break;
      var gs = ctx.createBufferSource();
      gs.buffer = buf;
      gs.playbackRate.value = rateMul;
      var gg = ctx.createGain();
      var gt = when + t;
      var gd = Math.min(grain, destDur - t);
      gg.gain.setValueAtTime(0.0001, gt);
      gg.gain.linearRampToValueAtTime(gain * 0.9, gt + gd * 0.25);
      gg.gain.linearRampToValueAtTime(0.0001, gt + gd);
      gs.connect(gg);
      gg.connect(dest);
      gs.start(gt, Math.max(0, srcPos), gd);
      holdVoice(trackId, gs);
      holdVoice(trackId, gg);
    }
  }

  function playWarpedClip(track, clipObj, time, destOverride, holdOverride) {
    if (!clipObj || !clipObj.notes || !clipObj.notes.buffer) return;
    var dest = destOverride || trackNodes[track.id];
    if (!dest) return;
    var holdId = holdOverride || clipObj.id || track.id;
    stopWarpVoices(holdId);
    var n = clipObj.notes;
    var gain = n.gain == null ? 1 : n.gain;
    var buf = n.reverse ? reversedBuffer(n.buffer) : n.buffer;
    var rate = Math.pow(2, clipXpose(n) / 12);
    var skipSec = Math.max(0, ((n.offset || 0) + (n.loopStart || 0)) * secondsPerStep());
    var loopSteps = (n.loop !== false && n.loopLen) ? n.loopLen : (clipObj.length || STEPS);
    var destDurAll = Math.max(0.25, loopSteps / 4) * (60 / state.bpm);
    var fiSec = Math.max(0, (n.fadeIn || 0) * secondsPerStep());
    var foSec = Math.max(0, (n.fadeOut || 0) * secondsPerStep());
    if (fiSec > 0.001 || foSec > 0.001) {
      var wrap = ctx.createGain();
      wrap.connect(dest);
      wrap.gain.setValueAtTime(fiSec > 0.001 ? 0.0001 : 1, time);
      if (fiSec > 0.001) wrap.gain.linearRampToValueAtTime(1, time + Math.min(fiSec, destDurAll * 0.49));
      if (foSec > 0.001) {
        var tOut = time + Math.max(0, destDurAll - foSec);
        wrap.gain.setValueAtTime(1, tOut);
        wrap.gain.linearRampToValueAtTime(0.0001, time + destDurAll);
      }
      dest = wrap;
      holdVoice(holdId, wrap);
    }
    if (!n.warpOn) {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      var g = ctx.createGain();
      g.gain.setValueAtTime(gain, time);
      src.connect(g);
      g.connect(dest);
      src.start(time, Math.min(Math.max(0, buf.duration - 0.02), skipSec));
      holdVoice(holdId, src);
      holdVoice(holdId, g);
      return;
    }
    var markers = ensureMarkers(clipObj);
    var beatSec = 60 / state.bpm;
    var offBeats = (n.offset || 0) / 4;
    for (var i = 0; i < markers.length - 1; i++) {
      var a = markers[i], b = markers[i + 1];
      var destDur = Math.max(0.02, (b.beat - a.beat) * beatSec);
      var srcDur = Math.max(0.01, b.time - a.time);
      var when = time + (a.beat - offBeats) * beatSec;
      if (when + destDur <= time) continue;
      playWarpSeg(dest, buf, a.time, srcDur, destDur, Math.max(time, when), gain, n.warpMode, holdId, rate);
    }
  }

  function activeWarpClip() {
    var sel = state.selectedSession;
    if (sel && sel.clip && sel.clip.notes && sel.clip.notes.buffer) return sel;
    for (var i = 0; i < state.tracks.length; i++) {
      var tr = state.tracks[i];
      for (var s = 0; s < tr.clips.length; s++) {
        if (tr.clips[s] && tr.clips[s].notes && tr.clips[s].notes.buffer) {
          return { track: tr, clip: tr.clips[s] };
        }
      }
    }
    return null;
  }

  function openWarp(track, clipObj) {
    if (!clipObj || !clipObj.notes || !clipObj.notes.buffer) return;
    state.selectedSession = { track: track, clip: clipObj };
    ensureMarkers(clipObj);
    setView("warp");
  }

  function paintWarp() {
    if (!warpEl || !warpCanvas) return;
    var pair = activeWarpClip();
    if (warpTitle) warpTitle.textContent = pair ? pair.track.name + " · " + pair.clip.name : "Warp";
    var ctx2 = warpCanvas.getContext("2d");
    var w = warpCanvas.width, h = warpCanvas.height;
    ctx2.fillStyle = "#0a0d0c";
    ctx2.fillRect(0, 0, w, h);
    if (!pair) return;
    var n = pair.clip.notes;
    var buf = n.buffer;
    var markers = ensureMarkers(pair.clip);
    var data = buf.getChannelData(0);
    var beats = clipBeats(pair.clip);
    ctx2.strokeStyle = "#3fc6ff";
    ctx2.beginPath();
    var step = Math.max(1, Math.floor(data.length / w));
    for (var x = 0; x < w; x++) {
      var idx = Math.min(data.length - 1, x * step);
      var amp = Math.abs(data[idx]);
      var y = h / 2 - amp * (h * 0.42);
      if (x === 0) ctx2.moveTo(x, y);
      else ctx2.lineTo(x, y);
    }
    ctx2.stroke();
    markers.forEach(function (m, i) {
      var mx = (m.beat / beats) * w;
      ctx2.fillStyle = i === 0 || i === markers.length - 1 ? "#ffb238" : "#7dffb3";
      ctx2.fillRect(mx - 1, 0, 2, h);
      ctx2.beginPath();
      ctx2.moveTo(mx, 0);
      ctx2.lineTo(mx + 6, 10);
      ctx2.lineTo(mx - 6, 10);
      ctx2.closePath();
      ctx2.fill();
    });
    var tools = warpEl.querySelector("[data-warp-tools]");
    if (tools) {
      var g = tools.querySelector("[data-cgain]");
      var mode = tools.querySelector("[data-wmode]");
      var on = tools.querySelector("[data-warpon]");
      if (g) g.value = String(n.gain == null ? 1 : n.gain);
      if (mode) mode.value = n.warpMode || "beats";
      if (on) on.classList.toggle("on", !!n.warpOn);
      var fin = tools.querySelector("[data-fadeIn]");
      var fout = tools.querySelector("[data-fadeOut]");
      if (fin) fin.value = String(n.fadeIn || 0);
      if (fout) fout.value = String(n.fadeOut || 0);
    }
    syncXformUi(warpEl, pair.clip);
  }

  function timeAtBeat(markers, beat) {
    for (var i = 0; i < markers.length - 1; i++) {
      var a = markers[i], b = markers[i + 1];
      if (beat >= a.beat && beat <= b.beat) {
        var t = (beat - a.beat) / (b.beat - a.beat || 1);
        return a.time + t * (b.time - a.time);
      }
    }
    return markers[markers.length - 1].time;
  }


  function swingTime(step, time) {
    var amt = state.swing || 0;
    if (amt <= 0) return time;
    if (step % 2 === 1) return time + secondsPerStep() * amt;
    return time;
  }

  function playStepAt(track, clipObj, step, time, xfade, destOverride) {
    if (!clipObj) return;
    if (!destOverride && !trackAudible(track)) return;
    var dest = destOverride || trackNodes[track.id];
    var n = clipObj.notes || {};
    var len = clipObj.length || STEPS;
    var loopOn = n.loop !== false;
    var loopLen = Math.max(1, n.loopLen || len);
    var loopStart = Math.max(0, n.loopStart || 0);
    var posInClip = ((step % len) + len) % len;
    if (!loopOn && posInClip >= loopLen) {
      if (n.buffer && clipObj.id) xfDest(track, clipObj, time, 0.0001);
      return;
    }
    var phase = ((step % loopLen) + loopLen) % loopLen;
    var local = loopOn ? loopStart + phase : posInClip;
    var i = local;
    if (n.reverse) i = loopStart + loopLen - 1 - phase;
    var xp = clipXpose(n);
    var gmul = n.gain == null ? 1 : n.gain;
    var fadeMul = clipFadeMul(clipObj, posInClip) * clipEnvMul(clipObj, posInClip) * (xfade == null ? 1 : xfade) * (n.buffer ? 1 : gmul);
    if (fadeMul < 0.02 && !n.buffer) return;
    if (!destOverride && n.buffer && clipObj.id) dest = xfDest(track, clipObj, time, Math.max(0.0001, fadeMul));
    else dest = fadedDest(dest, time, fadeMul);
    if (n.buffer) {
      if ((n.reverse ? loopLen - 1 - phase : phase) === 0) playWarpedClip(track, clipObj, time, dest, destOverride ? "cue" : null);
      return;
    }
    if ((track.kind === "drums" || track.kind === "perc") && track.rack && !(n.buffer)) {
      playDrumRack(track, clipObj, i, time, fadeMul, destOverride);
      return;
    }

    if (n.roll && n.roll.length) {
      playRollStep(track, dest, n.roll, i, time, xp);
      return;
    }
    function gi(arr) {
      if (!arr || !arr.length) return 0;
      return ((i % arr.length) + arr.length) % arr.length;
    }
    if (track.kind === "drums") {
      if (n.k && n.k[gi(n.k)]) trigKick(dest, time);
      if (n.s && n.s[gi(n.s)]) trigSnare(dest, time);
      if (n.h && n.h[gi(n.h)]) trigHat(dest, time, i % 8 === 7);
    } else if (track.kind === "bass") {
      if (n.seq && typeof n.seq[gi(n.seq)] === "number" && n.seq[gi(n.seq)] >= 0) fireMidi(track, dest, time, [n.seq[gi(n.seq)] + xp], i, false);
    } else if (track.kind === "keys") {
      if (n.hits && n.hits[gi(n.hits)]) fireMidi(track, dest, time, (n.chord || [0, 3, 7]).map(function (s) { return s + xp; }), i, true);
    } else if (track.kind === "lead") {
      if (n.seq && typeof n.seq[gi(n.seq)] === "number" && n.seq[gi(n.seq)] >= 0) fireMidi(track, dest, time, [n.seq[gi(n.seq)] + xp], i, false);
    } else if (track.kind === "perc") {
      if (n.seq && n.seq[gi(n.seq)]) trigPerc(dest, time, i % 4 === 2);
    } else if (track.kind === "midi" || track.kind === "keys") {
      if (n.hits && n.hits[i]) fireMidi(track, dest, time, (n.chord || [0, 3, 7]).map(function (s) { return s + xp; }), i, true);
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) fireMidi(track, dest, time, [n.seq[i] + xp], i, false);
    }
  }

  function quantizeSteps() {
    if (state.quantize <= 0) return 1;
    return state.quantize;
  }

  function applyQueue() {
    Object.keys(state.queued).forEach(function (id) {
      var next = state.queued[id];
      var tr = state.tracks.find(function (t) {
        return t.id === id;
      });
      if (!tr) return;
      if (next === "stop") {
        delete state.launched[id];
        stopPad(id);
        stopAudioLoop(id);
        stopWarpVoices(id);
      } else {
        state.launched[id] = next;
        if (tr.kind === "pad" && !(next.notes && next.notes.roll && next.notes.roll.length)) startPad(tr, next);
        else stopPad(id);
        stopAudioLoop(id);
        stopWarpVoices(id);
      }
      delete state.queued[id];
    });
    paint();
  }

  function clipAt(trackId, step) {
    for (var i = 0; i < state.arrangeClips.length; i++) {
      var c = state.arrangeClips[i];
      if (c.trackId === trackId && step >= c.start && step < c.start + c.length) return c;
    }
    return null;
  }

  function capturePunch() {
    if (!state.punch) return;
    if (state.step % STEPS_PER_BAR !== 0) return;
    var barStart = state.step;
    state.tracks.forEach(function (tr) {
      var launched = state.launched[tr.id];
      if (!launched || launched === "stop") return;
      var armedAny = state.tracks.some(function (x) { return x.arm; });
      if (armedAny && !tr.arm) return;
      state.arrangeClips = state.arrangeClips.filter(function (c) {
        return !(c.trackId === tr.id && c.start === barStart && c.length === STEPS_PER_BAR);
      });
      state.arrangeClips.push({
        id: tr.id + "-punch-" + barStart + "-" + Date.now(),
        trackId: tr.id,
        start: barStart,
        length: STEPS_PER_BAR,
        name: launched.name,
        color: launched.color,
        notes: cloneNotes(launched.notes),
      });
    });
    paintArrange();
  }

  function scheduler() {
    if (!state.playing || !ctx) return;
    var horizon = ctx.currentTime + 0.12;
    var stepDur = secondsPerStep();
    var arrange = state.view === "arrange";
    while (nextTime < horizon) {
      if (state.countIn > 0) {
        var spbCi = stepsPerBeat();
        if (state.metro && state.countIn % spbCi === 0) {
          var beatCi = Math.floor((stepsPerBar() - state.countIn) / spbCi) % state.timeNum;
          clickMetro(nextTime, beatCi === 0);
        }
        state.countIn -= 1;
        nextTime += stepDur;
        paintPlayhead();
        continue;
      }
      if (state.metro) {
        var spb = stepsPerBeat();
        if (state.step % spb === 0) {
          var beatN = Math.floor(state.step / spb) % state.timeNum;
          clickMetro(nextTime, beatN === 0);
        }
      }
      if (state.recording) state.punch = true;
      if (arrange) {
        var loopStartStep = state.loopStart * STEPS_PER_BAR;
        var loopEndStep = Math.max(loopStartStep + STEPS_PER_BAR, state.loopEnd * STEPS_PER_BAR);
        if (state.loopOn && state.step >= loopEndStep) {
          state.step = loopStartStep;
          Object.keys(padHold).forEach(stopPad);
    Object.keys(audioHold).forEach(stopAudioLoop);
    Object.keys(warpHold).forEach(stopWarpVoices);
        }
        if (state.step >= BARS * STEPS_PER_BAR) {
          if (state.loopOn) state.step = loopStartStep;
          else {
            stopTransport();
            return;
          }
        }
        capturePunch();
        state.tracks.forEach(function (tr) {
          var hits = clipsAt(tr.id, state.step);
          if (tr.kind === "pad") {
            var c0 = hits[0] || null;
            if (c0 && lastPadClip[tr.id] !== c0) startPad(tr, c0);
            if (!c0) stopPad(tr.id);
          } else {
            hits.forEach(function (c) {
              var xf = xfadeMul(c, state.step, hits);
              playStepAt(tr, c, state.step - c.start, swingTime(state.step, nextTime), xf);
            });
            state.arrangeClips.forEach(function (c) {
              if (c.trackId !== tr.id) return;
              var on = state.step >= c.start && state.step < c.start + c.length;
              if (on) return;
              if (clipXfGain[c.id]) clipXfGain[c.id].gain.setValueAtTime(0.0001, nextTime);
              if (c.id) stopWarpVoices(c.id);
            });
          }
          applyAutoAt(tr, state.step, nextTime);
        });
      } else {
        if (state.step % quantizeSteps() === 0) applyQueue();
        state.tracks.forEach(function (tr) {
          var c = state.launched[tr.id];
          if (c) playStepAt(tr, c, state.step, swingTime(state.step, nextTime));
          if (c && tr.kind === "pad" && padHold[tr.id] && padHold[tr.id].g) {
            var pm = 0.08 * clipEnvMul(c, state.step % (c.length || STEPS));
            padHold[tr.id].g.gain.setValueAtTime(Math.max(0.0001, pm), nextTime);
          }
          applyAutoAt(tr, state.step, nextTime);
        });
      }
      nextTime += stepDur;
      state.step += 1;
      if (state.step % 2 === 0) {
        paintPlayhead();
        if (arrange) updatePlayheadPx();
      }
    }
    timer = window.setTimeout(scheduler, 25);
  }

  function startTransport() {
    ensureAudio();
    ctx.resume();
    if (state.playing) return;
    state.playing = true;
    if (state.view === "arrange") {
      state.step = state.loopOn ? state.loopStart * STEPS_PER_BAR : 0;
      Object.keys(padHold).forEach(stopPad);
    Object.keys(audioHold).forEach(stopAudioLoop);
    Object.keys(warpHold).forEach(stopWarpVoices);
    } else {
      state.step = 0;
    }
    nextTime = ctx.currentTime + 0.04;
    if (state.view !== "arrange") applyQueue();
    scheduler();
    paint();
  }

  function stopTransport() {
    state.playing = false;
    state.countIn = 0;
    window.clearTimeout(timer);
    if (state.view !== "arrange") {
      state.launched = {};
      state.queued = {};
    }
    Object.keys(padHold).forEach(stopPad);
    Object.keys(audioHold).forEach(stopAudioLoop);
    Object.keys(warpHold).forEach(stopWarpVoices);
    state.step = 0;
    paint();
    updatePlayheadPx();
  }

  function stopCue() {
    state.cueing = false;
    window.clearTimeout(cueTimer);
    cueTimer = 0;
    try { stopPad("cue-pad"); } catch (e) {}
    try { stopWarpVoices("cue"); } catch (e2) {}
    cueTrack = null;
    cueClip = null;
    var prevBtn = root && root.querySelector("[data-cue]");
    if (prevBtn) prevBtn.classList.remove("on");
    paint();
  }

  function startPadCue(tr, clipObj) {
    stopPad("cue-pad");
    if (!ctx || !clipObj || !cueGain) return;
    var analog = analogOf(tr);
    var g = ctx.createGain();
    g.gain.value = 0.08;
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = analog ? analog.cutoff : 4200;
    f.Q.value = analog ? analog.res : 0.7;
    f.connect(cueGain);
    g.connect(f);
    var wave = analog ? analog.wave : "sine";
    var oscs = (clipObj.notes.chord || [0, 7, 12]).map(function (s, i) {
      var o = ctx.createOscillator();
      o.type = wave;
      o.frequency.value = midiHz(s + 12) * (i === 1 ? 1.003 : 1);
      o.connect(g);
      o.start();
      return o;
    });
    padHold["cue-pad"] = { g: g, oscs: oscs };
  }

  function cueScheduler() {
    if (!state.cueing || !ctx || !cueClip) return;
    var horizon = ctx.currentTime + 0.12;
    var stepDur = secondsPerStep();
    var len = cueClip.length || STEPS;
    while (cueNext < horizon) {
      if (cueTrack && cueTrack.kind !== "pad") {
        playStepAt(cueTrack, cueClip, cueStep, swingTime(cueStep, cueNext), 1, cueGain);
      }
      cueNext += stepDur;
      cueStep += 1;
      if (cueStep >= len) {
        stopCue();
        setMidiLabel("Cue end");
        return;
      }
    }
    cueTimer = window.setTimeout(cueScheduler, 25);
  }

  function previewClip(track, clipObj) {
    if (!track || !clipObj) {
      if (state.selectedSession) {
        track = state.selectedSession.track;
        clipObj = state.selectedSession.clip;
      }
    }
    if (!clipObj || !track) {
      setMidiLabel("Select a clip");
      return;
    }
    ensureAudio();
    ctx.resume();
    if (state.cueing && cueClip === clipObj) {
      stopCue();
      setMidiLabel("Cue off");
      return;
    }
    stopCue();
    state.cueing = true;
    cueTrack = track;
    cueClip = clipObj;
    state.selectedSession = { track: track, clip: clipObj };
    cueStep = 0;
    cueNext = ctx.currentTime + 0.03;
    if (track.kind === "pad" && !(clipObj.notes && clipObj.notes.roll && clipObj.notes.roll.length)) {
      startPadCue(track, clipObj);
    }
    var prevBtn = root && root.querySelector("[data-cue]");
    if (prevBtn) prevBtn.classList.add("on");
    cueScheduler();
    paint();
    setMidiLabel("Cue " + (clipObj.name || "clip"));
  }

  function queueClip(track, sceneIndex) {
    var clipObj = track.clips[sceneIndex];
    state.selectedSession = clipObj ? { track: track, clip: clipObj } : null;
    var current = state.launched[track.id];
    if (!clipObj) {
      if (current) state.queued[track.id] = "stop";
      return;
    }
    if (current === clipObj && !state.queued[track.id]) {
      state.queued[track.id] = "stop";
    } else {
      state.queued[track.id] = clipObj;
    }
    if (!state.playing) startTransport();
    else paint();
  }

  function launchScene(sceneIndex) {
    ensureAudio();
    ctx.resume();
    state.tracks.forEach(function (tr) {
      var c = tr.clips[sceneIndex];
      state.queued[tr.id] = c || "stop";
    });
    if (!state.playing) startTransport();
    else paint();
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var root = null;
  var gridEl = null;
  var posEl = null;
  var sessionPanel = null;
  var arrangePanel = null;
  var arrangeScroll = null;
  var arrangeLanes = null;
  var playheadEl = null;
  var loopEl = null;
  var rulerEl = null;
  var envEl = null;
  var envCanvas = null;
  var envTitle = null;

  function injectStyles() {
    if (document.getElementById("daw-session-css")) return;
    var s = document.createElement("style");
    s.id = "daw-session-css";
    s.textContent =
      "#daw-session{margin:0;border:0;border-radius:0;background:#0a0d0c;overflow:hidden;display:grid;grid-template-columns:minmax(168px,200px) 1fr;grid-template-rows:auto 1fr auto auto;min-height:100vh;width:100%}" +"#daw-session .daw-top{grid-column:1/-1}" +"#daw-session .daw-browser{grid-column:1;grid-row:2/span 10;border-right:1px solid var(--border,#263029);overflow:auto;max-height:min(72vh,780px);background:#0a0d0c;padding:8px}" +"#daw-session .daw-session-panel,#daw-session .daw-roll,#daw-session .daw-rack,#daw-session .daw-arrange,#daw-session .daw-mixer,#daw-session .daw-devices{grid-column:2}" +"#daw-session .daw-cat{font-family:Share Tech Mono,ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint,#4c5f56);padding:10px 6px 4px}" +"#daw-session .daw-lib{display:block;width:100%;text-align:left;margin:0 0 4px;padding:8px;border-radius:8px;border:1px solid var(--border,#263029);background:var(--surface-alt,#1a201c);color:var(--phosphor,#3fc6ff);font-family:Share Tech Mono,ui-monospace,monospace;font-size:11px;cursor:grab}" +"#daw-session .daw-lib:active{cursor:grabbing}" +"#daw-session .drop-ok{outline:2px dashed var(--phosphor,#3fc6ff);outline-offset:-2px}" +
      "#daw-session .daw-top{display:flex;flex-wrap:wrap;gap:10px;align-items:center;padding:10px 12px;border-bottom:1px solid var(--border,#263029)}" +
      "#daw-session .daw-brand{font-size:15px;letter-spacing:.08em;text-transform:uppercase;color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-pos{font-family:'Share Tech Mono',ui-monospace,monospace;font-size:12px;color:var(--ink-dim,#7d9689);min-width:7ch}" +
      "#daw-session .daw-btn{min-height:44px;min-width:44px;padding:8px 12px;border:1px solid var(--border,#263029);border-radius:10px;background:var(--surface-alt,#1a201c);color:var(--ink,#d9f5e3);font:inherit;cursor:pointer}" +
      "#daw-session .daw-btn:hover{border-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-btn.on{background:var(--phosphor,#3fc6ff);color:var(--phosphor-ink,#06170f);border-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-xfade{width:140px;min-height:32px;accent-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-btn.stop{color:var(--alert,#ff4d4d)}" +
      "#daw-session .daw-btn.rec.on{background:var(--alert,#ff4d4d);color:#fff;border-color:var(--alert,#ff4d4d)}" +
      "#daw-session label.daw-ctl{display:flex;align-items:center;gap:8px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-dim,#7d9689)}" +
      "#daw-session select,#daw-session input[type=number]{min-height:44px;background:var(--ground,#0a0d0c);color:var(--ink,#d9f5e3);border:1px solid var(--border,#263029);border-radius:8px;padding:0 8px;font:inherit}" +
      "#daw-session .daw-grid-wrap{overflow:auto;padding:12px}" +
      "#daw-session .daw-grid{display:grid;gap:6px;min-width:720px}" +
      "#daw-session .daw-cell{min-height:52px;border:1px solid var(--border,#263029);border-radius:8px;background:var(--surface-alt,#1a201c);color:var(--ink,#d9f5e3);font:inherit;font-size:12px;text-align:left;padding:8px 10px;cursor:pointer;position:relative}" +
      "#daw-session .daw-cell:hover{border-color:color-mix(in srgb,var(--phosphor,#3fc6ff) 50%, var(--border,#263029))}" +
      "#daw-session .daw-cell.filled{box-shadow:inset 3px 0 0 var(--clip,var(--phosphor,#3fc6ff))}" +
      "#daw-session .daw-cell.queued::after{content:'';position:absolute;top:8px;right:8px;width:8px;height:8px;border-radius:99px;background:var(--amber,#ffb238);box-shadow:0 0 8px var(--amber,#ffb238)}" +
      "#daw-session .daw-cell.playing{outline:2px solid var(--clip,var(--phosphor,#3fc6ff));outline-offset:0;background:color-mix(in srgb,var(--clip,#3fc6ff) 18%, var(--surface-alt,#1a201c))}" +
      "#daw-session .daw-cell.previewing{outline:2px dashed #ffb238;outline-offset:0}" +
      "#daw-session .daw-btn[data-cue].on,#daw-session .daw-mini .daw-btn.on[data-act=pfl]{background:#ffb238;color:#06170f;border-color:#ffb238}" +
      "#daw-session .daw-track{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:0 8px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-dim,#7d9689)}" +
      "#daw-session .daw-scene{min-height:52px;border:1px solid var(--border,#263029);border-radius:8px;background:transparent;color:var(--phosphor,#3fc6ff);font:inherit;cursor:pointer}" +
      "#daw-session .daw-scene:hover{background:color-mix(in srgb,var(--phosphor,#3fc6ff) 12%, transparent)}" +
      "#daw-session .daw-head{font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-faint,#4c5f56);padding:4px 8px}" +
      "#daw-session .daw-empty{color:var(--ink-faint,#4c5f56)}" +
      "#daw-session .daw-hint{padding:0 12px 10px;font-size:12px;color:var(--ink-dim,#7d9689)}" +
      "#daw-session .daw-mixer{display:flex;gap:8px;overflow:auto;padding:12px;border-top:1px solid var(--border,#263029);align-items:stretch}" +
      "#daw-session .daw-strip{flex:0 0 88px;min-width:88px;display:flex;flex-direction:column;gap:6px;align-items:center;padding:8px 6px;border:1px solid var(--border,#263029);border-radius:10px;background:var(--surface-alt,#1a201c)}" +
      "#daw-session .daw-strip.master{border-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-strip.ret{border-style:dashed}" +
      "#daw-session .daw-strip-name{font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--ink-dim,#7d9689)}" +
      "#daw-session .daw-fader-row{display:flex;gap:6px;height:120px;align-items:flex-end}" +
      "#daw-session .daw-meter{width:10px;height:120px;border-radius:4px;background:#0a0d0c;overflow:hidden;display:flex;align-items:flex-end}" +
      "#daw-session .daw-meter > i{display:block;width:100%;height:100%;transform-origin:bottom center;transform:scaleY(0.02);background:linear-gradient(to top,#3fc6ff,var(--amber,#ffb238) 70%,var(--alert,#ff4d4d));pointer-events:none}" +
      "#daw-session .daw-fader{writing-mode:vertical-lr;direction:rtl;height:120px;width:28px;accent-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-knob{width:100%;accent-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-mini{display:flex;gap:4px;flex-wrap:wrap;justify-content:center}" +
      "#daw-session .daw-mini .daw-btn{min-width:28px;min-height:32px;padding:4px 6px;font-size:11px}" +
      "#daw-session .daw-mini .daw-btn.on.arm{background:var(--alert,#ff4d4d);border-color:var(--alert,#ff4d4d);color:#fff}" +
      "#daw-session .daw-strip-tools{display:flex;gap:4px}#daw-session .daw-knob-lab{font-family:'Share Tech Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-faint,#4c5f56)}" +
      "#daw-session .daw-arrange{display:none;position:relative}" +
      "#daw-session.is-arrange .daw-session-panel{display:none}" +
      "#daw-session.is-arrange .daw-arrange{display:block}" +
      "#daw-session.is-roll .daw-session-panel,#daw-session.is-roll .daw-arrange{display:none}" +
      "#daw-session.is-rack .daw-session-panel,#daw-session.is-rack .daw-arrange,#daw-session.is-rack .daw-roll{display:none}" +
      "#daw-session .daw-rack{display:none;flex-direction:column;border-top:1px solid var(--border,#263029)}" +
      "#daw-session.is-rack .daw-rack{display:flex}" +"#daw-session.is-warp .daw-session-panel,#daw-session.is-warp .daw-arrange,#daw-session.is-warp .daw-roll,#daw-session.is-warp .daw-rack{display:none}" +"#daw-session .daw-warp{display:none;flex-direction:column;border-top:1px solid var(--border,#263029);grid-column:2}" +"#daw-session.is-warp .daw-warp{display:flex}" +"#daw-session .daw-warp-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px}" +"#daw-session .daw-wave{width:100%;height:140px;background:#0a0d0c;display:block;cursor:crosshair}" +"#daw-session.is-dev .daw-session-panel,#daw-session.is-dev .daw-arrange,#daw-session.is-dev .daw-roll,#daw-session.is-dev .daw-rack{display:none}#daw-session.is-dj .daw-session-panel,#daw-session.is-dj .daw-arrange,#daw-session.is-dj .daw-roll,#daw-session.is-dj .daw-rack,#daw-session.is-dj .daw-warp,#daw-session.is-dj .daw-env,#daw-session.is-dj .daw-prod-views{display:none!important}#daw-session .daw-dj{display:none;grid-column:2;flex-direction:column;border-top:1px solid #1c2a24;background:#0a0d0c}#daw-session.is-dj .daw-dj{display:flex}#daw-session .daw-dj-io{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 10px;border-bottom:1px solid #1c2a24}#daw-session .daw-dj-board{display:grid;grid-template-columns:1fr 120px 1fr;gap:10px;padding:10px}#daw-session .daw-dj-deck{border:1px solid #24332c;background:#101714;padding:8px;display:flex;flex-direction:column;gap:8px}#daw-session .daw-dj-tools{display:flex;flex-wrap:wrap;gap:4px}#daw-session .daw-dj-wave{width:100%;height:88px;background:#070908;display:block;cursor:crosshair}#daw-session .daw-dj-ov{width:100%;height:28px;background:#070908;display:block;cursor:pointer;border:1px solid #1c2a24}#daw-session .daw-dj-meta{display:flex;justify-content:space-between;align-items:center;gap:8px}#daw-session .daw-dj-hots{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}#daw-session .daw-hot{min-width:0;min-height:36px;padding:0;font-size:11px}#daw-session .daw-dj-eq{display:flex;gap:8px;align-items:flex-end;justify-content:space-around}#daw-session .daw-dj-eqcol{display:flex;flex-direction:column;align-items:center;gap:4px;flex:1}#daw-session .daw-dj-eqcol .daw-fader{height:90px;width:28px}#daw-session .daw-dj-phase{width:100%;height:36px;background:#070908;border:1px solid #1c2a24}#daw-session .daw-dj-jog{width:88px;height:88px;border-radius:50%;margin:4px auto;border:3px solid #3fc6ff;background:radial-gradient(circle at 40% 40%,#1a2420,#070908);color:#3fc6ff;font-family:Chakra Petch,sans-serif;font-size:22px;display:flex;align-items:center;justify-content:center;cursor:ew-resize;user-select:none}#daw-session .daw-dj-deck:last-child .daw-dj-jog{border-color:#ffb238;color:#ffb238}#daw-session .daw-dj-mid{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}#daw-session.is-dj .daw-mixer{grid-column:2}@media (max-width:900px){#daw-session .daw-dj-board{grid-template-columns:1fr}}#daw-session .daw-devices{display:flex;gap:10px;overflow:auto;padding:10px 12px;border-top:1px solid var(--border,#263029);align-items:stretch}#daw-session .daw-dev{flex:0 0 168px;min-width:168px;border:1px solid var(--border,#263029);border-radius:10px;padding:8px;background:var(--surface-alt,#1a201c);display:flex;flex-direction:column;gap:6px}#daw-session .daw-dev.off{opacity:.45}#daw-session .daw-dev-h{display:flex;justify-content:space-between;align-items:center;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--phosphor,#3fc6ff)}#daw-session .daw-dev .daw-btn{min-height:28px;padding:2px 8px}#daw-session .daw-strip.sel{border-color:var(--phosphor,#3fc6ff);box-shadow:inset 0 0 0 1px var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-rack-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px}" +
      "#daw-session .daw-pads{display:grid;grid-template-columns:repeat(4,minmax(72px,1fr));gap:8px;padding:12px;max-width:640px}" +
      "#daw-session .daw-pad{min-height:72px;border-radius:10px;border:1px solid var(--border,#263029);background:var(--surface-alt,#1a201c);color:var(--phosphor,#3fc6ff);font-family:'Share Tech Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}" +
      "#daw-session .daw-pad.on{outline:2px solid var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-pad.hit{background:var(--phosphor,#3fc6ff);color:#06170f}" +
      "#daw-session .daw-pad.has-sample{box-shadow:inset 0 -3px 0 var(--amber,#ffb238)}" +
      "#daw-session .daw-steps{overflow:auto;padding:8px 12px 16px}" +
      "#daw-session .daw-step-row{display:grid;grid-template-columns:72px repeat(16,minmax(22px,1fr));gap:4px;align-items:center;margin-bottom:4px}" +
      "#daw-session .daw-step-lab{font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-dim,#7d9689)}" +
      "#daw-session .daw-step{min-height:28px;border-radius:4px;border:1px solid var(--border,#263029);background:#0a0d0c;cursor:pointer}" +
      "#daw-session .daw-step.on{background:var(--phosphor,#3fc6ff);border-color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-step.now{box-shadow:inset 0 0 0 2px var(--alert,#ff4d4d)}" +
      "#daw-session .daw-step.beat{background:#121a16}" +
      "#daw-session .daw-roll{display:none;flex-direction:column;border-top:1px solid var(--border,#263029)}" +
      "#daw-session.is-roll .daw-roll{display:flex}" +
      "#daw-session .daw-roll-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px}" +
      "#daw-session .daw-roll-body{display:flex;overflow:auto;max-height:min(440px,55vh);background:#0a0d0c}" +
      "#daw-session .daw-keys{width:52px;flex:0 0 52px;position:sticky;left:0;z-index:3;background:#0a0d0c}" +
      "#daw-session .daw-key{height:16px;box-sizing:border-box;border-bottom:1px solid #152018;padding:0 6px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:9px;line-height:16px;cursor:pointer;color:var(--ink-faint,#4c5f56)}" +
      "#daw-session .daw-key.black{background:#070908;color:#3a4a44}" +
      "#daw-session .daw-key.in-scale{color:var(--phosphor,#3fc6ff)}" +
      "#daw-session .daw-roll-grid{position:relative;flex:1;min-width:384px}" +
      "#daw-session .daw-note{position:absolute;border-radius:3px;font-size:9px;color:#06170f;padding:0 4px;overflow:hidden;cursor:grab;z-index:2;box-sizing:border-box;line-height:16px;user-select:none}" +
      "#daw-session .daw-note.sel{outline:2px solid #fff;outline-offset:0;z-index:4}" +
      "#daw-session .daw-note-h{position:absolute;right:0;top:0;bottom:0;width:8px;cursor:ew-resize}" +
      "#daw-session .daw-vel{position:relative;height:56px;margin-left:52px;border-top:1px solid var(--border,#263029);background:#0a0d0c}" +
      "#daw-session .daw-vel-n{position:absolute;bottom:0;width:8px;background:var(--phosphor,#3fc6ff);cursor:ns-resize;border-radius:2px 2px 0 0}" +
      "#daw-session .daw-roll-hint{padding:6px 12px;font-size:12px;color:var(--ink-dim,#7d9689)}" +
      "#daw-session .daw-arr-scroll{overflow:auto;max-height:min(520px,60vh)}" +
      "#daw-session .daw-arr-inner{position:relative;min-width:" + (88 + BARS * BAR_W) + "px}" +
      "#daw-session .daw-ruler{display:flex;margin-left:88px;height:44px;position:relative;border-bottom:1px solid var(--border,#263029);user-select:none}" +"#daw-session .daw-loc{position:absolute;top:0;transform:translateX(-50%);min-width:18px;height:16px;padding:0 4px;font-size:9px;line-height:16px;background:#3fc6ff;color:#06170f;border:0;border-radius:0 0 3px 3px;z-index:5;cursor:grab;font-family:Share Tech Mono,ui-monospace,monospace}" +"#daw-session .daw-loc.sel{outline:1px solid #fff;background:#7dffb3}" +
      "#daw-session .daw-bar{width:" + BAR_W + "px;flex:0 0 " + BAR_W + "px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;color:var(--ink-faint,#4c5f56);border-left:1px solid var(--border,#263029);padding:4px 6px}" +
      "#daw-session .daw-loop{position:absolute;top:0;bottom:0;background:color-mix(in srgb,var(--phosphor,#3fc6ff) 16%, transparent);border:1px solid var(--phosphor,#3fc6ff);pointer-events:none;z-index:2}" +
      "#daw-session .daw-loop-h{position:absolute;top:0;width:12px;height:44px;background:var(--phosphor,#3fc6ff);cursor:ew-resize;pointer-events:auto;z-index:3}" +
      "#daw-session .daw-lane-row{display:flex;align-items:stretch;height:" + LANE_H + "px;border-bottom:1px solid var(--border,#263029)}" +
      "#daw-session .daw-lane-lab{width:88px;flex:0 0 88px;display:flex;align-items:center;padding:0 10px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;position:sticky;left:0;z-index:4;background:var(--surface,#121613)}" +
      "#daw-session .daw-lane{position:relative;flex:1;min-width:" + (BARS * BAR_W) + "px;background-image:repeating-linear-gradient(90deg,transparent,transparent " + (BAR_W - 1) + "px,var(--border,#263029) " + (BAR_W - 1) + "px,var(--border,#263029) " + BAR_W + "px)}" +"#daw-session .daw-auto{height:32px;flex:1;min-width:" + (BARS * BAR_W) + "px;display:block;cursor:crosshair;background:#070908}" +"#daw-session .daw-auto-lab{width:88px;flex:0 0 88px;font-family:Share Tech Mono,ui-monospace,monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:#4c5f56;display:flex;align-items:center;padding:0 8px}" +
      "#daw-session .daw-clip{position:absolute;top:6px;height:36px;border-radius:6px;padding:6px 8px;font-size:11px;color:#06170f;overflow:hidden;white-space:nowrap;cursor:grab;z-index:1}" +
      "#daw-session .daw-clip.sel{outline:2px solid #fff;outline-offset:1px}" +"#daw-session .daw-fade-in,#daw-session .daw-fade-out{position:absolute;top:0;width:10px;height:100%;cursor:ew-resize;z-index:2;background:linear-gradient(to right,rgba(6,23,15,.55),transparent)}" +"#daw-session .daw-fade-out{right:0;left:auto;background:linear-gradient(to left,rgba(6,23,15,.55),transparent)}" +"#daw-session .daw-clip .daw-fade-in{left:0}" +"#daw-session .daw-resize-l,#daw-session .daw-resize-r{position:absolute;bottom:0;width:12px;height:12px;cursor:ew-resize;z-index:3;background:#06170f;opacity:.55}" +"#daw-session .daw-resize-l{left:0}" +"#daw-session .daw-resize-r{right:0}" +"#daw-session .daw-loop-tick{position:absolute;top:0;bottom:0;width:1px;background:rgba(6,23,15,.55);z-index:1}" +"#daw-session .daw-loop-brace{position:absolute;left:0;top:0;height:5px;background:#3fc6ff;opacity:.75;z-index:2;pointer-events:none}" +"#daw-session .daw-loop-grip{position:absolute;right:-5px;top:0;width:10px;height:14px;cursor:ew-resize;background:#3fc6ff;pointer-events:auto;z-index:4;border-radius:0 0 2px 0}" +"#daw-session .daw-loop-grip-l{position:absolute;left:-5px;top:0;width:10px;height:14px;cursor:ew-resize;background:#7dffb3;pointer-events:auto;z-index:4;border-radius:0 0 0 2px}" +
      "#daw-session .daw-playhead{position:absolute;top:0;bottom:0;width:2px;background:var(--alert,#ff4d4d);z-index:5;pointer-events:none;left:88px}" +
      "@media (prefers-reduced-motion: reduce){#daw-session .daw-playhead{transition:none}}" +
      "#music-view.is-daw > *:not(#daw-session){display:none!important}" +"#music-view.is-daw{display:flex;flex-direction:column;flex:1;min-height:100%;padding:0;margin:0}" +"body.is-music-daw .main-area{max-width:none;padding:0;overflow:hidden}" +"body.is-music-daw .main-area .footer{display:none}" +"body.is-music-daw .sidebar{background:#070908;border-right-color:#1a2420}" +"#daw-session .daw-top{background:#070908;gap:6px;padding:6px 8px;border-bottom:1px solid #1c2a24;flex-wrap:wrap}" +"#daw-session .daw-brand{font-family:Chakra Petch,sans-serif;font-weight:700;font-size:13px;letter-spacing:.18em}" +"#daw-session .daw-btn{min-height:32px;min-width:32px;padding:4px 9px;border-radius:2px;font-family:Share Tech Mono,ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:#121816;border-color:#24332c}" +"#daw-session .daw-btn[data-play],#daw-session .daw-btn.stop,#daw-session .daw-btn.rec{min-height:36px;min-width:52px}" +"#daw-session select,#daw-session input[type=number]{min-height:32px;border-radius:2px;background:#050706}" +"#daw-session .daw-cell{min-height:44px;border-radius:2px;background:#101714;padding:6px 8px}" +"#daw-session .daw-cell.filled{background:color-mix(in srgb,var(--clip,#3fc6ff) 62%, #0a0d0c);color:#06170f;border-color:var(--clip,#3fc6ff);box-shadow:none;font-weight:600}" +"#daw-session .daw-cell.playing{outline:1px solid #fff;background:color-mix(in srgb,var(--clip,#3fc6ff) 82%, #fff)}" +"#daw-session .daw-scene{min-height:44px;border-radius:2px}" +"#daw-session .daw-strip,#daw-session .daw-dev{border-radius:2px;background:#101714}" +"#daw-session .daw-browser{background:#070908;padding:8px 6px;max-height:none}" +"#daw-session .daw-lib{border-radius:2px;background:#121816}" +"#daw-session .daw-mixer{background:#0c100e;padding:8px}" +"#daw-session .daw-devices{background:#0c100e}" +"#daw-session .daw-grid-wrap{padding:8px;background:#0a0d0c}" +"#daw-session .daw-fader{accent-color:#3fc6ff}" +"#daw-session .daw-hint,#daw-session .daw-roll-hint{color:#6a8076;font-size:11px}" +"@media (max-width:780px){#daw-session{grid-template-columns:1fr;min-height:auto}#daw-session .daw-browser{grid-row:auto;max-height:180px;border-right:0;border-bottom:1px solid #1c2a24}}" +"#daw-session .daw-btn:focus-visible,#daw-session .daw-cell:focus-visible,#daw-session .daw-scene:focus-visible,#daw-session .daw-pad:focus-visible,#daw-session .daw-step:focus-visible,#daw-session .daw-lib:focus-visible,#daw-session .daw-key:focus-visible,#daw-session select:focus-visible,#daw-session input:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:2px;z-index:6}" +"#daw-session .daw-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}" +"#daw-session .daw-help{padding:6px 10px;font-size:11px;color:#6a8076;border-top:1px solid #1c2a24;grid-column:1/-1;font-family:Share Tech Mono,ui-monospace,monospace}" +
      "#daw-session .daw-env{grid-column:2;border-top:1px solid #1c2a24;padding:6px 10px;background:#0c100e}" +
      "#daw-session .daw-env canvas{width:100%;height:64px;display:block;background:#070908;cursor:crosshair;border:1px solid #1c2a24}";
    document.head.appendChild(s);
  }

  function paintPlayhead() {
    if (!posEl) return;
    if (state.countIn > 0) {
      posEl.textContent = "CNT " + Math.ceil(state.countIn / stepsPerBeat());
      return;
    }
    var spBar = stepsPerBar();
    var spBeat = stepsPerBeat();
    var bar = Math.floor(state.step / spBar) + 1;
    var beat = (Math.floor(state.step / spBeat) % state.timeNum) + 1;
    var six = (state.step % spBeat) + 1;
    posEl.textContent = bar + "." + beat + "." + six;
    posEl.setAttribute("aria-label", "Position " + bar + " " + beat + " " + six);
    if (liveEl && bar !== lastAnnouncedBar) {
      lastAnnouncedBar = bar;
      liveEl.textContent = (state.playing ? "Playing " : "Stopped ") + "bar " + bar;
    }
    var playBtn = root && root.querySelector("[data-play]");
    if (playBtn) playBtn.setAttribute("aria-pressed", state.playing ? "true" : "false");
    paintRackCursor();
  }

  function jumpToStep(step) {
    state.step = Math.max(0, Math.min(BARS * STEPS_PER_BAR - 1, step));
    if (ctx) nextTime = ctx.currentTime;
    try { Object.keys(warpHold || {}).forEach(stopWarpVoices); } catch (e) {}
    try { Object.keys(padHold || {}).forEach(stopPad); } catch (e2) {}
    try { Object.keys(audioHold || {}).forEach(stopAudioLoop); } catch (e3) {}
    paintPlayhead();
    updatePlayheadPx();
  }

  function addLocator(bar) {
    bar = Math.max(0, Math.min(BARS - 1, bar == null ? Math.floor(state.step / STEPS_PER_BAR) : bar));
    pushUndo();
    var loc = { id: "loc-" + Date.now(), bar: bar, name: String(state.locators.length + 1) };
    state.locators.push(loc);
    state.locators.sort(function (a, b) { return a.bar - b.bar; });
    state.selectedLocator = loc.id;
    paintLocators();
    setMidiLabel("Loc " + loc.name);
  }

  function paintLocators() {
    if (!rulerEl) return;
    rulerEl.querySelectorAll(".daw-loc").forEach(function (n) { n.remove(); });
    state.locators.forEach(function (loc) {
      var n = el("button", "daw-loc" + (state.selectedLocator === loc.id ? " sel" : ""), loc.name);
      n.type = "button";
      n.style.left = (loc.bar * BAR_W) + "px";
      n.title = "Locator " + loc.name + " — drag to move, click to jump, double-click to rename";
      n.setAttribute("aria-label", "Locator " + loc.name + " bar " + (loc.bar + 1));
      n.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        state.selectedLocator = loc.id;
        state.selectedArrange = null;
        var startX = ev.clientX;
        var orig = loc.bar;
        var dragged = false;
        n.style.cursor = "grabbing";
        function move(e) {
          var dx = e.clientX - startX;
          if (!dragged && Math.abs(dx) < 5) return;
          if (!dragged) { pushUndo(); dragged = true; }
          loc.bar = Math.max(0, Math.min(BARS - 1, orig + Math.round(dx / BAR_W)));
          n.style.left = (loc.bar * BAR_W) + "px";
        }
        function up() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
          n.style.cursor = "grab";
          if (!dragged) jumpToStep(loc.bar * STEPS_PER_BAR);
          else {
            state.locators.sort(function (a, b) { return a.bar - b.bar; });
            setMidiLabel(loc.name + " → bar " + (loc.bar + 1));
          }
          paintLocators();
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
      n.addEventListener("dblclick", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var next = window.prompt("Locator name", loc.name);
        if (next == null) return;
        next = String(next).trim();
        if (!next) return;
        pushUndo();
        loc.name = next;
        paintLocators();
      });
      rulerEl.appendChild(n);
    });
  }

  function selectedLocatorObj() {
    var id = state.selectedLocator;
    if (!id) return null;
    for (var i = 0; i < state.locators.length; i++) {
      if (state.locators[i].id === id) return state.locators[i];
    }
    return null;
  }

  function nudgeLocator(bars) {
    var loc = selectedLocatorObj();
    if (!loc) return false;
    pushUndo();
    loc.bar = Math.max(0, Math.min(BARS - 1, loc.bar + bars));
    state.locators.sort(function (a, b) { return a.bar - b.bar; });
    paintLocators();
    setMidiLabel(loc.name + " → bar " + (loc.bar + 1));
    return true;
  }

  function jumpLocator(dir) {
    if (!state.locators.length) return false;
    var sorted = state.locators.slice().sort(function (a, b) { return a.bar - b.bar; });
    var idx = -1;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].id === state.selectedLocator) { idx = i; break; }
    }
    var loc;
    if (idx < 0) {
      var bar = Math.floor(state.step / STEPS_PER_BAR);
      if (dir > 0) {
        loc = sorted.filter(function (l) { return l.bar > bar; })[0] || sorted[0];
      } else {
        var before = sorted.filter(function (l) { return l.bar < bar; });
        loc = before.length ? before[before.length - 1] : sorted[sorted.length - 1];
      }
    } else {
      idx = (idx + dir + sorted.length) % sorted.length;
      loc = sorted[idx];
    }
    state.selectedLocator = loc.id;
    jumpToStep(loc.bar * STEPS_PER_BAR);
    paintLocators();
    setMidiLabel(loc.name);
    return true;
  }

  function updatePlayheadPx() {
    if (!playheadEl || !arrangeScroll) return;
    var x = 88 + (state.step / STEPS_PER_BAR) * BAR_W;
    playheadEl.style.transform = "translateX(" + ((state.step / STEPS_PER_BAR) * BAR_W) + "px)";
    if (state.follow && state.view === "arrange") {
      var sl = arrangeScroll.scrollLeft;
      var w = arrangeScroll.clientWidth;
      var px = x - 88;
      if (px > sl + w * 0.66 || px < sl) {
        arrangeScroll.scrollLeft = Math.max(0, px - w * 0.25);
      }
    }
  }

  function paintArrange() {
    if (!arrangeLanes) return;
    arrangeLanes.querySelectorAll(".daw-lane").forEach(function (lane) {
      var tid = lane.dataset.track;
      lane.querySelectorAll(".daw-clip").forEach(function (n) {
        n.remove();
      });
      state.arrangeClips
        .filter(function (c) {
          return c.trackId === tid;
        })
        .forEach(function (c) {
          var node = el("div", "daw-clip" + (state.selectedArrange === c.id ? " sel" : ""), "");
          node.style.left = (c.start / STEPS_PER_BAR) * BAR_W + "px";
          node.style.width = Math.max(24, (c.length / STEPS_PER_BAR) * BAR_W - 4) + "px";
          node.style.background = c.color;
          var cg = (c.notes && c.notes.gain != null) ? c.notes.gain : 1;
          node.style.opacity = String(0.4 + 0.6 * Math.max(0, Math.min(1.2, cg)) / 1.2);
          node.dataset.id = c.id;
          var fi = (c.notes && c.notes.fadeIn) || 0;
          var fo = (c.notes && c.notes.fadeOut) || 0;
          var wpx = Math.max(24, (c.length / STEPS_PER_BAR) * BAR_W - 4);
          var stepPx = BAR_W / STEPS_PER_BAR;
          node.style.boxShadow = "inset " + (fi * stepPx) + "px 0 0 rgba(6,23,15,.35), inset -" + (fo * stepPx) + "px 0 0 rgba(6,23,15,.35)";
          node.title = c.name + " · corners resize · edges fade · drag to move";
          var lab = el("span", "", c.name);
          node.appendChild(lab);
          var hin = el("i", "daw-fade-in");
          hin.setAttribute("aria-label", "Fade in");
          var hout = el("i", "daw-fade-out");
          hout.setAttribute("aria-label", "Fade out");
          bindFadeHandle(hin, c, "fadeIn");
          bindFadeHandle(hout, c, "fadeOut");
          node.appendChild(hin);
          node.appendChild(hout);
          var rl = el("i", "daw-resize-l");
          rl.setAttribute("aria-label", "Resize start");
          var rr = el("i", "daw-resize-r");
          rr.setAttribute("aria-label", "Resize end");
          bindResizeHandle(rl, c, "left");
          bindResizeHandle(rr, c, "right");
          node.appendChild(rl);
          node.appendChild(rr);
          var ln = c.notes || {};
          if (ln.loop !== false) {
            var ll = Math.max(4, ln.loopLen || c.length);
            var brace = el("i", "daw-loop-brace");
            brace.style.width = Math.min(100, (ll / c.length) * 100) + "%";
            brace.title = "Loop start " + (ln.loopStart || 0) + " · length " + ll;
            var lgrip = el("i", "daw-loop-grip-l");
            lgrip.setAttribute("aria-label", "Loop start");
            bindLoopStart(lgrip, c);
            var grip = el("i", "daw-loop-grip");
            grip.setAttribute("aria-label", "Loop length");
            bindLoopBrace(grip, c);
            brace.appendChild(lgrip);
            brace.appendChild(grip);
            node.appendChild(brace);
            if (ll < c.length) {
              for (var tickAt = ll; tickAt < c.length; tickAt += ll) {
                var tick = el("i", "daw-loop-tick");
                tick.style.left = (tickAt / c.length * 100) + "%";
                node.appendChild(tick);
              }
            }
          }
          bindClipDrag(node, c);
          lane.appendChild(node);
        });
    });
    if (loopEl) {
      loopEl.style.left = 88 + state.loopStart * BAR_W + "px";
      loopEl.style.width = Math.max(BAR_W, (state.loopEnd - state.loopStart) * BAR_W) + "px";
    }
    updatePlayheadPx();
    paintLocators();
    state.tracks.forEach(paintAutoLane);
  }

  function paintAutoLane(tr) {
    if (!arrangeLanes) return;
    arrangeLanes.querySelectorAll('canvas.daw-auto[data-track="' + tr.id + '"]').forEach(function (cv) {
      var key = cv.dataset.auto || "autoVol";
      var defV = key === "autoPan" ? 0.5 : 1;
      var w = cv.width, h = cv.height;
      var ctx2 = cv.getContext("2d");
      ctx2.fillStyle = "#070908";
      ctx2.fillRect(0, 0, w, h);
      if (key === "autoPan") {
        ctx2.strokeStyle = "#1c2a24";
        ctx2.beginPath();
        ctx2.moveTo(0, h / 2);
        ctx2.lineTo(w, h / 2);
        ctx2.stroke();
      }
      var pts = ensureAuto(tr, key, defV);
      ctx2.strokeStyle = key === "autoPan" ? "#c9a6ff" : key === "autoSendA" ? "#3fc6ff" : key === "autoSendB" ? "#ffb238" : key === "autoCut" ? "#7dffb3" : (tr.color || "#3fc6ff");
      ctx2.lineWidth = 1.5;
      ctx2.beginPath();
      pts.forEach(function (p, i) {
        var x = (p.step / autoMaxStep()) * w;
        var y = (1 - p.v) * (h - 6) + 3;
        if (i === 0) ctx2.moveTo(x, y);
        else ctx2.lineTo(x, y);
      });
      ctx2.stroke();
      ctx2.fillStyle = "#ffb238";
      pts.forEach(function (p) {
        var x = (p.step / autoMaxStep()) * w;
        var y = (1 - p.v) * (h - 6) + 3;
        ctx2.fillRect(x - 3, y - 3, 6, 6);
      });
    });
  }

  function envClip() {
    if (state.selectedSession && state.selectedSession.clip) return state.selectedSession.clip;
    if (state.view === "arrange" && state.selectedArrange) {
      for (var i = 0; i < state.arrangeClips.length; i++) {
        if (state.arrangeClips[i].id === state.selectedArrange) return state.arrangeClips[i];
      }
    }
    var launched = null;
    state.tracks.forEach(function (tr) {
      if (!launched && state.launched[tr.id]) launched = state.launched[tr.id];
    });
    return launched;
  }

  function paintClipEnv() {
    if (!envCanvas) return;
    var clipObj = envClip();
    if (envTitle) envTitle.textContent = clipObj ? ("Env · " + (clipObj.name || "clip")) : "Clip envelope";
    var w = envCanvas.width, h = envCanvas.height;
    var ctx2 = envCanvas.getContext("2d");
    ctx2.fillStyle = "#070908";
    ctx2.fillRect(0, 0, w, h);
    if (!clipObj) {
      ctx2.fillStyle = "#4c5f56";
      ctx2.font = "11px Share Tech Mono, monospace";
      ctx2.fillText("Select a clip", 12, 36);
      return;
    }
    var len = Math.max(2, clipObj.length || STEPS);
    var pts = ensureClipEnv(clipObj);
    ctx2.strokeStyle = "#1c2a24";
    ctx2.beginPath();
    for (var b = 0; b <= len; b += 4) {
      var gx = (b / len) * w;
      ctx2.moveTo(gx, 0);
      ctx2.lineTo(gx, h);
    }
    ctx2.stroke();
    ctx2.strokeStyle = clipObj.color || "#3fc6ff";
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    pts.forEach(function (p, i) {
      var x = (p.step / len) * w;
      var y = (1 - Math.max(0, Math.min(1.2, p.v)) / 1.2) * (h - 8) + 4;
      if (i === 0) ctx2.moveTo(x, y);
      else ctx2.lineTo(x, y);
    });
    ctx2.stroke();
    ctx2.fillStyle = "#ffb238";
    pts.forEach(function (p) {
      var x = (p.step / len) * w;
      var y = (1 - Math.max(0, Math.min(1.2, p.v)) / 1.2) * (h - 8) + 4;
      ctx2.fillRect(x - 3, y - 3, 6, 6);
    });
    if (state.playing && clipObj) {
      var local = state.step % len;
      var px = (local / len) * w;
      ctx2.fillStyle = "#ff4d4d";
      ctx2.fillRect(px, 0, 2, h);
    }
  }

  function bindClipEnvCanvas(cv) {
    cv.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      var clipObj = envClip();
      if (!clipObj) return;
      var rect = cv.getBoundingClientRect();
      var len = Math.max(2, clipObj.length || STEPS);
      function pos(e) {
        var x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        var y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        return { step: Math.round(x * len), v: 1.2 * (1 - y) };
      }
      var pts = ensureClipEnv(clipObj);
      var p = pos(ev);
      var hit = -1;
      var thresh = len / (cv.width / 12);
      pts.forEach(function (pt, i) {
        if (Math.abs(pt.step - p.step) < thresh) hit = i;
      });
      if (ev.altKey && hit > 0 && hit < pts.length - 1) {
        pushUndo();
        pts.splice(hit, 1);
        paintClipEnv();
        return;
      }
      pushUndo();
      var pt;
      if (hit < 0) {
        pt = { step: p.step, v: p.v };
        pts.push(pt);
        pts.sort(function (a, b) { return a.step - b.step; });
      } else {
        pt = pts[hit];
      }
      function move(e) {
        var q = pos(e);
        if (pt !== pts[0] && pt !== pts[pts.length - 1]) pt.step = q.step;
        pt.v = Math.max(0, Math.min(1.2, q.v));
        pts.sort(function (a, b) { return a.step - b.step; });
        paintClipEnv();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setMidiLabel("Env " + Math.round((pt.v || 0) * 100) + "%");
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      move(ev);
    });
  }

  function bindAutoCanvas(cv, tr, key, defV) {
    key = key || "autoVol";
    if (defV == null) defV = key === "autoPan" ? 0.5 : 1;
    cv.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var rect = cv.getBoundingClientRect();
      function pos(e) {
        var x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        var y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        return { step: Math.round(x * autoMaxStep()), v: 1 - y };
      }
      var pts = ensureAuto(tr, key, defV);
      var p = pos(ev);
      var hit = -1;
      var thresh = autoMaxStep() / (cv.width / 10);
      pts.forEach(function (pt, i) {
        if (Math.abs(pt.step - p.step) < thresh) hit = i;
      });
      if (ev.altKey && hit >= 0 && pts.length > 2) {
        pushUndo();
        pts.splice(hit, 1);
        paintAutoLane(tr);
        applyAutoAt(tr, state.step);
        return;
      }
      pushUndo();
      var pt;
      if (hit < 0) {
        pt = { step: p.step, v: p.v };
        pts.push(pt);
      } else {
        pt = pts[hit];
      }
      function move(e) {
        var q = pos(e);
        pt.step = q.step;
        pt.v = Math.max(0, Math.min(1, q.v));
        pts.sort(function (a, b) { return a.step - b.step; });
        paintAutoLane(tr);
        applyAutoAt(tr, state.step);
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        applyMix();
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      move(ev);
    });
  }

  function cropNotesLeft(notes, delta) {
    if (!notes || !delta) return;
    if (notes.roll && notes.roll.length) {
      notes.roll = notes.roll.map(function (n) {
        var s = (n.start || 0) - delta;
        var len = n.length || 1;
        if (s + len <= 0) return null;
        if (s < 0) { len += s; s = 0; }
        return { id: n.id, start: s, length: len, pitch: n.pitch, vel: n.vel };
      }).filter(Boolean);
    }
    function cropArr(a) {
      if (!a) return a;
      if (delta > 0) return a.slice(delta);
      var pad = [];
      for (var i = 0; i < -delta; i++) pad.push(0);
      return pad.concat(a);
    }
    if (notes.k) notes.k = cropArr(notes.k);
    if (notes.s) notes.s = cropArr(notes.s);
    if (notes.h) notes.h = cropArr(notes.h);
    if (notes.seq) notes.seq = cropArr(notes.seq);
    if (notes.hits) notes.hits = cropArr(notes.hits);
    notes.offset = (notes.offset || 0) + delta;
  }

  function bindLoopStart(handle, clipObj) {
    handle.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!clipObj.notes) clipObj.notes = {};
      pushUndo();
      state.selectedArrange = clipObj.id;
      clipObj.notes.loop = true;
      var startX = ev.clientX;
      var orig = clipObj.notes.loopStart || 0;
      function move(e) {
        var dx = e.clientX - startX;
        var steps = Math.round(dx / (BAR_W / STEPS_PER_BAR));
        clipObj.notes.loopStart = Math.max(0, Math.min(64, orig + steps));
        paintArrange();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setMidiLabel("Loop start " + (clipObj.notes.loopStart || 0));
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function bindLoopBrace(handle, clipObj) {
    handle.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!clipObj.notes) clipObj.notes = {};
      pushUndo();
      state.selectedArrange = clipObj.id;
      clipObj.notes.loop = true;
      var startX = ev.clientX;
      var orig = clipObj.notes.loopLen || clipObj.length || STEPS;
      function move(e) {
        var dx = e.clientX - startX;
        var steps = Math.round(dx / (BAR_W / STEPS_PER_BAR));
        var next = Math.max(4, Math.min(clipObj.length || STEPS, orig + steps));
        clipObj.notes.loopLen = next;
        paintArrange();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        setMidiLabel("Loop " + (clipObj.notes.loopLen || 0));
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function bindResizeHandle(handle, clipObj, edge) {
    handle.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      pushUndo();
      state.selectedArrange = clipObj.id;
      var startX = ev.clientX;
      var origStart = clipObj.start;
      var origLen = clipObj.length;
      var origNotes = cloneNotes(clipObj.notes);
      var minLen = 4;
      function move(e) {
        var dx = e.clientX - startX;
        var steps = Math.round(dx / (BAR_W / STEPS_PER_BAR));
        if (edge === "right") {
          var nextLen = Math.max(minLen, origLen + steps);
          nextLen = Math.min(nextLen, BARS * STEPS_PER_BAR - origStart);
          clipObj.length = nextLen;
          clipObj.notes = cloneNotes(origNotes);
        } else {
          var nextStart = Math.max(0, origStart + steps);
          var nextLen = origLen - (nextStart - origStart);
          if (nextLen < minLen) {
            nextStart = origStart + origLen - minLen;
            nextLen = minLen;
          }
          clipObj.start = nextStart;
          clipObj.length = nextLen;
          clipObj.notes = cloneNotes(origNotes);
          cropNotesLeft(clipObj.notes, nextStart - origStart);
        }
        if (clipObj.notes) {
          var maxF = Math.max(1, Math.floor(clipObj.length / 2));
          clipObj.notes.fadeIn = Math.min(clipObj.notes.fadeIn || 0, maxF);
          clipObj.notes.fadeOut = Math.min(clipObj.notes.fadeOut || 0, maxF);
        }
        paintArrange();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function bindFadeHandle(handle, clipObj, which) {
    handle.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      if (!clipObj.notes) clipObj.notes = {};
      pushUndo();
      var startX = ev.clientX;
      var orig = clipObj.notes[which] || 0;
      var max = Math.max(1, Math.floor((clipObj.length || STEPS) / 2));
      function move(e) {
        var dx = e.clientX - startX;
        var steps = Math.round(dx / (BAR_W / STEPS_PER_BAR));
        if (which === "fadeOut") steps = -steps;
        clipObj.notes[which] = Math.max(0, Math.min(max, orig + steps));
        paintArrange();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function bindClipDrag(node, clipObj) {
    node.addEventListener("dblclick", function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      renameClip(clipObj);
    });
    node.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      state.selectedArrange = clipObj.id;
      if (ev.shiftKey) {
        cycleClipColor(clipObj);
        return;
      }
      if (ev.altKey) {
        if (!clipObj.notes) clipObj.notes = {};
        pushUndo();
        var startY = ev.clientY;
        var origG = clipObj.notes.gain == null ? 1 : clipObj.notes.gain;
        function moveG(e) {
          clipObj.notes.gain = Math.max(0, Math.min(1.4, origG - (e.clientY - startY) / 80));
          paintArrange();
        }
        function upG() {
          window.removeEventListener("pointermove", moveG);
          window.removeEventListener("pointerup", upG);
          setMidiLabel("Gain " + Math.round((clipObj.notes.gain || 0) * 100) + "%");
        }
        window.addEventListener("pointermove", moveG);
        window.addEventListener("pointerup", upG);
        return;
      }
      paintArrange();
      var startX = ev.clientX;
      var orig = clipObj.start;
      function move(e) {
        var dx = e.clientX - startX;
        var bars = Math.round(dx / BAR_W);
        var next = Math.max(0, Math.min((BARS - 1) * STEPS_PER_BAR, orig + bars * STEPS_PER_BAR));
        clipObj.start = next;
        paintArrange();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    });
  }

  function dropOnLane(track, bar) {
    pushUndo();
    var src = state.selectedSession && state.selectedSession.track.id === track.id
      ? state.selectedSession.clip
      : state.launched[track.id] || (state.selectedSession && state.selectedSession.clip);
    if (!src) return;
    var start = bar * STEPS_PER_BAR;
    state.arrangeClips.push({
      id: track.id + "-" + start + "-" + Date.now(),
      trackId: track.id,
      start: start,
      length: STEPS_PER_BAR * 2,
      name: src.name,
      color: src.color || track.color,
      notes: (function () {
        var nn = cloneNotes(src.notes) || {};
        nn.loop = true;
        nn.loopLen = src.length || STEPS;
        return nn;
      })(),
    });
    paintArrange();
  }

  var ROLL_H = 16;
  var ROLL_W = 24;
  var PITCH_MAX = 36;
  var SCALE_TONES = {
    minor: [0, 2, 3, 5, 7, 8, 10],
    major: [0, 2, 4, 5, 7, 9, 11],
    penta: [0, 3, 5, 7, 10],
    chrom: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  };
  var PITCH_NAMES = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

  function pitchName(p) {
    return PITCH_NAMES[((p % 12) + 12) % 12] + Math.floor(p / 12);
  }

  function inScale(p) {
    var tones = SCALE_TONES[state.rollScale] || SCALE_TONES.minor;
    return tones.indexOf(((p % 12) + 12) % 12) >= 0;
  }

  function isBlack(p) {
    var n = ((p % 12) + 12) % 12;
    return n === 1 || n === 4 || n === 6 || n === 9 || n === 11;
  }

  function snapStep(x) {
    var s = state.rollSnap || 1;
    return Math.max(0, Math.round(x / s) * s);
  }

  function ensureRoll(clipObj) {
    if (!clipObj.notes) clipObj.notes = {};
    if (clipObj.notes.roll && clipObj.notes.roll.length) return clipObj.notes.roll;
    var roll = [];
    var n = clipObj.notes;
    function add(pitch, start, length, vel) {
      roll.push({ id: "n" + noteSeq++, pitch: pitch, start: start, length: length || 1, vel: vel == null ? 0.85 : vel });
    }
    if (n.seq) {
      n.seq.forEach(function (v, i) {
        if (typeof v === "number" && v >= 0) add(v, i, 1, 0.85);
      });
    }
    if (n.hits) {
      n.hits.forEach(function (v, i) {
        if (!v) return;
        (n.chord || [0, 3, 7]).forEach(function (p) {
          add(p + 12, i, 2, 0.7);
        });
      });
    }
    if (n.hold && n.chord) {
      n.chord.forEach(function (p) {
        add(p + 12, 0, clipObj.length || STEPS, 0.45);
      });
    }
    clipObj.notes.roll = roll;
    return roll;
  }

  function activeRollClip() {
    var sel = state.selectedSession;
    if (sel && sel.clip && sel.track && sel.track.kind !== "audio") return sel;
    for (var i = 0; i < state.tracks.length; i++) {
      var tr = state.tracks[i];
      if (tr.kind === "audio" || tr.kind === "drums" || tr.kind === "perc") continue;
      for (var s = 0; s < tr.clips.length; s++) {
        if (tr.clips[s]) return { track: tr, clip: tr.clips[s] };
      }
    }
    return null;
  }

  function defaultRack(kind) {
    function pad(id, name, synth, choke, extra) {
      var p = { id: id, name: name, synth: synth, choke: choke || 0, gain: 0.9, decay: 0.4, buffer: null, open: false };
      if (extra) Object.keys(extra).forEach(function (k) { p[k] = extra[k]; });
      return p;
    }
    if (kind === "perc") {
      return {
        pads: [
          pad("sh", "Shake", "perc", 0, { gain: 0.7, midi: 36 }),
          pad("rm", "Rim", "rim", 0, { midi: 40 }),
          pad("cl", "Clap", "clap", 0, { midi: 39 }),
          pad("tm", "Tom", "tom", 2, { midi: 45 }),
          pad("ch", "CH", "hat", 1, { open: false, gain: 0.65, midi: 42 }),
          pad("oh", "OH", "hat", 1, { open: true, gain: 0.75, midi: 46 }),
          pad("k2", "Kick", "kick", 0, { midi: 36 }),
          pad("s2", "Snare", "snare", 0, { midi: 38 }),
        ],
      };
    }
    return {
      pads: [
        pad("k", "Kick", "kick", 0, { gain: 1, midi: 36 }),
        pad("s", "Snare", "snare", 0, { midi: 38 }),
        pad("h", "CH", "hat", 1, { open: false, gain: 0.7, midi: 42 }),
        pad("oh", "OH", "hat", 1, { open: true, gain: 0.8, decay: 0.35, midi: 46 }),
        pad("t", "Tom", "tom", 2, { midi: 45 }),
        pad("c", "Clap", "clap", 0, { midi: 39 }),
        pad("p", "Perc", "perc", 0, { gain: 0.7, midi: 37 }),
        pad("r", "Rim", "rim", 0, { midi: 40 }),
      ],
    };
  }

  function attachDefaultRacks(tracks) {
    tracks.forEach(function (tr) {
      if (tr.kind !== "drums" && tr.kind !== "perc") return;
      tr.rack = defaultRack(tr.kind);
      tr.clips.forEach(function (c) {
        if (c) ensureDrumSteps(c, tr);
      });
    });
  }

  function ensureRack(track) {
    if (!track.rack) track.rack = defaultRack(track.kind === "perc" ? "perc" : "drums");
    return track.rack;
  }

  function ensureDrumSteps(clipObj, track) {
    if (!clipObj.notes) clipObj.notes = {};
    if (clipObj.notes.steps) return clipObj.notes.steps;
    var steps = {};
    ensureRack(track).pads.forEach(function (p) {
      steps[p.id] = emptyGrid();
    });
    var n = clipObj.notes;
    if (n.k && steps.k) steps.k = n.k.slice();
    if (n.s && steps.s) steps.s = n.s.slice();
    if (n.h && steps.h) {
      steps.h = n.h.map(function (v, i) { return i % 8 === 7 ? 0 : v; });
      if (steps.oh) steps.oh = n.h.map(function (v, i) { return i % 8 === 7 && v ? 1 : 0; });
    }
    if (n.seq && track.kind === "perc") {
      var pid = track.rack.pads[0].id;
      steps[pid] = n.seq.map(function (v) { return v ? 1 : 0; });
      while (steps[pid].length < STEPS) steps[pid].push(0);
    }
    clipObj.notes.steps = steps;
    return steps;
  }

  function stopPadVoice(key, time) {
    var g = padVoices[key];
    if (!g || !ctx) return;
    var t0 = time == null ? ctx.currentTime : time;
    try {
      g.gain.cancelScheduledValues(t0);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value || 0.0001), t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.018);
    } catch (e) {}
  }

  function synthInto(pad, dest, time) {
    var s = pad.synth;
    if (s === "kick") trigKick(dest, time);
    else if (s === "snare") trigSnare(dest, time);
    else if (s === "hat") trigHat(dest, time, !!pad.open);
    else if (s === "tom") trigTom(dest, time);
    else if (s === "clap") trigClap(dest, time);
    else if (s === "rim") trigRim(dest, time);
    else trigPerc(dest, time, false);
  }

  function trigRackPad(track, pad, time, vel, destOverride) {
    if (!destOverride && !trackAudible(track)) return;
    ensureAudio();
    var dest = destOverride || trackNodes[track.id];
    if (!dest) return;
    var t0 = time == null ? ctx.currentTime : time;
    var prefix = track.id + ":";
    if (pad.choke) {
      track.rack.pads.forEach(function (p) {
        if (p.choke === pad.choke) stopPadVoice(prefix + p.id, t0);
      });
    } else {
      stopPadVoice(prefix + pad.id, t0);
    }
    var g = ctx.createGain();
    var peak = (pad.gain == null ? 0.9 : pad.gain) * (vel == null ? 1 : vel);
    g.gain.setValueAtTime(Math.max(0.0001, peak), t0);
    g.connect(dest);
    padVoices[prefix + pad.id] = g;
    if (pad.buffer) {
      var src = ctx.createBufferSource();
      src.buffer = pad.buffer;
      src.connect(g);
      src.start(t0);
      var d = pad.decay == null ? 0.5 : pad.decay;
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(0.05, d));
    } else {
      synthInto(pad, g, t0);
    }
    flashPad(pad.id);
  }

  function flashPad(id) {
    if (!rackPadsEl) return;
    var b = rackPadsEl.querySelector('[data-pad="' + id + '"]');
    if (!b) return;
    b.classList.add("hit");
    window.setTimeout(function () { b.classList.remove("hit"); }, 80);
  }

  function playDrumRack(track, clipObj, i, time, velMul, destOverride) {
    ensureRack(track);
    var steps = ensureDrumSteps(clipObj, track);
    velMul = velMul == null ? 1 : velMul;
    if (velMul < 0.02) return;
    track.rack.pads.forEach(function (pad) {
      var row = steps[pad.id];
      if (row && row[i % (clipObj.length || STEPS)]) trigRackPad(track, pad, time, 0.95 * velMul, destOverride);
    });
  }

  function activeRackPair() {
    var sel = state.selectedSession;
    if (sel && sel.track && (sel.track.kind === "drums" || sel.track.kind === "perc") && sel.clip) return sel;
    for (var i = 0; i < state.tracks.length; i++) {
      var tr = state.tracks[i];
      if (tr.kind !== "drums" && tr.kind !== "perc") continue;
      for (var s = 0; s < tr.clips.length; s++) {
        if (tr.clips[s]) return { track: tr, clip: tr.clips[s] };
      }
    }
    return null;
  }

  function openRack(track, clipObj) {
    if (!track || (track.kind !== "drums" && track.kind !== "perc")) {
      var pair = activeRackPair();
      if (!pair) return;
      track = pair.track;
      clipObj = pair.clip;
    }
    if (!clipObj) clipObj = track.clips.find(function (c) { return !!c; });
    if (!clipObj) {
      clipObj = clip("Beat", track.color, {});
      track.clips[0] = clipObj;
    }
    state.selectedSession = { track: track, clip: clipObj };
    ensureRack(track);
    ensureDrumSteps(clipObj, track);
    if (!state.selectedPad) state.selectedPad = track.rack.pads[0].id;
    setView("rack");
  }

  function loadPadSample(track, pad) {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "audio/*,.wav,.mp3,.ogg,.m4a";
    inp.addEventListener("change", function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      ensureAudio();
      f.arrayBuffer().then(function (ab) {
        return ctx.decodeAudioData(ab.slice(0));
      }).then(function (buf) {
        pad.buffer = buf;
        pad.name = (f.name || pad.name).replace(/\.[^.]+$/, "").slice(0, 10);
        paintRack();
        trigRackPad(track, pad, ctx.currentTime, 1);
      }).catch(function () {});
    });
    inp.click();
  }

  function paintRack() {
    if (!rackEl || !rackPadsEl || !rackStepsEl) return;
    var pair = activeRackPair();
    if (!pair) {
      rackPadsEl.replaceChildren(el("div", "daw-roll-hint", "Add a drums clip, then open Rack."));
      rackStepsEl.replaceChildren();
      return;
    }
    var track = pair.track;
    var clipObj = pair.clip;
    ensureRack(track);
    var steps = ensureDrumSteps(clipObj, track);
    if (rackTitle) rackTitle.textContent = track.name + " · " + clipObj.name;
    var sel = state.selectedPad || track.rack.pads[0].id;
    var selPad = track.rack.pads.find(function (p) { return p.id === sel; }) || track.rack.pads[0];
    state.selectedPad = selPad.id;
    rackPadsEl.replaceChildren();
    track.rack.pads.forEach(function (pad) {
      var b = el("button", "daw-pad" + (pad.id === selPad.id ? " on" : "") + (pad.buffer ? " has-sample" : ""), pad.name);
      b.type = "button";
      b.dataset.pad = pad.id;
      b.setAttribute("aria-label", pad.name + (pad.choke ? " choke " + pad.choke : ""));
      b.addEventListener("click", function () {
        state.selectedPad = pad.id;
        ensureAudio();
        ctx.resume();
        trigRackPad(track, pad, ctx.currentTime, 1);
        paintRack();
      });
      b.addEventListener("dblclick", function (ev) {
        ev.preventDefault();
        loadPadSample(track, pad);
      });
      enableDrop(b, function () { return { track: track, pad: pad }; });
      rackPadsEl.appendChild(b);
    });
    rackStepsEl.replaceChildren();
    track.rack.pads.forEach(function (pad) {
      var row = el("div", "daw-step-row");
      row.appendChild(el("div", "daw-step-lab", pad.name));
      var grid = steps[pad.id] || (steps[pad.id] = emptyGrid());
      for (var i = 0; i < STEPS; i++) {
        (function (padRef, idx) {
          var cell = el("button", "daw-step" + (grid[idx] ? " on" : "") + (idx % 4 === 0 ? " beat" : ""));
          cell.type = "button";
          cell.dataset.pad = padRef.id;
          cell.dataset.st = String(idx);
          cell.setAttribute("aria-label", padRef.name + " step " + (idx + 1));
          cell.addEventListener("click", function () {
            grid[idx] = grid[idx] ? 0 : 1;
            if (grid[idx]) {
              ensureAudio();
              ctx.resume();
              trigRackPad(track, padRef, ctx.currentTime, 0.9);
            }
            paintRack();
          });
          row.appendChild(cell);
        })(pad, i);
      }
      rackStepsEl.appendChild(row);
    });
    var tools = rackEl.querySelector("[data-rack-tools]");
    if (tools) {
      var choke = tools.querySelector("[data-choke]");
      var gain = tools.querySelector("[data-pgain]");
      var decay = tools.querySelector("[data-pdecay]");
      if (choke) choke.value = String(selPad.choke || 0);
      if (gain) gain.value = String(selPad.gain == null ? 0.9 : selPad.gain);
      if (decay) decay.value = String(selPad.decay == null ? 0.4 : selPad.decay);
    }
    paintRackCursor();
  }

  function paintRackCursor() {
    if (!rackStepsEl) return;
    var i = state.step % STEPS;
    rackStepsEl.querySelectorAll("[data-st]").forEach(function (cell) {
      cell.classList.toggle("now", state.playing && Number(cell.dataset.st) === i);
    });
  }

  function openRoll(track, clipObj) {
    if (!clipObj || track.kind === "audio") return;
    if (track.kind === "drums" || track.kind === "perc") {
      openRack(track, clipObj);
      return;
    }
    state.selectedSession = { track: track, clip: clipObj };
    state.selectedNote = null;
    ensureRoll(clipObj);
    setView("roll");
  }

  function getSelectedNote() {
    var pair = activeRollClip();
    if (!pair || !state.selectedNote) return null;
    var roll = ensureRoll(pair.clip);
    return roll.find(function (n) { return n.id === state.selectedNote; }) || null;
  }

  function deleteSelectedNote() {
    var pair = activeRollClip();
    if (!pair || !state.selectedNote) return;
    pushUndo();
    pair.clip.notes.roll = ensureRoll(pair.clip).filter(function (n) { return n.id !== state.selectedNote; });
    state.selectedNote = null;
    paintRoll();
  }

  var liveNotes = {};
  var keysHeld = {};
  var recLive = {};
  var midiOctave = 2;
  var midiLearn = null;
  var midiLabel = null;
  var KEY_PITCH = {
    KeyA: 0, KeyW: 1, KeyS: 2, KeyE: 3, KeyD: 4, KeyF: 5,
    KeyT: 6, KeyG: 7, KeyY: 8, KeyH: 9, KeyU: 10, KeyJ: 11, KeyK: 12,
    KeyO: 13, KeyL: 14, KeyP: 15, Semicolon: 16
  };
  var KEY_PADS = {
    Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
    Digit5: 4, Digit6: 5, Digit7: 6, Digit8: 7
  };

  function midiToPitch(note) {
    return note - 33;
  }

  function startLiveNote(track, pitch, vel) {
    if (!track || track.kind === "audio") return;
    ensureAudio();
    ctx.resume();
    var dest = trackNodes[track.id];
    if (!dest) return;
    var key = track.id + ":" + pitch;
    if (liveNotes[key]) stopLiveNote(track, pitch);
    var analog = analogOf(track);
    var wave = analog ? analog.wave : track.kind === "lead" ? "square" : track.kind === "bass" ? "sawtooth" : "triangle";
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = analog ? analog.cutoff : track.kind === "bass" ? 420 : 8000;
    f.Q.value = analog ? analog.res : 0.8;
    f.connect(dest);
    var g = ctx.createGain();
    var peak = (track.kind === "bass" ? 0.38 : 0.16) * Math.max(0.05, vel || 0.85);
    var atk = analog ? analog.attack : 0.01;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(peak, ctx.currentTime + Math.max(0.005, atk));
    g.connect(f);
    var o = ctx.createOscillator();
    o.type = wave;
    o.frequency.value = midiHz(pitch + (track.kind === "bass" ? 0 : 12));
    o.connect(g);
    o.start();
    liveNotes[key] = { o: o, g: g };
    if (state.recording) beginRecNote(track, pitch, vel);
  }

  function stopLiveNote(track, pitch) {
    var key = track.id + ":" + pitch;
    var v = liveNotes[key];
    if (v && ctx) {
      var t0 = ctx.currentTime;
      try {
        v.g.gain.cancelScheduledValues(t0);
        v.g.gain.setValueAtTime(Math.max(0.0001, v.g.gain.value || 0.0001), t0);
        v.g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08);
        v.o.stop(t0 + 0.1);
      } catch (e) {}
    }
    delete liveNotes[key];
    endRecNote(track, pitch);
  }

  function beginRecNote(track, pitch, vel) {
    var clip = (state.selectedSession && state.selectedSession.track === track && state.selectedSession.clip)
      || (track.clips || []).find(function (c) { return !!c; });
    if (!clip || track.kind === "drums" || track.kind === "perc" || track.kind === "audio") return;
    ensureRoll(clip);
    recLive[pitch] = { clip: clip, start: state.playing ? (state.step % (clip.length || STEPS)) : 0, vel: vel || 0.85 };
  }

  function endRecNote(track, pitch) {
    var rec = recLive[pitch];
    if (!rec) return;
    var len = state.playing ? (state.step % (rec.clip.length || STEPS)) - rec.start : (state.rollSnap || 1);
    if (len <= 0) len = state.rollSnap || 1;
    rec.clip.notes.roll.push({ id: "n" + noteSeq++, pitch: pitch, start: rec.start, length: len, vel: rec.vel });
    delete recLive[pitch];
    if (state.view === "roll") paintRoll();
  }

  function padForMidi(track, note) {
    if (!track.rack) return null;
    for (var i = 0; i < track.rack.pads.length; i++) {
      if (track.rack.pads[i].midi === note) return track.rack.pads[i];
    }
    var idx = note - 36;
    if (idx >= 0 && idx < track.rack.pads.length) return track.rack.pads[idx];
    return null;
  }

  function playIncomingNote(note, vel) {
    var tr = selectedTrack();
    if (!tr) return;
    if (midiLearn === "pad") {
      if (tr.rack) {
        var pad = tr.rack.pads.find(function (p) { return p.id === state.selectedPad; }) || tr.rack.pads[0];
        pad.midi = note;
        midiLearn = null;
        setMidiLabel("Pad " + pad.name + " → " + note);
        paintRack();
      }
      return;
    }
    ensureAudio();
    ctx.resume();
    if (tr.kind === "drums" || tr.kind === "perc") {
      var p = padForMidi(tr, note);
      if (p) trigRackPad(tr, p, ctx.currentTime, vel);
      return;
    }
    startLiveNote(tr, midiToPitch(note), vel);
  }

  function releaseIncomingNote(note) {
    var tr = selectedTrack();
    if (!tr || tr.kind === "drums" || tr.kind === "perc") return;
    stopLiveNote(tr, midiToPitch(note));
  }

  function midiCC(cc, val) {
    var djCc = { xfade: 1, volA: 1, volB: 1, pitchA: 1, pitchB: 1, jogA: 1, jogB: 1, eqLowA: 1, eqMidA: 1, eqHiA: 1, eqLowB: 1, eqMidB: 1, eqHiB: 1, filterA: 1, filterB: 1 };
    if (midiLearn && (djCc[midiLearn] || midiLearn === "volume" || midiLearn === "pan" || midiLearn === "cutoff")) {
      state.ccMap[cc] = midiLearn;
      setMidiLabel("CC" + cc + " → " + midiLearn);
      midiLearn = null;
      return;
    }
    var dest = state.ccMap[cc];
    if (!dest) return;
    if (dest === "xfade") {
      state.xfade = val;
      applyXfade();
      return;
    }
    if (dest === "volA") { decks.A.vol = val * 1.2; applyDeckMix(); return; }
    if (dest === "volB") { decks.B.vol = val * 1.2; applyDeckMix(); return; }
    if (dest === "pitchA") { decks.A.rate = 0.84 + val * 0.32; applyDeckRate("A"); paintDj(); return; }
    if (dest === "pitchB") { decks.B.rate = 0.84 + val * 0.32; applyDeckRate("B"); paintDj(); return; }
    if (dest === "jogA") { jogDeck("A", (val - 0.5) * 2); return; }
    if (dest === "jogB") { jogDeck("B", (val - 0.5) * 2); return; }
    if (dest === "eqLowA" || dest === "eqMidA" || dest === "eqHiA") {
      var kA = dest === "eqLowA" ? "eqLow" : dest === "eqMidA" ? "eqMid" : "eqHi";
      decks.A[kA] = -18 + val * 24;
      applyDeckEq("A");
      return;
    }
    if (dest === "eqLowB" || dest === "eqMidB" || dest === "eqHiB") {
      var kB = dest === "eqLowB" ? "eqLow" : dest === "eqMidB" ? "eqMid" : "eqHi";
      decks.B[kB] = -18 + val * 24;
      applyDeckEq("B");
      return;
    }
    if (dest === "filterA") { decks.A.filter = val; applyDeckEq("A"); return; }
    if (dest === "filterB") { decks.B.filter = val; applyDeckEq("B"); return; }
    var tr = selectedTrack();
    if (!tr) return;
    if (dest === "volume") {
      tr.volume = val * 1.2;
      applyMix();
    } else if (dest === "pan") {
      tr.pan = val * 2 - 1;
      applyMix();
    } else if (dest === "cutoff") {
      var a = getDevice(tr, "analog");
      if (a) {
        a.cutoff = 80 + val * 7920;
        a.on = true;
        applyDevices(tr);
      }
    }
  }

  function onMidiMessage(ev) {
    var d = ev.data;
    if (!d || d.length < 2) return;
    var cmd = d[0] & 0xf0;
    var n = d[1];
    var v = d.length > 2 ? d[2] / 127 : 0;
    if (cmd === 0xe0) {
      var ch = d[0] & 0x0f;
      var pb = ((d[2] << 7) | d[1]) / 16383;
      jogDeck(ch % 2 === 0 ? "A" : "B", (pb - 0.5) * 2);
      return;
    }
    if (cmd === 0x90 && d[2] > 0) {
      if (midiLearn && /^(play|cue|sync)[AB]$/.test(midiLearn)) {
        if (!state.noteMap) state.noteMap = {};
        state.noteMap[n] = midiLearn;
        setMidiLabel("Note " + n + " → " + midiLearn);
        midiLearn = null;
        return;
      }
      if (state.noteMap && state.noteMap[n]) {
        handleDjMap(state.noteMap[n], 1);
        return;
      }
      playIncomingNote(n, v);
    } else if (cmd === 0x80 || (cmd === 0x90 && d[2] === 0)) {
      releaseIncomingNote(n);
    } else if (cmd === 0xb0) midiCC(n, v);
  }

  function hookMidi() {
    if (state.midiHooked) return;
    state.midiHooked = true;
    if (!navigator.requestMIDIAccess) {
      setMidiLabel("Keys A–L");
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then(function (access) {
      midiAccess = access;
      function bind(port) {
        port.onmidimessage = onMidiMessage;
      }
      access.inputs.forEach(bind);
      access.onstatechange = function (e) {
        if (e.port && e.port.type === "input" && e.port.state === "connected") bind(e.port);
        populateIo();
        var n = 0;
        var names = [];
        access.inputs.forEach(function (p) { n += 1; names.push(p.name || p.id); });
        setMidiLabel(n ? names.join(" · ") : "MIDI wait");
      };
      var n = 0;
      var names = [];
      access.inputs.forEach(function (p) { n += 1; names.push(p.name || p.id); });
      setMidiLabel(n ? names.join(" · ") : "MIDI wait");
      populateIo();
    }).catch(function () {
      setMidiLabel("Keys A–L");
    });
  }

  function setMidiLabel(text) {
    if (midiLabel) midiLabel.textContent = text;
  }

  function handlePianoKey(code, down) {
    var tr = selectedTrack();
    if (!tr) return false;
    if (KEY_PADS[code] != null && (tr.kind === "drums" || tr.kind === "perc") && tr.rack) {
      if (down) {
        var pad = tr.rack.pads[KEY_PADS[code]];
        if (pad) {
          if (midiLearn === "pad") {
            midiLearn = null;
            setMidiLabel("Click MIDI note for " + pad.name);
            state.selectedPad = pad.id;
            paintRack();
            midiLearn = "pad";
            return true;
          }
          ensureAudio();
          ctx.resume();
          trigRackPad(tr, pad, ctx.currentTime, 0.95);
        }
      }
      return true;
    }
    if (KEY_PITCH[code] == null) return false;
    var pitch = KEY_PITCH[code] + midiOctave * 12;
    if (tr.kind === "drums" || tr.kind === "perc") {
      if (down && tr.rack) {
        var p2 = tr.rack.pads[KEY_PITCH[code] % tr.rack.pads.length];
        if (p2) {
          ensureAudio();
          ctx.resume();
          trigRackPad(tr, p2, ctx.currentTime, 0.9);
        }
      }
      return true;
    }
    if (down) startLiveNote(tr, pitch, 0.85);
    else stopLiveNote(tr, pitch);
    return true;
  }


  function trigRollNote(track, dest, t, pitch, dur, vel) {
    vel = Math.max(0.05, Math.min(1, vel || 0.8));
    dur = Math.max(0.05, dur || 0.2);
    var analog = analogOf(track);
    var wave = analog ? analog.wave : track.kind === "lead" ? "square" : track.kind === "bass" ? "sawtooth" : "triangle";
    var atk = analog ? analog.attack : 0.01;
    var dec = analog ? Math.max(dur, analog.decay) : dur;
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = analog ? analog.cutoff : track.kind === "bass" ? 420 : 8000;
    f.Q.value = analog ? analog.res : 0.8;
    f.connect(dest);
    var g = envGain(f, t, (track.kind === "bass" ? 0.4 : 0.18) * vel, atk, dec);
    osc(wave, midiHz(pitch + (track.kind === "bass" ? 0 : 12)), g, t, dec + 0.03);
  }

  function playRollStep(track, dest, roll, i, time, xp) {
    xp = xp || 0;
    ensureMidiFx(track);
    var ar = getDevice(track, "arp");
    roll.forEach(function (note) {
      var start = Math.floor(note.start + 1e-6);
      var len = Math.max(1, note.length || 1);
      var held = i >= start && i < start + len;
      if (!held) return;
      if (!(ar && ar.on) && start !== i) return;
      var dur = Math.max(0.05, len * secondsPerStep());
      if (ar && ar.on) {
        var rate = Math.max(1, ar.rate || 1);
        if ((i - start) % rate !== 0) return;
        dur = secondsPerStep() * rate * (ar.gate == null ? 0.7 : ar.gate);
      }
      midiOut(track, [note.pitch + xp], i - start).forEach(function (p) {
        trigRollNote(track, dest, time, p, dur, note.vel);
      });
    });
  }

  function previewPitch(track, pitch) {
    if (!track) return;
    ensureAudio();
    ctx.resume();
    var dest = trackNodes[track.id];
    if (!dest) return;
    var p = midiOut(track, [pitch], 0)[0];
    if (p == null) p = pitch;
    trigRollNote(track, dest, ctx.currentTime, p, 0.18, 0.8);
  }

  function paintRoll() {
    if (!rollGrid || !rollKeys) return;
    var pair = activeRollClip();
    if (rollTitle) {
      rollTitle.textContent = pair ? pair.track.name + " · " + pair.clip.name : "Piano roll";
    }
    if (pair) syncXformUi(rollEl, pair.clip);
    if (!pair) {
      rollKeys.replaceChildren();
      rollGrid.replaceChildren();
      if (rollVel) rollVel.replaceChildren();
      return;
    }
    if (pair.track.kind === "drums" || pair.track.kind === "perc") {
      rollKeys.replaceChildren();
      rollGrid.replaceChildren(el("div", "daw-roll-hint", "Drum clips wait for the drum rack. Pick a MIDI clip."));
      if (rollVel) rollVel.replaceChildren();
      return;
    }
    var clipObj = pair.clip;
    var roll = ensureRoll(clipObj);
    var cols = clipObj.length || STEPS;
    var gridH = (PITCH_MAX + 1) * ROLL_H;
    var gridW = cols * ROLL_W;
    rollGrid.style.width = gridW + "px";
    rollGrid.style.height = gridH + "px";
    var bg = "repeating-linear-gradient(180deg,";
    var rows = [];
    for (var p = PITCH_MAX; p >= 0; p--) {
      var topC = inScale(p) ? (isBlack(p) ? "#101814" : "#15221c") : (isBlack(p) ? "#080a09" : "#0c100e");
      rows.push(topC + " 0 " + ROLL_H + "px");
    }
    /* row colors applied per key; grid uses vertical steps */
    rollGrid.style.backgroundImage =
      "repeating-linear-gradient(90deg, transparent, transparent " + (ROLL_W - 1) + "px, #1c2a24 " + (ROLL_W - 1) + "px, #1c2a24 " + ROLL_W + "px)," +
      "repeating-linear-gradient(90deg, transparent, transparent " + (ROLL_W * 4 - 1) + "px, #2a3d34 " + (ROLL_W * 4 - 1) + "px, #2a3d34 " + (ROLL_W * 4) + "px)";
    rollGrid.style.backgroundColor = "#0c100e";

    rollKeys.replaceChildren();
    for (var k = PITCH_MAX; k >= 0; k--) {
      (function (pitch) {
        var key = el("div", "daw-key" + (isBlack(pitch) ? " black" : "") + (inScale(pitch) ? " in-scale" : ""), pitchName(pitch));
        key.style.height = ROLL_H + "px";
        key.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          previewPitch(pair.track, pitch);
        });
        rollKeys.appendChild(key);
      })(k);
    }

    rollGrid.replaceChildren();
    roll.forEach(function (note) {
      var node = el("div", "daw-note" + (state.selectedNote === note.id ? " sel" : ""), pitchName(note.pitch));
      node.style.left = note.start * ROLL_W + "px";
      node.style.top = (PITCH_MAX - note.pitch) * ROLL_H + "px";
      node.style.width = Math.max(10, note.length * ROLL_W - 2) + "px";
      node.style.height = ROLL_H - 2 + "px";
      var alpha = 0.35 + 0.65 * (note.vel == null ? 0.85 : note.vel);
      node.style.background = clipObj.color || pair.track.color;
      node.style.opacity = String(alpha);
      node.dataset.id = note.id;
      var handle = el("div", "daw-note-h");
      node.appendChild(handle);
      bindNoteDrag(node, handle, note, pair, cols);
      rollGrid.appendChild(node);
    });

    rollGrid.onpointerdown = function (ev) {
      if (ev.target !== rollGrid) return;
      var rect = rollGrid.getBoundingClientRect();
      var start = snapStep((ev.clientX - rect.left) / ROLL_W);
      var pitch = PITCH_MAX - Math.floor((ev.clientY - rect.top) / ROLL_H);
      if (start < 0 || start >= cols) return;
      if (pitch < 0 || pitch > PITCH_MAX) return;
      var note = { id: "n" + noteSeq++, pitch: pitch, start: start, length: state.rollSnap || 1, vel: 0.85 };
      if (note.start + note.length > cols) note.length = Math.max(state.rollSnap, cols - note.start);
      roll.push(note);
      state.selectedNote = note.id;
      previewPitch(pair.track, pitch);
      paintRoll();
    };

    if (rollVel) {
      rollVel.replaceChildren();
      rollVel.style.width = gridW + "px";
      roll.forEach(function (note) {
        var bar = el("div", "daw-vel-n");
        bar.style.left = note.start * ROLL_W + "px";
        bar.style.width = Math.max(6, note.length * ROLL_W - 4) + "px";
        bar.style.height = Math.round((note.vel == null ? 0.85 : note.vel) * 52) + "px";
        bar.dataset.id = note.id;
        bar.addEventListener("pointerdown", function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          state.selectedNote = note.id;
          var rect = rollVel.getBoundingClientRect();
          function move(e) {
            var y = 1 - (e.clientY - rect.top) / rect.height;
            note.vel = Math.max(0.05, Math.min(1, y));
            if (rollEl._velInp) rollEl._velInp.value = String(note.vel);
            paintRoll();
          }
          function up() {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
          }
          window.addEventListener("pointermove", move);
          window.addEventListener("pointerup", up);
          move(ev);
        });
        rollVel.appendChild(bar);
      });
    }
    if (rollEl._velInp) {
      var sn = getSelectedNote();
      if (sn) rollEl._velInp.value = String(sn.vel == null ? 0.85 : sn.vel);
    }
  }

  function bindNoteDrag(node, handle, note, pair, cols) {
    function grab(ev, mode) {
      ev.preventDefault();
      ev.stopPropagation();
      state.selectedNote = note.id;
      if (rollEl._velInp) rollEl._velInp.value = String(note.vel == null ? 0.85 : note.vel);
      var ox = ev.clientX;
      var oy = ev.clientY;
      var os = note.start;
      var ol = note.length;
      var op = note.pitch;
      function move(e) {
        var dx = (e.clientX - ox) / ROLL_W;
        var dy = (e.clientY - oy) / ROLL_H;
        if (mode === "resize") {
          note.length = Math.max(state.rollSnap || 1, snapStep(ol + dx));
          if (note.start + note.length > cols) note.length = cols - note.start;
        } else {
          note.start = Math.max(0, Math.min(cols - note.length, snapStep(os + dx)));
          note.pitch = Math.max(0, Math.min(PITCH_MAX, Math.round(op - dy)));
        }
        paintRoll();
      }
      function up() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      }
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      paintRoll();
    }
    node.addEventListener("pointerdown", function (ev) {
      if (ev.target === handle) return;
      grab(ev, "move");
    });
    handle.addEventListener("pointerdown", function (ev) {
      grab(ev, "resize");
    });
  }

  function selectedTrack() {
    return state.tracks.find(function (tr) { return tr.id === state.selectedTrackId; }) || state.tracks[0];
  }

  function paintDeviceSel() {
    if (!devicesEl) return;
    var tr = selectedTrack();
    var lab = devicesEl.querySelector("[data-dev-track]");
    if (lab && tr) lab.textContent = tr.name;
  }

  function paintDevices() {
    if (!devicesEl) return;
    var tr = selectedTrack();
    if (!tr) return;
    if (!tr.devices) tr.devices = defaultDevices(tr.kind);
    devicesEl.replaceChildren();
    var head = el("div", "daw-dev");
    head.appendChild(el("div", "daw-dev-h", "Track"));
    var lab = el("div", "daw-strip-name", tr.name);
    lab.setAttribute("data-dev-track", "1");
    lab.style.color = tr.color;
    head.appendChild(lab);
    head.appendChild(el("div", "daw-roll-hint", "Click a mixer strip."));
    devicesEl.appendChild(head);

    function knob(dev, key, label, min, max, step) {
      var wrap = el("label", "daw-ctl");
      wrap.style.flexDirection = "column";
      wrap.appendChild(el("span", "daw-knob-lab", label));
      var inp = document.createElement("input");
      inp.type = "range";
      inp.className = "daw-knob";
      inp.min = String(min);
      inp.max = String(max);
      inp.step = String(step);
      inp.value = String(dev[key]);
      inp.setAttribute("aria-label", label);
      inp.addEventListener("input", function () {
        ensureAudio();
        dev[key] = Number(inp.value);
        applyDevices(tr);
      });
      wrap.appendChild(inp);
      return wrap;
    }

    function box(dev, title, bodyFn) {
      var card = el("div", "daw-dev" + (dev.on ? "" : " off"));
      var h = el("div", "daw-dev-h");
      h.appendChild(document.createTextNode(title));
      var tog = el("button", "daw-btn" + (dev.on ? " on" : ""), dev.on ? "On" : "Off");
      tog.type = "button";
      tog.setAttribute("aria-label", title + " on or off");
      tog.addEventListener("click", function () {
        ensureAudio();
        ctx.resume();
        dev.on = !dev.on;
        applyDevices(tr);
        paintDevices();
      });
      h.appendChild(tog);
      card.appendChild(h);
      bodyFn(card, dev);
      devicesEl.appendChild(card);
    }

    ensureMidiFx(tr);

    function sel(dev, key, label, options) {
      var wrap = el("label", "daw-ctl");
      wrap.style.flexDirection = "column";
      wrap.appendChild(el("span", "daw-knob-lab", label));
      var s = document.createElement("select");
      options.forEach(function (row) {
        var o = document.createElement("option");
        o.value = row[0];
        o.textContent = row[1];
        if (String(dev[key]) === String(row[0])) o.selected = true;
        s.appendChild(o);
      });
      s.addEventListener("change", function () {
        dev[key] = isNaN(Number(s.value)) || s.value === "" ? s.value : (String(Number(s.value)) === s.value ? Number(s.value) : s.value);
      });
      wrap.appendChild(s);
      return wrap;
    }

    var analog = getDevice(tr, "analog");
    box(analog, "Analog", function (card, dev) {
      var waveLab = el("label", "daw-ctl");
      waveLab.appendChild(el("span", "daw-knob-lab", "Wave"));
      var sel = document.createElement("select");
      ["sawtooth", "square", "triangle", "sine"].forEach(function (w) {
        var o = document.createElement("option");
        o.value = w;
        o.textContent = w;
        if (w === dev.wave) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener("change", function () {
        dev.wave = sel.value;
      });
      waveLab.appendChild(sel);
      card.appendChild(waveLab);
      card.appendChild(knob(dev, "cutoff", "Cutoff", 80, 8000, 10));
      card.appendChild(knob(dev, "res", "Res", 0.2, 12, 0.1));
      card.appendChild(knob(dev, "attack", "Attack", 0.001, 0.4, 0.001));
      card.appendChild(knob(dev, "decay", "Decay", 0.05, 1.2, 0.01));
    });

    var sc = getDevice(tr, "scale");
    if (sc) box(sc, "Scale", function (card, dev) {
      card.appendChild(sel(dev, "mode", "Mode", [["minor", "Minor"], ["major", "Major"], ["penta", "Penta"], ["chrom", "Chromatic"]]));
      card.appendChild(sel(dev, "root", "Root", [["0","C"],["1","C#"],["2","D"],["3","D#"],["4","E"],["5","F"],["6","F#"],["7","G"],["8","G#"],["9","A"],["10","A#"],["11","B"]]));
    });

    var chd = getDevice(tr, "chord");
    if (chd) box(chd, "Chord", function (card, dev) {
      card.appendChild(sel(dev, "intervals", "Shape", [["5", "5th"], ["maj", "Maj"], ["min", "Min"], ["sus4", "Sus4"], ["maj7", "Maj7"], ["min7", "Min7"]]));
    });

    var arp = getDevice(tr, "arp");
    if (arp) box(arp, "Arpeggiator", function (card, dev) {
      card.appendChild(sel(dev, "style", "Style", [["up", "Up"], ["down", "Down"], ["updown", "Up/Down"], ["rand", "Random"]]));
      card.appendChild(knob(dev, "rate", "Rate", 1, 4, 1));
      card.appendChild(knob(dev, "oct", "Octaves", 1, 3, 1));
      card.appendChild(knob(dev, "gate", "Gate", 0.15, 1, 0.05));
    });

    var eq = getDevice(tr, "eq");
    box(eq, "EQ Three", function (card, dev) {
      card.appendChild(knob(dev, "low", "Low", -18, 18, 0.1));
      card.appendChild(knob(dev, "mid", "Mid", -18, 18, 0.1));
      card.appendChild(knob(dev, "high", "High", -18, 18, 0.1));
    });

    var comp = getDevice(tr, "comp");
    box(comp, "Compressor", function (card, dev) {
      card.appendChild(knob(dev, "thresh", "Thresh", -40, 0, 0.5));
      card.appendChild(knob(dev, "ratio", "Ratio", 1, 12, 0.1));
      card.appendChild(knob(dev, "attack", "Attack", 0.001, 0.2, 0.001));
      card.appendChild(knob(dev, "release", "Release", 0.02, 0.8, 0.01));
    });

    var del = getDevice(tr, "delay");
    box(del, "Delay", function (card, dev) {
      card.appendChild(knob(dev, "time", "Time", 0.05, 0.9, 0.01));
      card.appendChild(knob(dev, "fb", "Feedback", 0, 0.85, 0.01));
      card.appendChild(knob(dev, "mix", "Mix", 0, 0.9, 0.01));
    });

    ensureAudioFx(tr);
    var afx = getDevice(tr, "auto");
    if (afx) box(afx, "Auto Filter", function (card, dev) {
      card.appendChild(sel(dev, "mode", "Type", [["lowpass", "LP"], ["highpass", "HP"], ["bandpass", "BP"]]));
      card.appendChild(knob(dev, "freq", "Freq", 80, 8000, 10));
      card.appendChild(knob(dev, "res", "Res", 0.2, 14, 0.1));
      card.appendChild(knob(dev, "rate", "LFO", 0.05, 8, 0.05));
      card.appendChild(knob(dev, "amt", "Amt", 0, 4000, 10));
    });

    var cho = getDevice(tr, "chorus");
    if (cho) box(cho, "Chorus", function (card, dev) {
      card.appendChild(knob(dev, "rate", "Rate", 0.05, 8, 0.05));
      card.appendChild(knob(dev, "depth", "Depth", 0.0004, 0.012, 0.0001));
      card.appendChild(knob(dev, "mix", "Mix", 0, 0.9, 0.01));
      card.appendChild(knob(dev, "fb", "Feedback", 0, 0.6, 0.01));
    });

    var ut = getDevice(tr, "util");
    if (ut) box(ut, "Utility", function (card, dev) {
      card.appendChild(knob(dev, "gain", "Gain dB", -18, 12, 0.1));
      card.appendChild(knob(dev, "width", "Width", 0, 2, 0.01));
      var dcBtn = el("button", "daw-btn" + (dev.dc ? " on" : ""), "DC");
      dcBtn.type = "button";
      dcBtn.setAttribute("aria-label", "DC filter");
      dcBtn.addEventListener("click", function () {
        dev.dc = !dev.dc;
        applyDevices(tr);
        paintDevices();
      });
      card.appendChild(dcBtn);
      var invBtn = el("button", "daw-btn" + (dev.invert ? " on" : ""), "Ø");
      invBtn.type = "button";
      invBtn.setAttribute("aria-label", "Phase invert");
      invBtn.addEventListener("click", function () {
        dev.invert = !dev.invert;
        applyDevices(tr);
        paintDevices();
      });
      card.appendChild(invBtn);
    });
  }

  function setView(v) {
    state.view = v;
    if (root) {
      root.classList.toggle("is-arrange", v === "arrange");
      root.classList.toggle("is-roll", v === "roll");
      root.classList.toggle("is-rack", v === "rack");
      root.classList.toggle("is-dev", v === "dev");
      root.classList.toggle("is-warp", v === "warp");
      root.classList.toggle("is-dj", v === "dj");
    }
    root.querySelectorAll("[data-view]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-view") === v);
    });
    root.querySelectorAll("[data-mode]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-mode") === (v === "dj" ? "dj" : "prod"));
    });
    if (v === "arrange") paintArrange();
    if (v === "roll") paintRoll();
    if (v === "rack") paintRack();
    if (v === "dev") paintDevices();
    if (v === "warp") paintWarp();
    if (v === "dj") {
      state.mode = "dj";
      ensureAudio();
      ensureDeckGraph();
      populateIo();
      paintDj();
    } else if (state.mode === "dj") {
      state.mode = "prod";
    }
    paint();
  }

  function paint() {
    if (!gridEl) return;
    paintPlayhead();
    gridEl.querySelectorAll("[data-tr][data-sc]").forEach(function (btn) {
      var tr = state.tracks[Number(btn.dataset.tr)];
      var sc = Number(btn.dataset.sc);
      var c = tr.clips[sc];
      var launched = state.launched[tr.id];
      var queued = state.queued[tr.id];
      btn.classList.toggle("filled", !!c);
      btn.classList.toggle("playing", !!(c && launched === c));
      btn.classList.toggle("queued", !!(c && queued === c) || (queued === "stop" && launched === c));
      btn.classList.toggle("previewing", !!(state.cueing && cueClip && c === cueClip));
      btn.style.setProperty("--clip", c ? c.color : tr.color);
      btn.replaceChildren();
      if (c) {
        btn.appendChild(el("div", "", c.name));
      } else {
        btn.appendChild(el("div", "daw-empty", "·"));
      }
    });
    var playBtn = root && root.querySelector("[data-play]");
    if (playBtn) playBtn.classList.toggle("on", state.playing);
    var punchBtn = root && root.querySelector("[data-punch]");
    if (punchBtn) punchBtn.classList.toggle("on", state.punch);
    var loopBtn = root && root.querySelector("[data-loop]");
    if (loopBtn) loopBtn.classList.toggle("on", state.loopOn);
    var followBtn = root && root.querySelector("[data-follow]");
    if (followBtn) followBtn.classList.toggle("on", state.follow);
    var recBtn = root && root.querySelector("[data-record]");
    if (recBtn) recBtn.classList.toggle("on", state.recording);
    var metroBtn = root && root.querySelector("[data-metro]");
    if (metroBtn) metroBtn.classList.toggle("on", state.metro);
    if (state.view === "arrange") paintArrange();
    if (state.view === "roll") paintRoll();
    if (state.view === "rack") paintRackCursor();
    paintMixer();
    if (devicesEl) paintDeviceSel();
    if (state.view === "warp") paintWarp();
    paintClipEnv();
  }

  function paintMixer() {
    if (!mixerEl) return;
    mixerEl.querySelectorAll("[data-mix-id]").forEach(function (strip) {
      var id = strip.getAttribute("data-mix-id");
      var tr = state.tracks.find(function (x) { return x.id === id; });
      if (!tr) return;
      strip.classList.toggle("sel", tr.id === state.selectedTrackId);
      strip.querySelectorAll("[data-act]").forEach(function (b) {
        var act = b.getAttribute("data-act");
        b.classList.toggle("on", !!tr[act]);
        b.setAttribute("aria-pressed", tr[act] ? "true" : "false");
        if (act === "arm") b.classList.toggle("arm", !!tr.arm);
      });
    });
  }

  function moveGridFocus(code) {
    var active = document.activeElement;
    if (!active || !gridEl || !gridEl.contains(active)) return false;
    var tr = Number(active.dataset.tr);
    var sc = Number(active.dataset.sc);
    if (isNaN(tr) || isNaN(sc)) return false;
    if (code === "ArrowLeft") sc -= 1;
    if (code === "ArrowRight") sc += 1;
    if (code === "ArrowUp") tr -= 1;
    if (code === "ArrowDown") tr += 1;
    if (tr < 0 || tr >= state.tracks.length || sc < 0 || sc >= SCENES) return true;
    var next = gridEl.querySelector('[data-tr="' + tr + '"][data-sc="' + sc + '"]');
    if (next) next.focus();
    return true;
  }

  function rebuildSessionGrid() {
    if (!gridEl) return;
    gridEl.replaceChildren();
    gridEl.setAttribute("role", "grid");
    gridEl.setAttribute("aria-label", "Session clip grid");
    gridEl.style.gridTemplateColumns = "88px repeat(" + SCENES + ", minmax(88px,1fr)) 64px";
    gridEl.appendChild(el("div", "daw-head", "Track"));
    for (var s = 0; s < SCENES; s++) gridEl.appendChild(el("div", "daw-head", "Scene " + (s + 1)));
    gridEl.appendChild(el("div", "daw-head", "Go"));
    state.tracks.forEach(function (tr, ti) {
      var lab = el("div", "daw-track", tr.name);
      lab.style.color = tr.color;
      gridEl.appendChild(lab);
      for (var sc = 0; sc < SCENES; sc++) {
        (function (track, scene) {
          var btn = el("button", "daw-cell");
          btn.type = "button";
          btn.dataset.tr = String(ti);
          btn.dataset.sc = String(scene);
          btn.setAttribute("role", "gridcell");
          btn.setAttribute("aria-label", track.name + " scene " + (scene + 1) + (track.clips[scene] ? " " + track.clips[scene].name : " empty"));
          btn.addEventListener("click", function (ev) { if (ev.shiftKey && track.clips[scene]) { cycleClipColor(track.clips[scene]); return; } if (ev.altKey && track.clips[scene]) { renameClip(track.clips[scene]); return; } if ((ev.ctrlKey || ev.metaKey) && track.clips[scene]) { previewClip(track, track.clips[scene]); return; } queueClip(track, scene); });
          btn.addEventListener("dblclick", function (ev) {
            ev.preventDefault();
            if (track.clips[scene] && track.clips[scene].notes && track.clips[scene].notes.buffer) openWarp(track, track.clips[scene]);
            else if (track.kind === "audio") loadAudioFile(track);
            else if (track.clips[scene]) openRoll(track, track.clips[scene]);
          });
          enableDrop(btn, function () { return { track: track, scene: scene }; });
          gridEl.appendChild(btn);
        })(tr, sc);
      }
      var stopT = el("button", "daw-cell", "■");
      stopT.type = "button";
      stopT.setAttribute("aria-label", "Stop " + tr.name);
      stopT.addEventListener("click", function () {
        state.queued[tr.id] = "stop";
        if (!state.playing) {
          delete state.launched[tr.id];
          stopPad(tr.id);
          stopAudioLoop(tr.id);
        }
        paint();
      });
      gridEl.appendChild(stopT);
    });
    var sceneLab = el("div", "daw-track", "Scene");
    gridEl.appendChild(sceneLab);
    for (var sc2 = 0; sc2 < SCENES; sc2++) {
      (function (scene) {
        var b = el("button", "daw-scene", "▶");
        b.type = "button";
        b.setAttribute("aria-label", "Launch scene " + (scene + 1));
        b.addEventListener("click", function () { launchScene(scene); });
        gridEl.appendChild(b);
      })(sc2);
    }
    gridEl.appendChild(el("div", "", ""));
  }

  function rebuildArrangeLanes() {
    if (!arrangeLanes) return;
    arrangeLanes.replaceChildren();
    state.tracks.forEach(function (tr) {
      var row = el("div", "daw-lane-row");
      var lab = el("div", "daw-lane-lab", tr.name);
      lab.style.color = tr.color;
      var lane = el("div", "daw-lane");
      lane.dataset.track = tr.id;
      lane.addEventListener("click", function (ev) {
        if (ev.target.classList.contains("daw-clip")) return;
        var rect = lane.getBoundingClientRect();
        var bar = Math.floor((ev.clientX - rect.left) / BAR_W);
        dropOnLane(tr, Math.max(0, Math.min(BARS - 1, bar)));
      });
      enableDrop(lane, function () { return { track: tr, scene: 0 }; });
      row.appendChild(lab);
      row.appendChild(lane);
      arrangeLanes.appendChild(row);
      function autoLane(key, label, defV, aria) {
        var arow = el("div", "daw-lane-row");
        arow.style.height = "32px";
        arow.appendChild(el("div", "daw-auto-lab", label));
        var c = document.createElement("canvas");
        c.className = "daw-auto";
        c.dataset.track = tr.id;
        c.dataset.auto = key;
        c.height = 32;
        c.width = BARS * BAR_W;
        c.setAttribute("aria-label", tr.name + " " + aria);
        bindAutoCanvas(c, tr, key, defV);
        arow.appendChild(c);
        arrangeLanes.appendChild(arow);
      }
      autoLane("autoVol", "Vol", 1, "volume automation");
      autoLane("autoPan", "Pan", 0.5, "pan automation");
      autoLane("autoSendA", "Dly", 0, "delay send automation");
      autoLane("autoSendB", "Hall", 0, "hall send automation");
      autoLane("autoCut", "Cut", 1, "filter cutoff automation");
    });
    paintArrange();
  }

  function rebuildMixer() {
    if (!mixerEl) return;
    mixerEl.replaceChildren();
    mixerEl._pendingMeters = {};
    function knob(label, min, max, step, value, onin) {
      var wrap = el("label", "daw-ctl");
      wrap.style.flexDirection = "column";
      wrap.style.gap = "2px";
      wrap.appendChild(el("span", "daw-knob-lab", label));
      var inp = document.createElement("input");
      inp.type = "range";
      inp.className = "daw-knob";
      inp.min = String(min);
      inp.max = String(max);
      inp.step = String(step);
      inp.value = String(value);
      inp.setAttribute("aria-label", label);
      inp.addEventListener("input", function () {
        onin(Number(inp.value));
        applyMix();
      });
      wrap.appendChild(inp);
      return wrap;
    }
    function fader(value, onin, aria) {
      var inp = document.createElement("input");
      inp.type = "range";
      inp.className = "daw-fader";
      inp.min = "0";
      inp.max = "1.2";
      inp.step = "0.01";
      inp.value = String(value);
      inp.setAttribute("aria-label", aria);
      inp.addEventListener("input", function () {
        onin(Number(inp.value));
        applyMix();
      });
      return inp;
    }
    function meter() {
      var m = el("div", "daw-meter");
      var i = document.createElement("i");
      i.setAttribute("aria-hidden", "true");
      m.appendChild(i);
      return { box: m, fill: i };
    }
    state.tracks.forEach(function (tr) {
      var strip = el("div", "daw-strip");
      strip.setAttribute("data-mix-id", tr.id);
      var name = el("div", "daw-strip-name", tr.name);
      name.style.color = tr.color;
      strip.appendChild(name);
      strip.addEventListener("click", function () {
        state.selectedTrackId = tr.id;
        paintMixer();
        paintDevices();
      });
      enableDrop(strip, function () { return { track: tr, scene: 0 }; });
      var tools = el("div", "daw-strip-tools");
      var up = el("button", "daw-btn", "↑");
      up.type = "button";
      up.setAttribute("aria-label", "Move " + tr.name + " earlier");
      up.addEventListener("click", function () { moveTrack(tr.id, -1); });
      var down = el("button", "daw-btn", "↓");
      down.type = "button";
      down.setAttribute("aria-label", "Move " + tr.name + " later");
      down.addEventListener("click", function () { moveTrack(tr.id, 1); });
      var del = el("button", "daw-btn stop", "×");
      del.type = "button";
      del.setAttribute("aria-label", "Remove " + tr.name);
      del.addEventListener("click", function () { removeTrack(tr.id); });
      tools.appendChild(up);
      tools.appendChild(down);
      tools.appendChild(del);
      strip.appendChild(tools);
      var row = el("div", "daw-fader-row");
      var met = meter();
      row.appendChild(met.box);
      row.appendChild(fader(tr.volume, function (v) { tr.volume = v; }, tr.name + " volume"));
      strip.appendChild(row);
      strip.appendChild(knob("Pan", -1, 1, 0.01, tr.pan, function (v) { tr.pan = v; }));
      strip.appendChild(knob("Delay", 0, 1, 0.01, tr.sendA, function (v) { tr.sendA = v; }));
      strip.appendChild(knob("Hall", 0, 1, 0.01, tr.sendB, function (v) { tr.sendB = v; }));
      var mini = el("div", "daw-mini");
      [["mute", "M"], ["solo", "S"], ["arm", "A"], ["pfl", "C"]].forEach(function (pair) {
        var b = el("button", "daw-btn", pair[1]);
        b.type = "button";
        b.setAttribute("data-act", pair[0]);
        b.setAttribute("aria-label", tr.name + " " + pair[0]);
        b.addEventListener("click", function () {
          ensureAudio();
          tr[pair[0]] = !tr[pair[0]];
          applyMix();
        });
        mini.appendChild(b);
      });
      if (tr.kind === "audio") {
        var load = el("button", "daw-btn", "Load");
        load.type = "button";
        load.setAttribute("aria-label", "Load audio onto " + tr.name);
        load.addEventListener("click", function () { loadAudioFile(tr); });
        mini.appendChild(load);
      }
      var xfRow = el("div", "daw-mini");
      [["A", "A"], ["B", "B"]].forEach(function (pair) {
        var b = el("button", "daw-btn", pair[1]);
        b.type = "button";
        b.setAttribute("data-xf", pair[0]);
        b.setAttribute("aria-label", tr.name + " crossfader " + pair[1]);
        b.classList.toggle("on", tr.xf === pair[0]);
        b.addEventListener("click", function () {
          tr.xf = tr.xf === pair[0] ? "" : pair[0];
          applyMix();
          rebuildMixer();
        });
        xfRow.appendChild(b);
      });
      strip.appendChild(xfRow);
      strip.appendChild(mini);
      mixerEl.appendChild(strip);
      if (trackGraph[tr.id]) trackGraph[tr.id].meter = met.fill;
      else mixerEl._pendingMeters[tr.id] = met.fill;
    });
    function retStrip(title, key, aria) {
      var strip = el("div", "daw-strip ret");
      strip.appendChild(el("div", "daw-strip-name", title));
      var row = el("div", "daw-fader-row");
      row.appendChild(fader(state[key], function (v) { state[key] = v; }, aria));
      strip.appendChild(row);
      mixerEl.appendChild(strip);
    }
    retStrip("Delay", "returnAVol", "Delay return");
    retStrip("Hall", "returnBVol", "Hall return");
    extraReturns.forEach(function (ret) {
      var strip = el("div", "daw-strip ret");
      strip.appendChild(el("div", "daw-strip-name", ret.name));
      var row = el("div", "daw-fader-row");
      row.appendChild(fader(ret.volume, function (v) {
        ret.volume = v;
        if (ret.gain && ctx) ret.gain.gain.setTargetAtTime(v, ctx.currentTime, 0.01);
      }, ret.name + " volume"));
      strip.appendChild(row);
      mixerEl.appendChild(strip);
    });
    var masterStrip = el("div", "daw-strip master");
    masterStrip.appendChild(el("div", "daw-strip-name", "Master"));
    var mrow = el("div", "daw-fader-row");
    var mm = meter();
    mm.fill.setAttribute("data-master-meter", "1");
    mrow.appendChild(mm.box);
    mrow.appendChild(fader(state.masterVol, function (v) { state.masterVol = v; }, "Master volume"));
    masterStrip.appendChild(mrow);
    var xfWrap = el("label", "daw-ctl");
    xfWrap.appendChild(el("span", "daw-knob-lab", "X-Fade A|B"));
    var xfIn = document.createElement("input");
    xfIn.type = "range";
    xfIn.className = "daw-xfade";
    xfIn.min = "0";
    xfIn.max = "1";
    xfIn.step = "0.01";
    xfIn.value = String(state.xfade == null ? 0.5 : state.xfade);
    xfIn.setAttribute("aria-label", "Crossfader A to B");
    xfIn.addEventListener("input", function () {
      state.xfade = Number(xfIn.value);
      applyXfade();
    });
    xfWrap.appendChild(xfIn);
    masterStrip.appendChild(xfWrap);
    masterStrip.appendChild(knob("Cue", 0, 1.2, 0.01, state.cueVol == null ? 0.8 : state.cueVol, function (v) { state.cueVol = v; }));
    mixerEl.appendChild(masterStrip);
  }

  function rebuildTrackUi() {
    rebuildSessionGrid();
    rebuildArrangeLanes();
    rebuildMixer();
    paint();
  }

  function build() {
    var music = document.getElementById("music-view");
    if (!music || document.getElementById("daw-session")) return;
    injectStyles();
    music.classList.add("is-daw");
    document.body.classList.add("is-music-daw");
    if (!music._dawObs) {
      music._dawObs = new MutationObserver(function () {
        document.body.classList.toggle("is-music-daw", !music.hidden);
        if (music.hidden) stopMeters();
        else startMeters();
      });
      music._dawObs.observe(music, { attributes: true, attributeFilter: ["hidden"] });
    }
    document.addEventListener("visibilitychange", function () {
      if (dawOnScreen()) startMeters();
      else stopMeters();
    });

    root = el("section", "");
    root.id = "daw-session";
    root.setAttribute("aria-label", "Session and arrangement");

    var top = el("div", "daw-top");
    top.setAttribute("role", "toolbar");
    top.setAttribute("aria-label", "Transport");
    top.appendChild(el("div", "daw-brand", "Live"));
    posEl = el("div", "daw-pos", "1.1.1");
    top.appendChild(posEl);

    function viewBtn(id, label) {
      var b = el("button", "daw-btn" + (id === "session" ? " on" : ""), label);
      b.type = "button";
      b.setAttribute("data-view", id);
      b.setAttribute("aria-label", label + " view");
      b.addEventListener("click", function () {
        setView(id);
      });
      return b;
    }
    function modeBtn(id, label) {
      var b = el("button", "daw-btn" + (id === "prod" ? " on" : ""), label);
      b.type = "button";
      b.setAttribute("data-mode", id);
      b.setAttribute("aria-label", label + " section");
      b.addEventListener("click", function () {
        if (id === "dj") setView("dj");
        else if (state.view === "dj") setView("session");
        else setMode(id);
        root.querySelectorAll("[data-mode]").forEach(function (x) {
          x.classList.toggle("on", x.getAttribute("data-mode") === id);
        });
      });
      return b;
    }
    top.appendChild(modeBtn("prod", "Production"));
    top.appendChild(modeBtn("dj", "DJ Live"));
    var prodViews = el("span", "daw-prod-views");
    prodViews.appendChild(viewBtn("session", "Session"));
    prodViews.appendChild(viewBtn("arrange", "Arrange"));
    prodViews.appendChild(viewBtn("roll", "Roll"));
    prodViews.appendChild(viewBtn("rack", "Rack"));
    prodViews.appendChild(viewBtn("dev", "Dev"));
    prodViews.appendChild(viewBtn("warp", "Warp"));
    top.appendChild(prodViews);

    var play = el("button", "daw-btn", "Play");
    play.setAttribute("data-play", "1");
    play.setAttribute("aria-label", "Play");
    play.addEventListener("click", function () {
      if (state.playing) return;
      startTransport();
    });
    var stop = el("button", "daw-btn stop", "Stop");
    stop.setAttribute("aria-label", "Stop");
    stop.addEventListener("click", stopTransport);
    top.appendChild(play);
    top.appendChild(stop);
    var cueBtn = el("button", "daw-btn", "Cue");
    cueBtn.type = "button";
    cueBtn.setAttribute("data-cue", "1");
    cueBtn.setAttribute("aria-label", "Preview selected clip on cue");
    cueBtn.addEventListener("click", function () { previewClip(); });
    top.appendChild(cueBtn);
    top.appendChild(el("span", "daw-knob-lab", "A|B"));
    var xfTop = document.createElement("input");
    xfTop.type = "range";
    xfTop.className = "daw-xfade";
    xfTop.min = "0";
    xfTop.max = "1";
    xfTop.step = "0.01";
    xfTop.value = String(state.xfade == null ? 0.5 : state.xfade);
    xfTop.setAttribute("aria-label", "Crossfader A to B");
    xfTop.addEventListener("input", function () {
      state.xfade = Number(xfTop.value);
      applyXfade();
    });
    top.appendChild(xfTop);

    var rec = el("button", "daw-btn rec", "Record");
    rec.type = "button";
    rec.setAttribute("data-record", "1");
    rec.setAttribute("aria-label", "Record");
    rec.addEventListener("click", armRecord);
    top.appendChild(rec);

    var metro = el("button", "daw-btn", "Metro");
    metro.type = "button";
    metro.setAttribute("data-metro", "1");
    metro.setAttribute("aria-label", "Metronome");
    metro.addEventListener("click", function () {
      state.metro = !state.metro;
      if (state.metro) {
        ensureAudio();
        ctx.resume();
      }
      paint();
    });
    top.appendChild(metro);

    var tap = el("button", "daw-btn", "Tap");
    tap.type = "button";
    tap.setAttribute("aria-label", "Tap tempo");
    tap.addEventListener("click", tapTempo);
    top.appendChild(tap);

    midiLabel = el("div", "daw-pos", "Keys A–L");
    midiLabel.setAttribute("aria-label", "MIDI status");
    top.appendChild(midiLabel);
    var oct = el("button", "daw-btn", "Oct " + midiOctave);
    oct.type = "button";
    oct.setAttribute("aria-label", "Keyboard octave");
    oct.addEventListener("click", function () {
      midiOctave = (midiOctave + 1) % 6;
      oct.textContent = "Oct " + midiOctave;
    });
    top.appendChild(oct);
    var learn = el("button", "daw-btn", "Learn");
    learn.type = "button";
    learn.setAttribute("aria-label", "MIDI learn");
    learn.addEventListener("click", function () {
      if (state.view === "dj" && djEl) {
        var sel = djEl.querySelector("[data-dj-learn]");
        midiLearn = (sel && sel.value) || "xfade";
        learn.classList.add("on");
        setMidiLabel("Move hardware for " + midiLearn);
        window.setTimeout(function () { learn.classList.remove("on"); }, 5000);
        return;
      }
      var tr = selectedTrack();
      midiLearn = tr && (tr.kind === "drums" || tr.kind === "perc") ? "pad" : "cutoff";
      learn.classList.add("on");
      setMidiLabel(midiLearn === "pad" ? "Learn pad: hit MIDI key" : "Learn: move CC for cutoff");
      window.setTimeout(function () { learn.classList.remove("on"); }, 4000);
    });
    top.appendChild(learn);

    var saveBtn = el("button", "daw-btn", "Save");
    saveBtn.type = "button";
    saveBtn.setAttribute("aria-label", "Save project");
    saveBtn.addEventListener("click", saveProject);
    top.appendChild(saveBtn);
    var loadBtn = el("button", "daw-btn", "Load");
    loadBtn.type = "button";
    loadBtn.setAttribute("aria-label", "Load project");
    loadBtn.addEventListener("click", loadProjectFile);
    top.appendChild(loadBtn);

    var tsLab = el("label", "daw-ctl");
    tsLab.appendChild(document.createTextNode("Sig"));
    var ts = document.createElement("select");
    [
      [4, 4, "4/4"],
      [3, 4, "3/4"],
      [5, 4, "5/4"],
      [6, 8, "6/8"],
      [7, 8, "7/8"],
    ].forEach(function (row) {
      var o = document.createElement("option");
      o.value = row[0] + "/" + row[1];
      o.textContent = row[2];
      if (row[0] === state.timeNum && row[1] === state.timeDen) o.selected = true;
      ts.appendChild(o);
    });
    ts.addEventListener("change", function () {
      var parts = ts.value.split("/");
      state.timeNum = Number(parts[0]) || 4;
      state.timeDen = Number(parts[1]) || 4;
      paintPlayhead();
    });
    tsLab.appendChild(ts);
    top.appendChild(tsLab);

    var bpmLab = el("label", "daw-ctl");
    bpmLab.appendChild(document.createTextNode("BPM"));
    var bpm = document.createElement("input");
    bpm.type = "number";
    bpm.min = "40";
    bpm.max = "240";
    bpm.value = String(state.bpm);
    bpmInput = bpm;
    bpm.addEventListener("change", function () {
      state.bpm = Math.min(240, Math.max(40, Number(bpm.value) || 112));
    });
    bpmLab.appendChild(bpm);
    top.appendChild(bpmLab);

    var qLab = el("label", "daw-ctl");
    qLab.appendChild(document.createTextNode("Quantize"));
    var q = document.createElement("select");
    [
      [0, "None"],
      [1, "1/16"],
      [4, "Beat"],
      [16, "Bar"],
    ].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = String(pair[0]);
      o.textContent = pair[1];
      if (pair[0] === state.quantize) o.selected = true;
      q.appendChild(o);
    });
    q.addEventListener("change", function () {
      state.quantize = Number(q.value);
    });
    qLab.appendChild(q);
    top.appendChild(qLab);

    var swingLab = el("label", "daw-ctl");
    swingLab.appendChild(document.createTextNode("Swing"));
    var swing = document.createElement("input");
    swing.type = "range";
    swing.min = "0";
    swing.max = "75";
    swing.step = "1";
    swing.value = String(Math.round((state.swing || 0) * 100));
    swing.setAttribute("aria-label", "Swing amount");
    swing.className = "daw-knob";
    var swingVal = el("span", "daw-pos", Math.round((state.swing || 0) * 100) + "%");
    swing.addEventListener("input", function () {
      state.swing = Number(swing.value) / 100;
      swingVal.textContent = swing.value + "%";
    });
    swingLab.appendChild(swing);
    swingLab.appendChild(swingVal);
    top.appendChild(swingLab);
    window._dawSwingUi = function () {
      swing.value = String(Math.round((state.swing || 0) * 100));
      swingVal.textContent = swing.value + "%";
    };

    function tog(key, label, attr) {
      var b = el("button", "daw-btn" + (state[key] ? " on" : ""), label);
      b.type = "button";
      b.setAttribute(attr, "1");
      b.addEventListener("click", function () {
        state[key] = !state[key];
        paint();
      });
      top.appendChild(b);
    }
    tog("loopOn", "Loop", "data-loop");
    tog("punch", "Punch", "data-punch");
    tog("follow", "Follow", "data-follow");
    var locBtn = el("button", "daw-btn", "Set loc");
    locBtn.type = "button";
    locBtn.setAttribute("aria-label", "Set locator at playhead");
    locBtn.addEventListener("click", function () { addLocator(); });
    top.appendChild(locBtn);

    var addMidi = el("button", "daw-btn", "+ MIDI");
    addMidi.type = "button";
    addMidi.setAttribute("aria-label", "Add MIDI track");
    addMidi.addEventListener("click", function () { addTrack("midi"); });
    var addAud = el("button", "daw-btn", "+ Audio");
    addAud.type = "button";
    addAud.setAttribute("aria-label", "Add audio track");
    addAud.addEventListener("click", function () { addTrack("audio"); });
    var addRet = el("button", "daw-btn", "+ Return");
    addRet.type = "button";
    addRet.setAttribute("aria-label", "Add return track");
    addRet.addEventListener("click", addReturn);
    top.appendChild(addMidi);
    top.appendChild(addAud);
    top.appendChild(addRet);

    root.appendChild(top);
    liveEl = el("div", "daw-live");
    liveEl.setAttribute("aria-live", "polite");
    liveEl.setAttribute("aria-atomic", "true");
    root.appendChild(liveEl);

    browserEl = el("aside", "daw-browser");
    browserEl.setAttribute("aria-label", "Browser");
    root.appendChild(browserEl);
    paintBrowser();

    warpEl = el("div", "daw-warp");
    warpEl.setAttribute("aria-label", "Warp");
    var wtop = el("div", "daw-warp-top");
    warpTitle = el("div", "daw-brand", "Warp");
    wtop.appendChild(warpTitle);
    var tools = el("div", "daw-warp-top");
    tools.setAttribute("data-warp-tools", "1");
    var onBtn = el("button", "daw-btn on", "Warp");
    onBtn.type = "button";
    onBtn.setAttribute("data-warpon", "1");
    onBtn.setAttribute("aria-label", "Toggle warp");
    onBtn.addEventListener("click", function () {
      var pair = activeWarpClip();
      if (!pair) return;
      pair.clip.notes.warpOn = !pair.clip.notes.warpOn;
      paintWarp();
    });
    tools.appendChild(onBtn);
    var modeLab = el("label", "daw-ctl");
    modeLab.appendChild(document.createTextNode("Mode"));
    var mode = document.createElement("select");
    mode.setAttribute("data-wmode", "1");
    [["beats", "Beats"], ["tones", "Tones"], ["texture", "Texture"], ["re-pitch", "Re-Pitch"]].forEach(function (row) {
      var o = document.createElement("option");
      o.value = row[0];
      o.textContent = row[1];
      mode.appendChild(o);
    });
    mode.addEventListener("change", function () {
      var pair = activeWarpClip();
      if (!pair) return;
      pair.clip.notes.warpMode = mode.value;
    });
    modeLab.appendChild(mode);
    tools.appendChild(modeLab);
    var gainLab = el("label", "daw-ctl");
    gainLab.appendChild(document.createTextNode("Gain"));
    var gain = document.createElement("input");
    gain.type = "range";
    gain.min = "0";
    gain.max = "1.4";
    gain.step = "0.01";
    gain.setAttribute("data-cgain", "1");
    gain.setAttribute("aria-label", "Clip gain");
    gain.addEventListener("input", function () {
      var pair = activeWarpClip();
      if (!pair) return;
      pair.clip.notes.gain = Number(gain.value);
    });
    gainLab.appendChild(gain);
    tools.appendChild(gainLab);
    bindClipXform(tools);
    function fadeSlider(key, label) {
      var lab = el("label", "daw-ctl");
      lab.appendChild(document.createTextNode(label));
      var inp = document.createElement("input");
      inp.type = "range";
      inp.min = "0";
      inp.max = "8";
      inp.step = "1";
      inp.value = "0";
      inp.setAttribute("data-" + key, "1");
      inp.setAttribute("aria-label", label);
      inp.addEventListener("input", function () {
        var pair = activeWarpClip() || (state.selectedSession && state.selectedSession.clip && state.selectedSession);
        var clip = pair && pair.clip;
        if (!clip) return;
        if (!clip.notes) clip.notes = {};
        clip.notes[key] = Number(inp.value) || 0;
        paintArrange();
      });
      lab.appendChild(inp);
      tools.appendChild(lab);
    }
    fadeSlider("fadeIn", "Fade in");
    fadeSlider("fadeOut", "Fade out");
    wtop.appendChild(tools);
    warpEl.appendChild(wtop);
    warpCanvas = document.createElement("canvas");
    warpCanvas.className = "daw-wave";
    warpCanvas.width = 720;
    warpCanvas.height = 140;
    warpCanvas.setAttribute("aria-label", "Warp waveform");
    warpCanvas.addEventListener("pointerdown", function (ev) {
      var pair = activeWarpClip();
      if (!pair) return;
      var rect = warpCanvas.getBoundingClientRect();
      var x = ev.clientX - rect.left;
      var beats = clipBeats(pair.clip);
      var beat = Math.max(0, Math.min(beats, (x / rect.width) * beats));
      var markers = ensureMarkers(pair.clip);
      var hit = null;
      markers.forEach(function (m) {
        var mx = (m.beat / beats) * rect.width;
        if (Math.abs(mx - x) < 8) hit = m;
      });
      if (hit && (ev.altKey || ev.shiftKey) && hit !== markers[0] && hit !== markers[markers.length - 1]) {
        pair.clip.notes.markers = markers.filter(function (m) { return m.id !== hit.id; });
        paintWarp();
        return;
      }
      if (hit) {
        function move(e) {
          var r = warpCanvas.getBoundingClientRect();
          var nx = e.clientX - r.left;
          var nb = Math.max(0.05, Math.min(beats - 0.05, (nx / r.width) * beats));
          if (ev.altKey) {
            var dur = pair.clip.notes.buffer.duration;
            hit.time = Math.max(0, Math.min(dur, (nx / r.width) * dur));
          } else {
            hit.beat = nb;
          }
          markers.sort(function (a, b) { return a.beat - b.beat; });
          paintWarp();
        }
        function up() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        return;
      }
      markers.push({ id: "w" + markerSeq++, beat: beat, time: timeAtBeat(markers, beat) });
      markers.sort(function (a, b) { return a.beat - b.beat; });
      paintWarp();
    });
    warpEl.appendChild(warpCanvas);
    warpEl.appendChild(el("div", "daw-roll-hint", "Warp locks the sample to tempo. Beats keeps pitch and gates slices. Re-Pitch stretches and changes pitch. Tones/Texture grain-stretch. Drag a marker to move it on the grid, Alt-drag to slide the sample time, Alt-click to delete. Gain is clip volume."));
    root.appendChild(warpEl);

    sessionPanel = el("div", "daw-session-panel");
    var wrap = el("div", "daw-grid-wrap");
    gridEl = el("div", "daw-grid");
    gridEl.style.gridTemplateColumns = "88px repeat(" + SCENES + ", minmax(88px,1fr)) 64px";

    gridEl.appendChild(el("div", "daw-head", "Track"));
    for (var s = 0; s < SCENES; s++) gridEl.appendChild(el("div", "daw-head", "Scene " + (s + 1)));
    gridEl.appendChild(el("div", "daw-head", "Go"));

    state.tracks.forEach(function (tr, ti) {
      var lab = el("div", "daw-track", tr.name);
      lab.style.color = tr.color;
      gridEl.appendChild(lab);
      for (var sc = 0; sc < SCENES; sc++) {
        (function (track, scene) {
          var btn = el("button", "daw-cell");
          btn.type = "button";
          btn.dataset.tr = String(ti);
          btn.dataset.sc = String(scene);
          btn.setAttribute("role", "gridcell");
          btn.setAttribute("aria-label", track.name + " scene " + (scene + 1) + (track.clips[scene] ? " " + track.clips[scene].name : " empty"));
          btn.addEventListener("click", function (ev) {
            if (ev.shiftKey && track.clips[scene]) { cycleClipColor(track.clips[scene]); return; }
            if (ev.altKey && track.clips[scene]) { renameClip(track.clips[scene]); return; }
            if ((ev.ctrlKey || ev.metaKey) && track.clips[scene]) { previewClip(track, track.clips[scene]); return; }
            queueClip(track, scene);
          });
          btn.addEventListener("dblclick", function (ev) {
            ev.preventDefault();
            if (track.clips[scene] && track.clips[scene].notes && track.clips[scene].notes.buffer) openWarp(track, track.clips[scene]);
            else if (track.kind === "audio") loadAudioFile(track);
            else if (track.clips[scene]) openRoll(track, track.clips[scene]);
          });
          enableDrop(btn, function () { return { track: track, scene: scene }; });
          gridEl.appendChild(btn);
        })(tr, sc);
      }
      var stopT = el("button", "daw-cell", "■");
      stopT.type = "button";
      stopT.setAttribute("aria-label", "Stop " + tr.name);
      stopT.addEventListener("click", function () {
        state.queued[tr.id] = "stop";
        if (!state.playing) {
          delete state.launched[tr.id];
          stopPad(tr.id);
        }
        paint();
      });
      gridEl.appendChild(stopT);
    });

    var sceneLab = el("div", "daw-track", "Scene");
    gridEl.appendChild(sceneLab);
    for (var sc2 = 0; sc2 < SCENES; sc2++) {
      (function (scene) {
        var b = el("button", "daw-scene", "▶");
        b.type = "button";
        b.setAttribute("aria-label", "Launch scene " + (scene + 1));
        b.addEventListener("click", function () {
          launchScene(scene);
        });
        gridEl.appendChild(b);
      })(sc2);
    }
    gridEl.appendChild(el("div", "", ""));
    wrap.appendChild(gridEl);
    sessionPanel.appendChild(wrap);
    sessionPanel.appendChild(el("div", "daw-hint", "Launch clips on the grid. They wait for the next bar, then play."));
    root.appendChild(sessionPanel);

    envEl = el("div", "daw-env");
    envEl.setAttribute("aria-label", "Clip volume envelope");
    envTitle = el("div", "daw-brand", "Clip envelope");
    envEl.appendChild(envTitle);
    envCanvas = document.createElement("canvas");
    envCanvas.width = 640;
    envCanvas.height = 64;
    envCanvas.setAttribute("aria-label", "Clip volume envelope");
    bindClipEnvCanvas(envCanvas);
    envEl.appendChild(envCanvas);
    envEl.appendChild(el("div", "daw-roll-hint", "Volume envelope for the selected clip. Click to add a point, drag to shape, Alt-click to delete. It actually changes clip level as it plays."));
    root.appendChild(envEl);

    rollEl = el("div", "daw-roll");
    rollEl.setAttribute("aria-label", "Piano roll");
    var rtop = el("div", "daw-roll-top");
    rollTitle = el("div", "daw-brand", "Piano roll");
    rtop.appendChild(rollTitle);
    var snapLab = el("label", "daw-ctl");
    snapLab.appendChild(document.createTextNode("Snap"));
    var snap = document.createElement("select");
    [[1, "1/16"], [2, "1/8"], [4, "1/4"]].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = String(pair[0]);
      o.textContent = pair[1];
      if (pair[0] === state.rollSnap) o.selected = true;
      snap.appendChild(o);
    });
    snap.addEventListener("change", function () {
      state.rollSnap = Number(snap.value) || 1;
    });
    snapLab.appendChild(snap);
    rtop.appendChild(snapLab);
    var scLab = el("label", "daw-ctl");
    scLab.appendChild(document.createTextNode("Scale"));
    var scSel = document.createElement("select");
    [["minor", "A minor"], ["major", "A major"], ["penta", "A penta"], ["chrom", "Chromatic"]].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      if (pair[0] === state.rollScale) o.selected = true;
      scSel.appendChild(o);
    });
    scSel.addEventListener("change", function () {
      state.rollScale = scSel.value;
      paintRoll();
    });
    scLab.appendChild(scSel);
    rtop.appendChild(scLab);
    var velLab = el("label", "daw-ctl");
    velLab.appendChild(document.createTextNode("Vel"));
    var velInp = document.createElement("input");
    velInp.type = "range";
    velInp.min = "0.05";
    velInp.max = "1";
    velInp.step = "0.01";
    velInp.value = "0.85";
    velInp.setAttribute("aria-label", "Note velocity");
    velInp.addEventListener("input", function () {
      var n = getSelectedNote();
      if (!n) return;
      n.vel = Number(velInp.value);
      paintRoll();
    });
    velLab.appendChild(velInp);
    rtop.appendChild(velLab);
    rollEl._velInp = velInp;
    bindClipXform(rtop);
    rollEl.appendChild(rtop);
    var body = el("div", "daw-roll-body");
    rollKeys = el("div", "daw-keys");
    rollGrid = el("div", "daw-roll-grid");
    body.appendChild(rollKeys);
    body.appendChild(rollGrid);
    rollEl.appendChild(body);
    rollVel = el("div", "daw-vel");
    rollEl.appendChild(rollVel);
    rollEl.appendChild(el("div", "daw-roll-hint", "Double-click a clip to edit. Draw notes, drag to move, pull the right edge to resize. Scale rows glow."));
    root.appendChild(rollEl);

    rackEl = el("div", "daw-rack");
    rackEl.setAttribute("aria-label", "Drum rack");
    var rktop = el("div", "daw-rack-top");
    rackTitle = el("div", "daw-brand", "Drum rack");
    rktop.appendChild(rackTitle);
    var tools = el("div", "daw-rack-top");
    tools.setAttribute("data-rack-tools", "1");
    var chokeLab = el("label", "daw-ctl");
    chokeLab.appendChild(document.createTextNode("Choke"));
    var chokeSel = document.createElement("select");
    chokeSel.setAttribute("data-choke", "1");
    [["0", "Off"], ["1", "Hats"], ["2", "Toms"]].forEach(function (pair) {
      var o = document.createElement("option");
      o.value = pair[0];
      o.textContent = pair[1];
      chokeSel.appendChild(o);
    });
    chokeSel.addEventListener("change", function () {
      var pair = activeRackPair();
      if (!pair) return;
      var pad = pair.track.rack.pads.find(function (p) { return p.id === state.selectedPad; });
      if (!pad) return;
      pad.choke = Number(chokeSel.value) || 0;
    });
    chokeLab.appendChild(chokeSel);
    tools.appendChild(chokeLab);
    var gainLab = el("label", "daw-ctl");
    gainLab.appendChild(document.createTextNode("Gain"));
    var gainInp = document.createElement("input");
    gainInp.type = "range";
    gainInp.min = "0";
    gainInp.max = "1.2";
    gainInp.step = "0.01";
    gainInp.setAttribute("data-pgain", "1");
    gainInp.setAttribute("aria-label", "Pad gain");
    gainInp.addEventListener("input", function () {
      var pair = activeRackPair();
      if (!pair) return;
      var pad = pair.track.rack.pads.find(function (p) { return p.id === state.selectedPad; });
      if (!pad) return;
      pad.gain = Number(gainInp.value);
    });
    gainLab.appendChild(gainInp);
    tools.appendChild(gainLab);
    var decLab = el("label", "daw-ctl");
    decLab.appendChild(document.createTextNode("Decay"));
    var decInp = document.createElement("input");
    decInp.type = "range";
    decInp.min = "0.05";
    decInp.max = "2";
    decInp.step = "0.01";
    decInp.setAttribute("data-pdecay", "1");
    decInp.setAttribute("aria-label", "Pad decay");
    decInp.addEventListener("input", function () {
      var pair = activeRackPair();
      if (!pair) return;
      var pad = pair.track.rack.pads.find(function (p) { return p.id === state.selectedPad; });
      if (!pad) return;
      pad.decay = Number(decInp.value);
    });
    decLab.appendChild(decInp);
    tools.appendChild(decLab);
    var loadBtn = el("button", "daw-btn", "Sample");
    loadBtn.type = "button";
    loadBtn.setAttribute("aria-label", "Load sample onto pad");
    loadBtn.addEventListener("click", function () {
      var pair = activeRackPair();
      if (!pair) return;
      var pad = pair.track.rack.pads.find(function (p) { return p.id === state.selectedPad; });
      if (pad) loadPadSample(pair.track, pad);
    });
    tools.appendChild(loadBtn);
    var clearBtn = el("button", "daw-btn", "Synth");
    clearBtn.type = "button";
    clearBtn.setAttribute("aria-label", "Use built-in synth on pad");
    clearBtn.addEventListener("click", function () {
      var pair = activeRackPair();
      if (!pair) return;
      var pad = pair.track.rack.pads.find(function (p) { return p.id === state.selectedPad; });
      if (!pad) return;
      pad.buffer = null;
      paintRack();
      ensureAudio();
      ctx.resume();
      trigRackPad(pair.track, pad, ctx.currentTime, 1);
    });
    tools.appendChild(clearBtn);
    rktop.appendChild(tools);
    rackEl.appendChild(rktop);
    rackPadsEl = el("div", "daw-pads");
    rackEl.appendChild(rackPadsEl);
    rackStepsEl = el("div", "daw-steps");
    rackEl.appendChild(rackStepsEl);
    rackEl.appendChild(el("div", "daw-roll-hint", "Hit a pad to play. Draw the 16-step grid — it locks to the transport. Hats share choke group 1 so open/closed cut each other. Double-click a pad or Sample to drop in a file."));
    root.appendChild(rackEl);

    arrangePanel = el("div", "daw-arrange");
    arrangePanel.setAttribute("aria-label", "Arrangement view");
    arrangeScroll = el("div", "daw-arr-scroll");
    var inner = el("div", "daw-arr-inner");

    rulerEl = el("div", "daw-ruler");
    var ruler = rulerEl;
    for (var b = 0; b < BARS; b++) {
      (function (bar) {
        var tick = el("div", "daw-bar", String(bar + 1));
        tick.addEventListener("click", function () {
          jumpToStep(bar * STEPS_PER_BAR);
        });
        tick.addEventListener("dblclick", function (ev) {
          ev.preventDefault();
          addLocator(bar);
        });
        ruler.appendChild(tick);
      })(b);
    }
    loopEl = el("div", "daw-loop");
    var h1 = el("div", "daw-loop-h");
    var h2 = el("div", "daw-loop-h");
    h1.style.left = "0";
    h2.style.right = "0";
    function dragHandle(handle, which) {
      handle.addEventListener("pointerdown", function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        function move(e) {
          var rect = ruler.getBoundingClientRect();
          var bar = Math.round((e.clientX - rect.left) / BAR_W);
          bar = Math.max(0, Math.min(BARS, bar));
          if (which === "start") state.loopStart = Math.min(bar, state.loopEnd - 1);
          else state.loopEnd = Math.max(bar, state.loopStart + 1);
          paintArrange();
        }
        function up() {
          window.removeEventListener("pointermove", move);
          window.removeEventListener("pointerup", up);
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
      });
    }
    dragHandle(h1, "start");
    dragHandle(h2, "end");
    loopEl.appendChild(h1);
    loopEl.appendChild(h2);
    inner.appendChild(ruler);
    inner.appendChild(loopEl);

    playheadEl = el("div", "daw-playhead");
    inner.appendChild(playheadEl);

    arrangeLanes = el("div", "daw-lanes");
    state.tracks.forEach(function (tr) {
      var row = el("div", "daw-lane-row");
      var lab = el("div", "daw-lane-lab", tr.name);
      lab.style.color = tr.color;
      var lane = el("div", "daw-lane");
      lane.dataset.track = tr.id;
      lane.addEventListener("click", function (ev) {
        if (ev.target.classList.contains("daw-clip")) return;
        var rect = lane.getBoundingClientRect();
        var bar = Math.floor((ev.clientX - rect.left) / BAR_W);
        dropOnLane(tr, Math.max(0, Math.min(BARS - 1, bar)));
      });
      enableDrop(lane, function () { return { track: tr, scene: 0 }; });
      row.appendChild(lab);
      row.appendChild(lane);
      arrangeLanes.appendChild(row);
    });
    inner.appendChild(arrangeLanes);
    arrangeScroll.appendChild(inner);
    arrangePanel.appendChild(arrangeScroll);
    arrangePanel.appendChild(
      el(
        "div",
        "daw-hint",
        "A song is already laid on the timeline. Drag clips, drag the loop brace, enable Punch to print Session clips onto the arrangement as it plays.",
      ),
    );
    root.appendChild(arrangePanel);

    mixerEl = el("div", "daw-mixer");
    mixerEl.setAttribute("aria-label", "Mixer");
    rebuildMixer();
    root.appendChild(mixerEl);

    root.appendChild(buildDjPanel());

    devicesEl = el("div", "daw-devices");
    devicesEl.setAttribute("aria-label", "Devices");
    root.appendChild(devicesEl);
    paintDevices();

    root.appendChild(el("div", "daw-help", "Ctrl+click a clip to cue it (hear without launching). C on a mixer strip is PFL — muted tracks still reach Cue. Cue fader is independent of Master. Arrows move the grid. Shift+1–8 launch scenes. Ctrl+D duplicates. Ctrl+E splits at playhead. Clip corners resize. Ctrl+L loop. Drag the cyan brace to set loop length. Green grip sets loop start. F2 rename. Shift+click color. Double-click ruler for a locator. Drag locators to move them. Arrows nudge. Comma/period jump. Alt-drag clip for gain. R reverses. +/- transpose. Ctrl+Z undo. Escape stops."));

    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (typing) return;
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyZ") {
        e.preventDefault();
        if (e.shiftKey) redoEdit();
        else undoEdit();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyY") {
        e.preventDefault();
        redoEdit();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyD") {
        e.preventDefault();
        duplicateSelectedClip();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyE") {
        e.preventDefault();
        splitSelectedArrange();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.code === "KeyL") {
        e.preventDefault();
        toggleClipLoop();
        return;
      }
      if (e.code === "F2") {
        e.preventDefault();
        renameClip();
        return;
      }
      if (e.shiftKey && e.code === "KeyC" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        cycleClipColor();
        return;
      }
      if (e.shiftKey && e.code.indexOf("Digit") === 0) {
        var sceneN = Number(e.code.slice(5));
        if (sceneN >= 1 && sceneN <= SCENES) {
          e.preventDefault();
          launchScene(sceneN - 1);
          return;
        }
      }
      if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        toggleClipReverse();
        return;
      }
      if ((e.code === "Equal" || e.code === "NumpadAdd") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        nudgeClipTranspose(e.shiftKey ? 12 : 1);
        return;
      }
      if ((e.code === "Minus" || e.code === "NumpadSubtract") && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        nudgeClipTranspose(e.shiftKey ? -12 : -1);
        return;
      }
      if (handleDjKey(e)) {
        e.preventDefault();
        return;
      }
      if (e.code === "Escape") {
        if (state.cueing) {
          e.preventDefault();
          stopCue();
          return;
        }
        if (state.playing) {
          e.preventDefault();
          stopTransport();
        }
        return;
      }
      if (state.view === "arrange" && (e.code === "Comma" || e.code === "Period")) {
        e.preventDefault();
        jumpLocator(e.code === "Period" ? 1 : -1);
        return;
      }
      if (state.view === "arrange" && state.selectedLocator && (e.code === "ArrowLeft" || e.code === "ArrowRight")) {
        e.preventDefault();
        nudgeLocator((e.code === "ArrowRight" ? 1 : -1) * (e.shiftKey ? 4 : 1));
        return;
      }
      if (e.code === "ArrowLeft" || e.code === "ArrowRight" || e.code === "ArrowUp" || e.code === "ArrowDown") {
        if (moveGridFocus(e.code)) {
          e.preventDefault();
          return;
        }
      }
      if (e.code === "Space") {
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        if (state.playing) stopTransport();
        else startTransport();
        return;
      }
      if (e.code === "KeyZ" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        midiOctave = Math.max(0, midiOctave - 1);
        setMidiLabel("Oct " + midiOctave);
        return;
      }
      if (e.code === "KeyX" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        midiOctave = Math.min(5, midiOctave + 1);
        setMidiLabel("Oct " + midiOctave);
        return;
      }
      if (keysHeld[e.code]) return;
      if (handlePianoKey(e.code, true)) {
        keysHeld[e.code] = true;
        e.preventDefault();
        return;
      }
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      if (state.view === "roll") {
        deleteSelectedNote();
        return;
      }
      if (state.selectedLocator) {
        pushUndo();
        state.locators = state.locators.filter(function (l) { return l.id !== state.selectedLocator; });
        state.selectedLocator = null;
        paintLocators();
        return;
      }
      if (!state.selectedArrange) return;
      pushUndo();
      state.arrangeClips = state.arrangeClips.filter(function (c) {
        return c.id !== state.selectedArrange;
      });
      state.selectedArrange = null;
      paintArrange();
    });
    document.addEventListener("keyup", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (!keysHeld[e.code]) return;
      delete keysHeld[e.code];
      handlePianoKey(e.code, false);
    });
    hookMidi();

    music.insertBefore(root, music.firstChild);
    paint();
    paintArrange();
  }

  function bufferToB64(buf) {
    if (!buf || !buf.getChannelData) return null;
    var ch = buf.getChannelData(0);
    var n = ch.length;
    var bytes = new Uint8Array(n * 2);
    for (var i = 0; i < n; i++) {
      var s = Math.max(-1, Math.min(1, ch[i]));
      var v = s < 0 ? s * 0x8000 : s * 0x7fff;
      bytes[i * 2] = v & 255;
      bytes[i * 2 + 1] = (v >> 8) & 255;
    }
    var bin = "";
    var step = 0x8000;
    for (var j = 0; j < bytes.length; j += step) {
      bin += String.fromCharCode.apply(null, bytes.subarray(j, Math.min(bytes.length, j + step)));
    }
    return { sr: buf.sampleRate, n: n, b64: btoa(bin) };
  }

  function b64ToBuffer(obj) {
    if (!obj || !obj.b64) return null;
    ensureAudio();
    var raw = atob(obj.b64);
    var n = obj.n || (raw.length / 2);
    var buf = ctx.createBuffer(1, n, obj.sr || ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < n; i++) {
      var lo = raw.charCodeAt(i * 2);
      var hi = raw.charCodeAt(i * 2 + 1);
      var v = (hi << 8) | lo;
      if (v & 0x8000) v = v - 0x10000;
      d[i] = v / 0x8000;
    }
    return buf;
  }

  function encodeNotes(notes) {
    if (!notes) return null;
    var buf = notes.buffer;
    var o = JSON.parse(JSON.stringify(notes, function (k, v) {
      if (k === "buffer") return undefined;
      return v;
    }));
    if (buf && buf.getChannelData) {
      o.buffer = bufferToB64(buf);
      o._buf = 1;
    }
    return o;
  }

  function decodeNotes(notes) {
    if (!notes) return null;
    if (notes._buf && notes.buffer) {
      notes.buffer = b64ToBuffer(notes.buffer);
      delete notes._buf;
    }
    return notes;
  }

  function encodePad(p) {
    return {
      id: p.id,
      name: p.name,
      synth: p.synth,
      choke: p.choke,
      gain: p.gain,
      decay: p.decay,
      open: !!p.open,
      midi: p.midi,
      buffer: p.buffer && p.buffer.getChannelData ? bufferToB64(p.buffer) : null,
    };
  }

  function decodePad(p) {
    if (p.buffer && p.buffer.b64) p.buffer = b64ToBuffer(p.buffer);
    else p.buffer = null;
    return p;
  }

  function snapshotProject() {
    return {
      v: 1,
      kind: "the-voice-set",
      bpm: state.bpm,
      quantize: state.quantize,
      swing: state.swing,
      timeNum: state.timeNum,
      timeDen: state.timeDen,
      loopOn: state.loopOn,
      loopStart: state.loopStart,
      loopEnd: state.loopEnd,
      follow: state.follow,
      locators: (state.locators || []).map(function (l) { return { id: l.id, bar: l.bar, name: l.name }; }),
      masterVol: state.masterVol,
      cueVol: state.cueVol,
      xfade: state.xfade,
      returnAVol: state.returnAVol,
      returnBVol: state.returnBVol,
      rollSnap: state.rollSnap,
      rollScale: state.rollScale,
      ccMap: state.ccMap,
      noteMap: state.noteMap || {},
      mode: state.mode,
      decks: { A: { vol: decks.A.vol, rate: decks.A.rate }, B: { vol: decks.B.vol, rate: decks.B.rate } },
      selectedTrackId: state.selectedTrackId,
      midiOctave: midiOctave,
      extraReturns: extraReturns.map(function (r) {
        return { name: r.name, volume: r.volume, delayTime: r.delay && r.delay.delayTime ? r.delay.delayTime.value : 0.2 };
      }),
      tracks: state.tracks.map(function (tr) {
        return {
          id: tr.id,
          name: tr.name,
          kind: tr.kind,
          role: tr.role,
          color: tr.color,
          volume: tr.volume,
          xf: tr.xf || "",
          pan: tr.pan,
          mute: tr.mute,
          solo: tr.solo,
          arm: tr.arm,
          sendA: tr.sendA,
          sendB: tr.sendB,
          devices: tr.devices,
          rack: tr.rack ? { pads: tr.rack.pads.map(encodePad) } : null,
          clips: tr.clips.map(function (c) {
            if (!c) return null;
            return { name: c.name, color: c.color, length: c.length, notes: encodeNotes(c.notes) };
          }),
          autoVol: tr.autoVol || [],
          autoPan: tr.autoPan || [],
          autoSendA: tr.autoSendA || [],
          autoSendB: tr.autoSendB || [],
          autoCut: tr.autoCut || [],
        };
      }),
      arrangeClips: state.arrangeClips.map(function (c) {
        return {
          id: c.id,
          trackId: c.trackId,
          start: c.start,
          length: c.length,
          name: c.name,
          color: c.color,
          notes: encodeNotes(c.notes),
        };
      }),
    };
  }

  function clearGraph() {
    Object.keys(trackNodes).forEach(function (id) {
      try { trackNodes[id].disconnect(); } catch (e) {}
    });
    trackNodes = {};
    trackGraph = {};
    extraReturns.forEach(function (r) {
      try { if (r.gain) r.gain.disconnect(); } catch (e2) {}
    });
    extraReturns = [];
    Object.keys(warpHold || {}).forEach(stopWarpVoices);
    Object.keys(audioHold || {}).forEach(stopAudioLoop);
    Object.keys(padHold || {}).forEach(stopPad);
  }

  function reviveTrack(raw) {
    var tr = {
      id: raw.id,
      name: raw.name,
      kind: raw.kind,
      role: raw.role || (raw.kind === "audio" ? "audio" : "midi"),
      color: raw.color,
      volume: raw.volume == null ? 0.85 : raw.volume,
      xf: raw.xf || "",
      pan: raw.pan || 0,
      mute: !!raw.mute,
      solo: !!raw.solo,
      arm: !!raw.arm,
      sendA: raw.sendA || 0,
      sendB: raw.sendB || 0,
      devices: raw.devices || defaultDevices(raw.kind),
      clips: (raw.clips || []).map(function (c) {
        if (!c) return null;
        return { name: c.name, color: c.color, length: c.length || STEPS, notes: decodeNotes(c.notes) || {} };
      }),
    };
    while (tr.clips.length < SCENES) tr.clips.push(null);
    if (raw.rack) tr.rack = { pads: (raw.rack.pads || []).map(decodePad) };
    tr.autoVol = raw.autoVol || null;
    tr.autoPan = raw.autoPan || null;
    tr.autoSendA = raw.autoSendA || null;
    tr.autoSendB = raw.autoSendB || null;
    tr.autoCut = raw.autoCut || null;
    return tr;
  }

  function applySnapshot(data) {
    if (!data || data.kind !== "the-voice-set") throw new Error("Not a Voice set");
    ensureAudio();
    ctx.resume();
    stopTransport();
    clearGraph();
    state.bpm = data.bpm || 112;
    state.quantize = data.quantize == null ? 16 : data.quantize;
    state.swing = data.swing || 0;
    if (window._dawSwingUi) window._dawSwingUi();
    state.timeNum = data.timeNum || 4;
    state.timeDen = data.timeDen || 4;
    state.loopOn = data.loopOn !== false;
    state.loopStart = data.loopStart || 0;
    state.loopEnd = data.loopEnd || 8;
    state.follow = data.follow !== false;
    state.locators = (data.locators || []).map(function (l) { return { id: l.id, bar: l.bar, name: l.name }; });
    state.selectedLocator = null;
    state.masterVol = data.masterVol == null ? 0.72 : data.masterVol;
    state.cueVol = data.cueVol == null ? 0.8 : data.cueVol;
    state.xfade = data.xfade == null ? 0.5 : data.xfade;
    state.returnAVol = data.returnAVol == null ? 0.85 : data.returnAVol;
    state.returnBVol = data.returnBVol == null ? 0.7 : data.returnBVol;
    state.rollSnap = data.rollSnap || 1;
    state.rollScale = data.rollScale || "minor";
    state.ccMap = data.ccMap || state.ccMap;
    state.noteMap = data.noteMap || {};
    if (data.decks) {
      ["A", "B"].forEach(function (id) {
        if (!data.decks[id]) return;
        if (data.decks[id].vol != null) decks[id].vol = data.decks[id].vol;
        if (data.decks[id].rate != null) decks[id].rate = data.decks[id].rate;
      });
    }
    state.selectedTrackId = data.selectedTrackId || (data.tracks && data.tracks[0] && data.tracks[0].id);
    state.launched = {};
    state.queued = {};
    state.selectedSession = null;
    state.selectedArrange = null;
    if (typeof data.midiOctave === "number") midiOctave = data.midiOctave;
    state.tracks = (data.tracks || []).map(reviveTrack);
    if (!state.tracks.length) state.tracks = makeSet();
    state.arrangeClips = (data.arrangeClips || []).map(function (c) {
      return {
        id: c.id,
        trackId: c.trackId,
        start: c.start,
        length: c.length,
        name: c.name,
        color: c.color,
        notes: decodeNotes(c.notes),
      };
    });
    state.tracks.forEach(function (tr) { wireTrack(tr); });
    (data.extraReturns || []).forEach(function (r) {
      var delay = ctx.createDelay(1);
      delay.delayTime.value = r.delayTime || 0.2;
      var fb = ctx.createGain();
      fb.gain.value = 0.28;
      delay.connect(fb);
      fb.connect(delay);
      var g = ctx.createGain();
      g.gain.value = r.volume == null ? 0.75 : r.volume;
      delay.connect(g);
      g.connect(master);
      extraReturns.push({ id: r.name || "ret", name: r.name || "Return", delay: delay, gain: g, volume: r.volume == null ? 0.75 : r.volume });
    });
    if (bpmInput) bpmInput.value = String(state.bpm);
    applyMix();
    rebuildTrackUi();
    paintDevices();
    paintWarp();
    setMidiLabel("Loaded set");
  }

  function saveProject() {
    var data = snapshotProject();
    var json = JSON.stringify(data);
    try { localStorage.setItem("voice-daw-project", json); } catch (e) {
      try { localStorage.setItem("voice-daw-project", JSON.stringify(snapshotProjectSansAudio(data))); } catch (e2) {}
    }
    var blob = new Blob([json], { type: "application/json" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "the-voice-set.json";
    a.click();
    window.setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
    setMidiLabel("Saved set");
  }

  function snapshotProjectSansAudio(data) {
    var copy = JSON.parse(JSON.stringify(data));
    (copy.tracks || []).forEach(function (tr) {
      (tr.clips || []).forEach(function (c) {
        if (c && c.notes) { delete c.notes.buffer; delete c.notes._buf; }
      });
      if (tr.rack && tr.rack.pads) tr.rack.pads.forEach(function (p) { p.buffer = null; });
    });
    return copy;
  }

  function loadProjectFile() {
    var inp = document.createElement("input");
    inp.type = "file";
    inp.accept = "application/json,.json";
    inp.addEventListener("change", function () {
      var f = inp.files && inp.files[0];
      if (!f) return;
      f.text().then(function (txt) {
        applySnapshot(JSON.parse(txt));
      }).catch(function () { setMidiLabel("Load failed"); });
    });
    inp.click();
  }

  function tryAutoload() {
    try {
      var raw = localStorage.getItem("voice-daw-project");
      if (!raw) return;
      applySnapshot(JSON.parse(raw));
    } catch (e) {}
  }


  function boot() {
    build();
    tryAutoload();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
