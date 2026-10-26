export function formatTimecode(t: number, withHours = false): string {
  const sign = t < 0 ? "-" : "";
  const abs = Math.abs(t);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  const s = abs % 60;
  const sec = s.toFixed(2).padStart(5, "0");
  if (withHours || h > 0) {
    return `${sign}${h}:${String(m).padStart(2, "0")}:${sec}`;
  }
  if (m > 0) return `${sign}${m}:${sec}`;
  return `${sign}${s.toFixed(2)}s`;
}

export function formatFrame(t: number, fps: number): string {
  const f = Math.round(t * Math.max(1, fps));
  return `${f}f`;
}

export function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const h = seconds / 3600;
    if (Number.isInteger(h)) return `${h}h`;
    return `${h.toFixed(1)}h`;
  }
  if (seconds >= 60) {
    const m = seconds / 60;
    return Number.isInteger(m) ? `${m}m` : `${m.toFixed(1)}m`;
  }
  return `${seconds.toFixed(seconds < 10 ? 2 : 1)}s`;
}

export function formatCompact(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "0";
  const abs = Math.abs(n);
  if (abs >= 1000) return n.toFixed(0);
  if (abs >= 10) return n.toFixed(Math.min(digits, 1));
  if (abs < 0.001 && abs !== 0) return n.toExponential(1);
  return n.toFixed(digits);
}

export function channelLabel(channel: string): string {
  const map: Record<string, string> = {
    "position.x": "Translate X",
    "position.y": "Translate Y",
    "position.z": "Translate Z",
    "rotation.x": "Rotate X",
    "rotation.y": "Rotate Y",
    "rotation.z": "Rotate Z",
    "scale.x": "Scale X",
    "scale.y": "Scale Y",
    "scale.z": "Scale Z",
    intensity: "Intensity",
    emissiveIntensity: "Emit",
    opacity: "Opacity",
    fov: "FOV",
  };
  return map[channel] ?? channel;
}

export function channelShort(channel: string): string {
  const map: Record<string, string> = {
    "position.x": "TX",
    "position.y": "TY",
    "position.z": "TZ",
    "rotation.x": "RX",
    "rotation.y": "RY",
    "rotation.z": "RZ",
    "scale.x": "SX",
    "scale.y": "SY",
    "scale.z": "SZ",
    intensity: "INT",
    emissiveIntensity: "EM",
    opacity: "OP",
    fov: "FOV",
  };
  return map[channel] ?? channel;
}

export function interpLabel(interp: string): string {
  const map: Record<string, string> = {
    linear: "Linear",
    step: "Step",
    easeIn: "Ease in",
    easeOut: "Ease out",
    easeInOut: "Ease in-out",
    smooth: "Smooth",
    bounce: "Bounce",
    bezier: "Bezier",
  };
  return map[interp] ?? interp;
}
