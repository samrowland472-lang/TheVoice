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
    timeNum: 4,
    timeDen: 4,
    metro: false,
    recording: false,
    countIn: 0,
    swing: 0,
    masterVol: 0.72,
    returnAVol: 0.85,
    returnBVol: 0.7,
    rollSnap: 1,
    rollScale: "minor",
    selectedNote: null,
    selectedPad: null,
    selectedTrackId: "drums",
    ccMap: { 7: "volume", 10: "pan", 74: "cutoff" },
    midiHooked: false,
  };
  state.arrangeClips = seedArrange(state.tracks);
  attachDefaultRacks(state.tracks);

  var ctx = null;
  var master = null;
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
    applyMix();
    startMeters();
    hookMidi();
  }

  function defaultDevices(kind) {
    var midi = kind !== "drums" && kind !== "perc" && kind !== "audio";
    return [
      { type: "analog", on: midi, wave: kind === "lead" ? "square" : kind === "keys" || kind === "pad" ? "triangle" : "sawtooth", cutoff: kind === "bass" ? 520 : 2400, res: 0.85, attack: 0.01, decay: 0.22 },
      { type: "eq", on: true, low: 0, mid: 0, high: 0 },
      { type: "comp", on: kind === "drums" || kind === "bass" || kind === "perc", thresh: -18, ratio: 3.2, attack: 0.01, release: 0.14 },
      { type: "delay", on: kind === "pad" || kind === "lead", time: 0.3, fb: 0.28, mix: 0.2 },
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
    input.connect(analogFilt);
    analogFilt.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(comp);
    comp.connect(dry);
    comp.connect(delaySend);
    delaySend.connect(insDelay);
    insDelay.connect(delayFb);
    delayFb.connect(insDelay);
    insDelay.connect(wet);
    dry.connect(vol);
    wet.connect(vol);
    vol.connect(pan);
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
    var analog = getDevice(tr, "analog") || {};
    var eq = getDevice(tr, "eq") || {};
    var compD = getDevice(tr, "comp") || {};
    var del = getDevice(tr, "delay") || {};
    if (g.analogFilt) {
      g.analogFilt.frequency.setTargetAtTime(analog.on ? Math.max(80, analog.cutoff || 2000) : 18000, now, 0.02);
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

  function applyMix() {
    if (!ctx) return;
    var soloed = anySolo();
    state.tracks.forEach(function (tr) {
      var g = trackGraph[tr.id];
      if (!g) return;
      var silent = tr.mute || (soloed && !tr.solo);
      g.mute.gain.setTargetAtTime(silent ? 0 : 1, ctx.currentTime, 0.01);
      g.vol.gain.setTargetAtTime(Math.max(0, Math.min(1.2, tr.volume)), ctx.currentTime, 0.01);
      if (g.pan.pan) g.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, tr.pan || 0)), ctx.currentTime, 0.01);
      g.sendA.gain.setTargetAtTime(Math.max(0, Math.min(1, tr.sendA || 0)), ctx.currentTime, 0.01);
      g.sendB.gain.setTargetAtTime(Math.max(0, Math.min(1, tr.sendB || 0)), ctx.currentTime, 0.01);
      applyDevices(tr);
    });
    if (master) master.gain.setTargetAtTime(state.masterVol, ctx.currentTime, 0.01);
    if (returnAGain) returnAGain.gain.setTargetAtTime(state.returnAVol, ctx.currentTime, 0.01);
    if (returnBGain) returnBGain.gain.setTargetAtTime(state.returnBVol, ctx.currentTime, 0.01);
    paintMixer();
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
          pan: tr.pan,
          mute: tr.mute,
          solo: tr.solo,
          arm: tr.arm,
          sendA: tr.sendA,
          sendB: tr.sendB,
          devices: JSON.parse(JSON.stringify(tr.devices || [])),
          clips: tr.clips.map(lightClip),
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
      tr.pan = s.pan;
      tr.mute = s.mute;
      tr.solo = s.solo;
      tr.arm = s.arm;
      tr.sendA = s.sendA;
      tr.sendB = s.sendB;
      tr.devices = s.devices;
      tr.clips = (s.clips || []).map(function (c) {
        return c ? clip(c.name, c.color, cloneNotes(c.notes)) : null;
      });
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

  function duplicateSelectedClip() {
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
      var dest = master || ctx.destination;
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
    playBufferShot(master || ctx.destination, buf, ctx.currentTime, 0.9);
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

  function playWarpedClip(track, clipObj, time) {
    if (!clipObj || !clipObj.notes || !clipObj.notes.buffer) return;
    var dest = trackNodes[track.id];
    if (!dest) return;
    stopWarpVoices(track.id);
    var n = clipObj.notes;
    var gain = n.gain == null ? 1 : n.gain;
    var buf = n.reverse ? reversedBuffer(n.buffer) : n.buffer;
    var rate = Math.pow(2, clipXpose(n) / 12);
    if (!n.warpOn) {
      var src = ctx.createBufferSource();
      src.buffer = buf;
      src.playbackRate.value = rate;
      var g = ctx.createGain();
      g.gain.setValueAtTime(gain, time);
      src.connect(g);
      g.connect(dest);
      src.start(time);
      holdVoice(track.id, src);
      holdVoice(track.id, g);
      return;
    }
    var markers = ensureMarkers(clipObj);
    var beatSec = 60 / state.bpm;
    for (var i = 0; i < markers.length - 1; i++) {
      var a = markers[i], b = markers[i + 1];
      var destDur = Math.max(0.02, (b.beat - a.beat) * beatSec);
      var srcDur = Math.max(0.01, b.time - a.time);
      playWarpSeg(dest, buf, a.time, srcDur, destDur, time + a.beat * beatSec, gain, n.warpMode, track.id, rate);
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

  function playStepAt(track, clipObj, step, time) {
    if (!clipObj || !trackAudible(track)) return;
    var dest = trackNodes[track.id];
    var n = clipObj.notes || {};
    var len = clipObj.length || STEPS;
    var i = step % len;
    if (n.reverse) i = len - 1 - i;
    var xp = clipXpose(n);
    if ((track.kind === "drums" || track.kind === "perc") && track.rack && !(n.buffer)) {
      playDrumRack(track, clipObj, i, time);
      return;
    }
    if (n.buffer) {
      if ((n.reverse ? len - 1 - i : i) === 0) playWarpedClip(track, clipObj, time);
      return;
    }
    if (n.roll && n.roll.length) {
      playRollStep(track, dest, n.roll, i, time, xp);
      return;
    }
    if (track.kind === "drums") {
      if (n.k && n.k[i]) trigKick(dest, time);
      if (n.s && n.s[i]) trigSnare(dest, time);
      if (n.h && n.h[i]) trigHat(dest, time, i % 8 === 7);
    } else if (track.kind === "bass") {
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) trigBass(dest, time, n.seq[i] + xp, track);
    } else if (track.kind === "keys") {
      if (n.hits && n.hits[i]) trigChord(dest, time, (n.chord || [0, 3, 7]).map(function (s) { return s + xp; }), 0.28, 0.16, track);
    } else if (track.kind === "lead") {
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) trigLead(dest, time, n.seq[i] + xp, track);
    } else if (track.kind === "perc") {
      if (n.seq && n.seq[i]) trigPerc(dest, time, i % 4 === 2);
    } else if (track.kind === "midi" || track.kind === "keys") {
      if (n.hits && n.hits[i]) trigChord(dest, time, (n.chord || [0, 3, 7]).map(function (s) { return s + xp; }), 0.28, 0.16, track);
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) trigLead(dest, time, n.seq[i] + xp, track);
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
          var c = clipAt(tr.id, state.step);
          if (tr.kind === "pad") {
            if (c && lastPadClip[tr.id] !== c) startPad(tr, c);
            if (!c) stopPad(tr.id);
          } else if (c) {
            playStepAt(tr, c, state.step - c.start, swingTime(state.step, nextTime));
          }
        });
      } else {
        if (state.step % quantizeSteps() === 0) applyQueue();
        state.tracks.forEach(function (tr) {
          var c = state.launched[tr.id];
          if (c) playStepAt(tr, c, state.step, swingTime(state.step, nextTime));
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
      "#daw-session.is-rack .daw-rack{display:flex}" +"#daw-session.is-warp .daw-session-panel,#daw-session.is-warp .daw-arrange,#daw-session.is-warp .daw-roll,#daw-session.is-warp .daw-rack{display:none}" +"#daw-session .daw-warp{display:none;flex-direction:column;border-top:1px solid var(--border,#263029);grid-column:2}" +"#daw-session.is-warp .daw-warp{display:flex}" +"#daw-session .daw-warp-top{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:8px 12px}" +"#daw-session .daw-wave{width:100%;height:140px;background:#0a0d0c;display:block;cursor:crosshair}" +"#daw-session.is-dev .daw-session-panel,#daw-session.is-dev .daw-arrange,#daw-session.is-dev .daw-roll,#daw-session.is-dev .daw-rack{display:none}#daw-session .daw-devices{display:flex;gap:10px;overflow:auto;padding:10px 12px;border-top:1px solid var(--border,#263029);align-items:stretch}#daw-session .daw-dev{flex:0 0 168px;min-width:168px;border:1px solid var(--border,#263029);border-radius:10px;padding:8px;background:var(--surface-alt,#1a201c);display:flex;flex-direction:column;gap:6px}#daw-session .daw-dev.off{opacity:.45}#daw-session .daw-dev-h{display:flex;justify-content:space-between;align-items:center;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--phosphor,#3fc6ff)}#daw-session .daw-dev .daw-btn{min-height:28px;padding:2px 8px}#daw-session .daw-strip.sel{border-color:var(--phosphor,#3fc6ff);box-shadow:inset 0 0 0 1px var(--phosphor,#3fc6ff)}" +
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
      "#daw-session .daw-ruler{display:flex;margin-left:88px;height:44px;position:relative;border-bottom:1px solid var(--border,#263029);user-select:none}" +
      "#daw-session .daw-bar{width:" + BAR_W + "px;flex:0 0 " + BAR_W + "px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:10px;color:var(--ink-faint,#4c5f56);border-left:1px solid var(--border,#263029);padding:4px 6px}" +
      "#daw-session .daw-loop{position:absolute;top:0;bottom:0;background:color-mix(in srgb,var(--phosphor,#3fc6ff) 16%, transparent);border:1px solid var(--phosphor,#3fc6ff);pointer-events:none;z-index:2}" +
      "#daw-session .daw-loop-h{position:absolute;top:0;width:12px;height:44px;background:var(--phosphor,#3fc6ff);cursor:ew-resize;pointer-events:auto;z-index:3}" +
      "#daw-session .daw-lane-row{display:flex;align-items:stretch;height:" + LANE_H + "px;border-bottom:1px solid var(--border,#263029)}" +
      "#daw-session .daw-lane-lab{width:88px;flex:0 0 88px;display:flex;align-items:center;padding:0 10px;font-family:'Share Tech Mono',ui-monospace,monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;position:sticky;left:0;z-index:4;background:var(--surface,#121613)}" +
      "#daw-session .daw-lane{position:relative;flex:1;min-width:" + (BARS * BAR_W) + "px;background-image:repeating-linear-gradient(90deg,transparent,transparent " + (BAR_W - 1) + "px,var(--border,#263029) " + (BAR_W - 1) + "px,var(--border,#263029) " + BAR_W + "px)}" +
      "#daw-session .daw-clip{position:absolute;top:6px;height:36px;border-radius:6px;padding:6px 8px;font-size:11px;color:#06170f;overflow:hidden;white-space:nowrap;cursor:grab;z-index:1}" +
      "#daw-session .daw-clip.sel{outline:2px solid #fff;outline-offset:1px}" +
      "#daw-session .daw-playhead{position:absolute;top:0;bottom:0;width:2px;background:var(--alert,#ff4d4d);z-index:5;pointer-events:none;left:88px}" +
      "@media (prefers-reduced-motion: reduce){#daw-session .daw-playhead{transition:none}}" +
      "#music-view.is-daw > *:not(#daw-session){display:none!important}" +"#music-view.is-daw{display:flex;flex-direction:column;flex:1;min-height:100%;padding:0;margin:0}" +"body.is-music-daw .main-area{max-width:none;padding:0;overflow:hidden}" +"body.is-music-daw .main-area .footer{display:none}" +"body.is-music-daw .sidebar{background:#070908;border-right-color:#1a2420}" +"#daw-session .daw-top{background:#070908;gap:6px;padding:6px 8px;border-bottom:1px solid #1c2a24;flex-wrap:wrap}" +"#daw-session .daw-brand{font-family:Chakra Petch,sans-serif;font-weight:700;font-size:13px;letter-spacing:.18em}" +"#daw-session .daw-btn{min-height:32px;min-width:32px;padding:4px 9px;border-radius:2px;font-family:Share Tech Mono,ui-monospace,monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;background:#121816;border-color:#24332c}" +"#daw-session .daw-btn[data-play],#daw-session .daw-btn.stop,#daw-session .daw-btn.rec{min-height:36px;min-width:52px}" +"#daw-session select,#daw-session input[type=number]{min-height:32px;border-radius:2px;background:#050706}" +"#daw-session .daw-cell{min-height:44px;border-radius:2px;background:#101714;padding:6px 8px}" +"#daw-session .daw-cell.filled{background:color-mix(in srgb,var(--clip,#3fc6ff) 62%, #0a0d0c);color:#06170f;border-color:var(--clip,#3fc6ff);box-shadow:none;font-weight:600}" +"#daw-session .daw-cell.playing{outline:1px solid #fff;background:color-mix(in srgb,var(--clip,#3fc6ff) 82%, #fff)}" +"#daw-session .daw-scene{min-height:44px;border-radius:2px}" +"#daw-session .daw-strip,#daw-session .daw-dev{border-radius:2px;background:#101714}" +"#daw-session .daw-browser{background:#070908;padding:8px 6px;max-height:none}" +"#daw-session .daw-lib{border-radius:2px;background:#121816}" +"#daw-session .daw-mixer{background:#0c100e;padding:8px}" +"#daw-session .daw-devices{background:#0c100e}" +"#daw-session .daw-grid-wrap{padding:8px;background:#0a0d0c}" +"#daw-session .daw-fader{accent-color:#3fc6ff}" +"#daw-session .daw-hint,#daw-session .daw-roll-hint{color:#6a8076;font-size:11px}" +"@media (max-width:780px){#daw-session{grid-template-columns:1fr;min-height:auto}#daw-session .daw-browser{grid-row:auto;max-height:180px;border-right:0;border-bottom:1px solid #1c2a24}}" +"#daw-session .daw-btn:focus-visible,#daw-session .daw-cell:focus-visible,#daw-session .daw-scene:focus-visible,#daw-session .daw-pad:focus-visible,#daw-session .daw-step:focus-visible,#daw-session .daw-lib:focus-visible,#daw-session .daw-key:focus-visible,#daw-session select:focus-visible,#daw-session input:focus-visible{outline:2px solid var(--phosphor,#3fc6ff);outline-offset:2px;z-index:6}" +"#daw-session .daw-live{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)}" +"#daw-session .daw-help{padding:6px 10px;font-size:11px;color:#6a8076;border-top:1px solid #1c2a24;grid-column:1/-1;font-family:Share Tech Mono,ui-monospace,monospace}";
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
          var node = el("div", "daw-clip" + (state.selectedArrange === c.id ? " sel" : ""), c.name);
          node.style.left = (c.start / STEPS_PER_BAR) * BAR_W + "px";
          node.style.width = Math.max(24, (c.length / STEPS_PER_BAR) * BAR_W - 4) + "px";
          node.style.background = c.color;
          node.dataset.id = c.id;
          node.title = c.name + " · drag to move · backspace to delete";
          bindClipDrag(node, c);
          lane.appendChild(node);
        });
    });
    if (loopEl) {
      loopEl.style.left = 88 + state.loopStart * BAR_W + "px";
      loopEl.style.width = Math.max(BAR_W, (state.loopEnd - state.loopStart) * BAR_W) + "px";
    }
    updatePlayheadPx();
  }

  function bindClipDrag(node, clipObj) {
    node.addEventListener("pointerdown", function (ev) {
      ev.preventDefault();
      state.selectedArrange = clipObj.id;
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
      notes: cloneNotes(src.notes),
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

  function trigRackPad(track, pad, time, vel) {
    if (!trackAudible(track)) return;
    ensureAudio();
    var dest = trackNodes[track.id];
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

  function playDrumRack(track, clipObj, i, time) {
    ensureRack(track);
    var steps = ensureDrumSteps(clipObj, track);
    track.rack.pads.forEach(function (pad) {
      var row = steps[pad.id];
      if (row && row[i % (clipObj.length || STEPS)]) trigRackPad(track, pad, time, 0.95);
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
    if (midiLearn === "volume" || midiLearn === "pan" || midiLearn === "cutoff") {
      state.ccMap[cc] = midiLearn;
      midiLearn = null;
      setMidiLabel("CC" + cc + " → " + state.ccMap[cc]);
      return;
    }
    var dest = state.ccMap[cc];
    if (!dest) return;
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
    if (cmd === 0x90 && d[2] > 0) playIncomingNote(n, v);
    else if (cmd === 0x80 || (cmd === 0x90 && d[2] === 0)) releaseIncomingNote(n);
    else if (cmd === 0xb0) midiCC(n, v);
  }

  function hookMidi() {
    if (state.midiHooked) return;
    state.midiHooked = true;
    if (!navigator.requestMIDIAccess) {
      setMidiLabel("Keys A–L");
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then(function (access) {
      function bind(port) {
        port.onmidimessage = onMidiMessage;
      }
      access.inputs.forEach(bind);
      access.onstatechange = function (e) {
        if (e.port && e.port.type === "input" && e.port.state === "connected") bind(e.port);
      };
      var n = 0;
      access.inputs.forEach(function () { n += 1; });
      setMidiLabel(n ? n + " MIDI in" : "MIDI wait");
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
    roll.forEach(function (note) {
      if (Math.floor(note.start + 1e-6) !== i) return;
      var dur = Math.max(0.05, (note.length || 1) * secondsPerStep());
      trigRollNote(track, dest, time, note.pitch + xp, dur, note.vel);
    });
  }

  function previewPitch(track, pitch) {
    if (!track) return;
    ensureAudio();
    ctx.resume();
    var dest = trackNodes[track.id];
    if (!dest) return;
    trigRollNote(track, dest, ctx.currentTime, pitch, 0.18, 0.8);
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
  }

  function setView(v) {
    state.view = v;
    if (root) {
      root.classList.toggle("is-arrange", v === "arrange");
      root.classList.toggle("is-roll", v === "roll");
      root.classList.toggle("is-rack", v === "rack");
      root.classList.toggle("is-dev", v === "dev");
      root.classList.toggle("is-warp", v === "warp");
    }
    root.querySelectorAll("[data-view]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-view") === v);
    });
    if (v === "arrange") paintArrange();
    if (v === "roll") paintRoll();
    if (v === "rack") paintRack();
    if (v === "dev") paintDevices();
    if (v === "warp") paintWarp();
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
          btn.addEventListener("click", function () { queueClip(track, scene); });
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
      [["mute", "M"], ["solo", "S"], ["arm", "A"]].forEach(function (pair) {
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
    top.appendChild(viewBtn("session", "Session"));
    top.appendChild(viewBtn("arrange", "Arrange"));
    top.appendChild(viewBtn("roll", "Roll"));
    top.appendChild(viewBtn("rack", "Rack"));
    top.appendChild(viewBtn("dev", "Dev"));
    top.appendChild(viewBtn("warp", "Warp"));

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
          btn.addEventListener("click", function () {
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

    var ruler = el("div", "daw-ruler");
    for (var b = 0; b < BARS; b++) {
      (function (bar) {
        var tick = el("div", "daw-bar", String(bar + 1));
        tick.addEventListener("click", function () {
          if (!state.playing) state.step = bar * STEPS_PER_BAR;
          updatePlayheadPx();
          paintPlayhead();
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

    devicesEl = el("div", "daw-devices");
    devicesEl.setAttribute("aria-label", "Devices");
    root.appendChild(devicesEl);
    paintDevices();

    root.appendChild(el("div", "daw-help", "Arrows move the grid. Shift+1–8 launch scenes. Ctrl+D duplicates. R reverses. +/- transpose. Ctrl+Z undo. Escape stops."));

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
      if (e.code === "Escape") {
        if (state.playing) {
          e.preventDefault();
          stopTransport();
        }
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
      masterVol: state.masterVol,
      returnAVol: state.returnAVol,
      returnBVol: state.returnBVol,
      rollSnap: state.rollSnap,
      rollScale: state.rollScale,
      ccMap: state.ccMap,
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
    state.masterVol = data.masterVol == null ? 0.72 : data.masterVol;
    state.returnAVol = data.returnAVol == null ? 0.85 : data.returnAVol;
    state.returnBVol = data.returnBVol == null ? 0.7 : data.returnBVol;
    state.rollSnap = data.rollSnap || 1;
    state.rollScale = data.rollScale || "minor";
    state.ccMap = data.ccMap || state.ccMap;
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
