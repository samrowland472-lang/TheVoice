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
    return JSON.parse(JSON.stringify(n || {}));
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
    masterVol: 0.72,
    returnAVol: 0.85,
    returnBVol: 0.7,
  };
  state.arrangeClips = seedArrange(state.tracks);

  var ctx = null;
  var master = null;
  var trackNodes = {};
  var trackGraph = {};
  var masterAnalyser = null;
  var returnAGain = null;
  var returnBGain = null;
  var mixerEl = null;
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
  }

  function wireTrack(tr, delayNode, convNode) {
    delayNode = delayNode || fxDelay;
    convNode = convNode || fxConv;
    if (trackNodes[tr.id]) return;
    var input = ctx.createGain();
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
    input.connect(vol);
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
      meter: (mixerEl && mixerEl._pendingMeters && mixerEl._pendingMeters[tr.id]) || null,
    };
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

  function startMeters() {
    if (meterRaf) return;
    function tick() {
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
  function trigBass(dest, t, semi) {
    var f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = 420;
    f.Q.value = 0.8;
    f.connect(dest);
    var g = envGain(f, t, 0.38, 0.01, 0.22);
    osc("sawtooth", midiHz(semi), g, t, 0.24);
  }
  function trigChord(dest, t, semis, dur, peak) {
    semis.forEach(function (s, i) {
      var g = envGain(dest, t, (peak || 0.12) / (i + 1), 0.02, dur);
      osc("triangle", midiHz(s + 12), g, t, dur + 0.02);
    });
  }
  function trigLead(dest, t, semi) {
    var g = envGain(dest, t, 0.18, 0.008, 0.2);
    osc("square", midiHz(semi + 12), g, t, 0.22);
  }
  function trigPerc(dest, t, kind) {
    var g = envGain(dest, t, kind ? 0.2 : 0.12, 0.001, 0.07);
    noiseBurst(g, t, 0.08, kind ? 2400 : 5000);
  }

  function startPad(tr, clipObj) {
    stopPad(tr.id);
    if (!ctx || !clipObj) return;
    var dest = trackNodes[tr.id];
    var g = ctx.createGain();
    g.gain.value = 0.08;
    g.connect(dest);
    var oscs = (clipObj.notes.chord || [0, 7, 12]).map(function (s, i) {
      var o = ctx.createOscillator();
      o.type = "sine";
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
      clips: new Array(SCENES).fill(null),
    };
  }

  function addTrack(kind) {
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
        track.clips[0] = clip((f.name || "Sample").replace(/\.[^.]+$/, ""), track.color, { buffer: buf });
        rebuildTrackUi();
        paint();
      }).catch(function () {});
    });
    inp.click();
  }


  function playStepAt(track, clipObj, step, time) {
    if (!clipObj || !trackAudible(track)) return;
    var dest = trackNodes[track.id];
    var n = clipObj.notes || {};
    var i = step % (clipObj.length || STEPS);
    if (track.kind === "drums") {
      if (n.k && n.k[i]) trigKick(dest, time);
      if (n.s && n.s[i]) trigSnare(dest, time);
      if (n.h && n.h[i]) trigHat(dest, time, i % 8 === 7);
    } else if (track.kind === "bass") {
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) trigBass(dest, time, n.seq[i]);
    } else if (track.kind === "keys") {
      if (n.hits && n.hits[i]) trigChord(dest, time, n.chord || [0, 3, 7], 0.28, 0.16);
    } else if (track.kind === "lead") {
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) trigLead(dest, time, n.seq[i]);
    } else if (track.kind === "perc") {
      if (n.seq && n.seq[i]) trigPerc(dest, time, i % 4 === 2);
    } else if (track.kind === "midi" || track.kind === "keys") {
      if (n.hits && n.hits[i]) trigChord(dest, time, n.chord || [0, 3, 7], 0.28, 0.16);
      if (n.seq && typeof n.seq[i] === "number" && n.seq[i] >= 0) trigLead(dest, time, n.seq[i]);
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
      } else {
        state.launched[id] = next;
        if (tr.kind === "pad") startPad(tr, next);
        else stopPad(id);
        if (tr.kind === "audio") startAudioLoop(tr, next);
        else stopAudioLoop(id);
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
            playStepAt(tr, c, state.step - c.start, nextTime);
          }
        });
      } else {
        if (state.step % quantizeSteps() === 0) applyQueue();
        state.tracks.forEach(function (tr) {
          var c = state.launched[tr.id];
          if (c) playStepAt(tr, c, state.step, nextTime);
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
      "#daw-session{margin:-4px -4px 22px;border:1px solid var(--glass-border,rgba(63,198,255,.14));border-radius:16px;background:color-mix(in srgb,var(--surface,#121613) 88%, #000);overflow:hidden}" +
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
      "#music-view.is-daw .field-label:first-child,#music-view.is-daw > .hint-info:first-of-type,#music-view.is-daw > .music-controls,#music-view.is-daw > .sequencer,#music-view.is-daw > .buttons-row,#music-view.is-daw > #music-audio,#music-view.is-daw > #music-hint{display:none!important}";
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

  function setView(v) {
    state.view = v;
    if (root) root.classList.toggle("is-arrange", v === "arrange");
    root.querySelectorAll("[data-view]").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-view") === v);
    });
    if (v === "arrange") paintArrange();
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
    paintMixer();
  }

  function paintMixer() {
    if (!mixerEl) return;
    mixerEl.querySelectorAll("[data-mix-id]").forEach(function (strip) {
      var id = strip.getAttribute("data-mix-id");
      var tr = state.tracks.find(function (x) { return x.id === id; });
      if (!tr) return;
      strip.querySelectorAll("[data-act]").forEach(function (b) {
        var act = b.getAttribute("data-act");
        b.classList.toggle("on", !!tr[act]);
        if (act === "arm") b.classList.toggle("arm", !!tr.arm);
      });
    });
  }

  function rebuildSessionGrid() {
    if (!gridEl) return;
    gridEl.replaceChildren();
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
          btn.setAttribute("aria-label", track.name + " scene " + (scene + 1));
          btn.addEventListener("click", function () { queueClip(track, scene); });
          btn.addEventListener("dblclick", function (ev) {
            ev.preventDefault();
            if (track.kind === "audio") loadAudioFile(track);
          });
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

    root = el("section", "");
    root.id = "daw-session";
    root.setAttribute("aria-label", "Session and arrangement");

    var top = el("div", "daw-top");
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
          btn.setAttribute("aria-label", track.name + " scene " + (scene + 1));
          btn.addEventListener("click", function () {
            queueClip(track, scene);
          });
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

    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName) || "";
      var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (!typing && e.code === "Space") {
        e.preventDefault();
        if (state.playing) stopTransport();
        else startTransport();
        return;
      }
      if (e.key !== "Backspace" && e.key !== "Delete") return;
      if (!state.selectedArrange) return;
      var tag = (e.target && e.target.tagName) || "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      state.arrangeClips = state.arrangeClips.filter(function (c) {
        return c.id !== state.selectedArrange;
      });
      state.selectedArrange = null;
      paintArrange();
    });

    music.insertBefore(root, music.firstChild);
    paint();
    paintArrange();
  }

  function boot() {
    build();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
