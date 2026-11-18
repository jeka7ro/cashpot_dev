const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "../..");
const FIG_PATH = path.join(ROOT, "Cashpot_test.fig");
const IMG_OUT_DIR = path.join(ROOT, "app/public/figma-test/img");
const SPEC_OUT_PATH = path.join(ROOT, "app/src/cashpotTestSpec.js");

fs.mkdirSync(IMG_OUT_DIR, { recursive: true });

// ── 1. Decompress & Decode canvas.fig ─────────────────────────
const canvasBuf = execFileSync("unzip", ["-p", FIG_PATH, "canvas.fig"], {
  maxBuffer: 25 * 1024 * 1024,
});
const len0 = canvasBuf.readUInt32LE(12);
const schemaBuf = zlib.inflateRawSync(canvasBuf.slice(16, 16 + len0));
const len1 = canvasBuf.readUInt32LE(16 + len0);
const dataBuf = zlib.zstdDecompressSync(
  canvasBuf.slice(20 + len0, 20 + len0 + len1)
);

class Reader {
  constructor(b) {
    this.b = b;
    this.o = 0;
    this.f32 = new Float32Array(1);
    this.i32 = new Int32Array(this.f32.buffer);
  }
  byte() {
    return this.b[this.o++];
  }
  bool() {
    return this.b[this.o++] !== 0;
  }
  uint() {
    let s = 0,
      r = 0,
      b;
    do {
      b = this.b[this.o++];
      r |= (b & 127) << s;
      s += 7;
    } while (b & 128 && s < 35);
    return r >>> 0;
  }
  int() {
    const u = this.uint();
    return (u >>> 1) ^ -(u & 1);
  }
  uint64() {
    let s = 0n,
      r = 0n,
      b;
    do {
      b = BigInt(this.b[this.o++]);
      r |= (b & 127n) << s;
      s += 7n;
    } while (b & 128n);
    return r.toString();
  }
  int64() {
    let s = 0n,
      r = 0n,
      b;
    do {
      b = BigInt(this.b[this.o++]);
      r |= (b & 127n) << s;
      s += 7n;
    } while (b & 128n);
    return ((r >> 1n) ^ -(r & 1n)).toString();
  }
  float() {
    const b0 = this.b[this.o++];
    if (b0 === 0) return 0;
    const bits =
      b0 |
      (this.b[this.o++] << 8) |
      (this.b[this.o++] << 16) |
      (this.b[this.o++] << 24);
    this.i32[0] = (bits << 23) | (bits >>> 9);
    return this.f32[0];
  }
  string() {
    const st = this.o;
    while (this.b[this.o] !== 0) this.o++;
    const s = this.b.toString("utf8", st, this.o);
    this.o++;
    return s;
  }
}

const sr = new Reader(schemaBuf);
const defs = Array.from({ length: sr.uint() }, () => {
  const name = sr.string(),
    kind = sr.byte(),
    fCount = sr.uint(),
    fields = [],
    byVal = new Map();
  for (let j = 0; j < fCount; j++) {
    const f = {
      name: sr.string(),
      type: sr.int(),
      isArray: sr.bool(),
      value: sr.uint(),
    };
    fields.push(f);
    byVal.set(f.value, f);
  }
  return { name, kind, fields, byVal };
});

function readVal(r, t) {
  if (t === -1) return r.bool();
  if (t === -2) return r.byte();
  if (t === -3) return r.int();
  if (t === -4) return r.uint();
  if (t === -5) return r.float();
  if (t === -6) return r.string();
  if (t === -7) return r.int64();
  if (t === -8) return r.uint64();
  const d = defs[t];
  if (d.kind === 0) return d.byVal.get(r.uint())?.name;
  if (d.kind === 1) {
    const o = {};
    for (const f of d.fields) o[f.name] = readField(r, f);
    return o;
  }
  const o = {};
  while (true) {
    const tag = r.uint();
    if (!tag) break;
    const f = d.byVal.get(tag);
    o[f.name] = readField(r, f);
  }
  return o;
}

function readField(r, f) {
  if (!f.isArray) return readVal(r, f.type);
  if (f.type === -2) {
    const n = r.uint();
    const s = r.b.slice(r.o, r.o + n);
    r.o += n;
    return f.name === "bytes" ? s : s.toString("hex");
  }
  const n = r.uint(),
    a = new Array(n);
  for (let i = 0; i < n; i++) a[i] = readVal(r, f.type);
  return a;
}

const msg = readVal(
  new Reader(dataBuf),
  defs.findIndex((d) => d.name === "Message")
);

const byId = new Map();
const children = new Map();
for (const n of msg.nodeChanges) {
  const id = `${n.guid.sessionID}:${n.guid.localID}`;
  byId.set(id, n);
  if (n.parentIndex?.guid) {
    const p = `${n.parentIndex.guid.sessionID}:${n.parentIndex.guid.localID}`;
    if (!children.has(p)) children.set(p, []);
    children.get(p).push({ pos: n.parentIndex.position, id, n });
  }
}
for (const a of children.values()) a.sort((x, y) => (x.pos < y.pos ? -1 : 1));

const gid = (g) => (g ? `${g.sessionID}:${g.localID}` : "");
const colorHex = (c) =>
  c
    ? "#" +
      [c.r, c.g, c.b]
        .map((v) =>
          Math.max(0, Math.min(255, Math.round((v || 0) * 255)))
            .toString(16)
            .padStart(2, "0")
        )
        .join("")
    : "";

const zipEntries = new Set(
  execFileSync("unzip", ["-Z1", FIG_PATH], { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 })
    .split(/\r?\n/)
    .filter(Boolean)
);

// Track every referenced image hash -> resolved "/figma-test/img/..." URL
const usedHashes = new Set();
function trackHash(h) {
  if (!h || !/^[0-9a-f]{40}$/i.test(h)) return null;
  if (!zipEntries.has(`images/${h}`)) return null;
  usedHashes.add(h);
  return h;
}

// ── 2. SVG Path & Instance Resolver ───────────────────────────
function decodePathBlob(blobIdx) {
  const blob = msg.blobs?.[blobIdx]?.bytes;
  if (!blob) return "";
  let o = 0,
    d = "";
  while (o < blob.length) {
    const cmd = blob[o++];
    if (cmd === 0) d += "Z";
    else if (cmd === 1) {
      d += `M${blob.readFloatLE(o).toFixed(2)} ${blob.readFloatLE(o + 4).toFixed(2)}`;
      o += 8;
    } else if (cmd === 2) {
      d += `L${blob.readFloatLE(o).toFixed(2)} ${blob.readFloatLE(o + 4).toFixed(2)}`;
      o += 8;
    } else if (cmd === 3) {
      d += `Q${blob.readFloatLE(o).toFixed(2)} ${blob.readFloatLE(o + 4).toFixed(2)} ${blob.readFloatLE(o + 8).toFixed(2)} ${blob.readFloatLE(o + 12).toFixed(2)}`;
      o += 16;
    } else if (cmd === 4) {
      d += `C${blob.readFloatLE(o).toFixed(2)} ${blob.readFloatLE(o + 4).toFixed(2)} ${blob.readFloatLE(o + 8).toFixed(2)} ${blob.readFloatLE(o + 12).toFixed(2)} ${blob.readFloatLE(o + 16).toFixed(2)} ${blob.readFloatLE(o + 20).toFixed(2)}`;
      o += 24;
    } else {
      break;
    }
  }
  return d;
}

function mulMat(A, B) {
  return {
    m00: A.m00 * B.m00 + A.m01 * B.m10,
    m01: A.m00 * B.m01 + A.m01 * B.m11,
    m02: A.m00 * B.m02 + A.m01 * B.m12 + A.m02,
    m10: A.m10 * B.m00 + A.m11 * B.m10,
    m11: A.m10 * B.m01 + A.m11 * B.m11,
    m12: A.m10 * B.m02 + A.m11 * B.m12 + A.m12,
  };
}

const ID_MAT = { m00: 1, m01: 0, m02: 0, m10: 0, m11: 1, m12: 0 };

function extractPropMap(list, target = new Map()) {
  if (!list) return target;
  for (const p of list) {
    const id = gid(p.defID);
    if (!id) continue;
    const tv =
      p.value?.textValue?.characters ??
      p.varValue?.value?.textDataValue?.characters;
    const sv =
      gid(p.value?.guidValue) || gid(p.varValue?.value?.symbolIdValue?.guid);
    const bv = p.value?.boolValue ?? p.varValue?.value?.boolValue;
    target.set(id, { text: tv, symbolId: sv, bool: bv });
  }
  return target;
}

/**
 * Resolve a node subtree into a normalized JSON tree applying Figma symbolOverrides + componentPropAssignments
 */
function resolveNode(nodeId, parentOverrides = [], parentPropMap = new Map(), depth = 0) {
  if (depth > 16) return null;
  const raw = byId.get(nodeId);
  if (!raw) return null;

  // Match overrides directly targeting this node
  const directOvs = [];
  const childOvs = [];
  for (const ov of parentOverrides) {
    const gp = ov.guidPath?.guids;
    if (!gp || !gp.length) continue;
    if (gid(gp[0]) === nodeId) {
      if (gp.length === 1) directOvs.push(ov);
      else childOvs.push({ ...ov, guidPath: { guids: gp.slice(1) } });
    }
  }

  let visible = raw.visible !== false;
  let name = raw.name;
  let size = raw.size;
  let transform = raw.transform || ID_MAT;
  let text = raw.textData?.characters;
  let fillPaints = raw.fillPaints;
  let strokePaints = raw.strokePaints;
  let symId = gid(raw.symbolData?.symbolID);
  const propMap = new Map(parentPropMap);

  extractPropMap(raw.componentPropAssignments, propMap);

  // Check componentPropRefs on raw node
  for (const ref of raw.componentPropRefs || []) {
    const defId = gid(ref.defID);
    const val = propMap.get(defId);
    if (!val) continue;
    if (ref.componentPropNodeField === "TEXT_DATA" && val.text !== undefined) {
      text = val.text;
    } else if (
      ref.componentPropNodeField === "OVERRIDDEN_SYMBOL_ID" &&
      val.symbolId
    ) {
      symId = val.symbolId;
    } else if (
      ref.componentPropNodeField === "VISIBLE" &&
      val.bool !== undefined
    ) {
      visible = val.bool;
    }
  }

  // Own symbolOverrides FIRST (lower precedence than parentOverrides!)
  const ownDirectOvs = [];
  const ownChildOvs = [];
  for (const ov of raw.symbolData?.symbolOverrides || []) {
    const gp = ov.guidPath?.guids;
    if (!gp || !gp.length) continue;
    if (gp.length === 1 && gid(gp[0]) === symId) {
      ownDirectOvs.push(ov);
    } else {
      ownChildOvs.push(ov);
    }
  }

  // Apply own defaults first, then parent overrides last so parent always wins
  for (const ov of [...ownDirectOvs, ...directOvs]) {
    if (ov.visible !== undefined) visible = ov.visible;
    if (ov.name !== undefined) name = ov.name;
    if (ov.size !== undefined) size = ov.size;
    if (ov.textData?.characters !== undefined) text = ov.textData.characters;
    if (ov.fillPaints !== undefined) fillPaints = ov.fillPaints;
    if (ov.strokePaints !== undefined) strokePaints = ov.strokePaints;
    if (ov.overriddenSymbolID) symId = gid(ov.overriddenSymbolID);
    if (ov.componentPropAssignments) {
      extractPropMap(ov.componentPropAssignments, propMap);
    }
  }

  if (!visible) return null;

  const images = [];
  const colors = [];
  for (const fp of fillPaints || []) {
    if (fp.visible === false) continue;
    if (fp.type === "IMAGE" && fp.image?.hash) {
      images.push(trackHash(fp.image.hash));
    } else if (fp.type === "SOLID" && fp.color) {
      colors.push({
        hex: colorHex(fp.color),
        opacity: fp.opacity ?? fp.color.a ?? 1,
      });
    } else if (fp.type?.startsWith("GRADIENT") && fp.stops?.length) {
      colors.push({
        gradient: fp.stops.map((s) => ({
          hex: colorHex(s.color),
          a: s.color?.a ?? 1,
          pos: s.position ?? 0,
        })),
      });
    }
  }

  // Also check derivedSymbolData overrides if this node has no own fill/stroke geometry
  let kids = [];
  if (raw.type === "INSTANCE" && symId) {
    // Also apply any direct overrides inside symbol's root ID
    const symNode = byId.get(symId);
    const mergedOvs = [...ownChildOvs, ...childOvs, ...parentOverrides];
    for (const ov of mergedOvs) {
      if (
        ov.guidPath?.guids?.length === 1 &&
        gid(ov.guidPath.guids[0]) === symId
      ) {
        if (ov.fillPaints) {
          for (const fp of ov.fillPaints) {
            if (fp.visible === false) continue;
            if (fp.type === "IMAGE" && fp.image?.hash)
              images.push(trackHash(fp.image.hash));
            if (fp.type === "SOLID" && fp.color)
              colors.push({
                hex: colorHex(fp.color),
                opacity: fp.opacity ?? fp.color.a ?? 1,
              });
          }
        }
      }
    }
    const symChildren = children.get(symId) || [];
    for (const ch of symChildren) {
      const r = resolveNode(ch.id, mergedOvs, propMap, depth + 1);
      if (r) kids.push(r);
    }
    if (symNode && !size) size = symNode.size;
  } else {
    for (const ch of children.get(nodeId) || []) {
      const merged = [...childOvs, ...parentOverrides];
      const r = resolveNode(ch.id, merged, propMap, depth + 1);
      if (r) kids.push(r);
    }
  }

  return {
    id: nodeId,
    type: raw.type,
    name,
    symId,
    size,
    transform,
    text,
    images: images.filter(Boolean),
    colors,
    fillGeometry: raw.fillGeometry,
    strokeGeometry: raw.strokeGeometry,
    strokeWeight: raw.strokeWeight,
    strokePaints,
    propMap: Object.fromEntries(propMap),
    children: kids,
  };
}

function collectTexts(node, arr = []) {
  if (!node) return arr;
  if (node.text !== undefined && node.text !== null && String(node.text).trim() !== "") {
    arr.push({ name: node.name, text: String(node.text), color: node.colors?.[0]?.hex });
  }
  for (const c of node.children) collectTexts(c, arr);
  return arr;
}

function collectImages(node, arr = []) {
  if (!node) return arr;
  for (const h of node.images) {
    arr.push({ name: node.name, hash: h, size: node.size });
  }
  for (const c of node.children) collectImages(c, arr);
  return arr;
}

// Extract clean SVG icon descriptor from any SYMBOL or resolved node
function extractIconSvg(symbolId) {
  const sym = byId.get(symbolId);
  if (!sym) return null;
  const w = sym.size?.x || 24;
  const h = sym.size?.y || 24;
  const shapes = [];

  function walk(nid, mat) {
    const n = byId.get(nid);
    if (!n || n.visible === false) return;
    const t = n.transform || ID_MAT;
    const nextMat = nid === symbolId ? ID_MAT : mulMat(mat, t);
    const fill = n.fillPaints?.find((p) => p.visible !== false && p.type === "SOLID");
    const stroke = n.strokePaints?.find((p) => p.visible !== false && p.type === "SOLID");
    if (n.fillGeometry?.length && (n.type === "VECTOR" || n.type === "BOOLEAN_OPERATION" || n.type === "ELLIPSE" || n.type === "REGULAR_POLYGON" || n.type === "STAR" || (n.type === "ROUNDED_RECTANGLE" && fill))) {
      for (const fg of n.fillGeometry) {
        const d = decodePathBlob(fg.commandsBlob);
        if (d) {
          shapes.push({
            d,
            rule: fg.windingRule === "ODD" ? "evenodd" : "nonzero",
            fillOpacity: fill?.opacity ?? fill?.color?.a ?? 1,
            m: [nextMat.m00, nextMat.m10, nextMat.m01, nextMat.m11, nextMat.m02, nextMat.m12].map((v) =>
              Number(v.toFixed(3))
            ),
          });
        }
      }
    }
    if (n.strokeGeometry?.length && stroke) {
      for (const sg of n.strokeGeometry) {
        const d = decodePathBlob(sg.commandsBlob);
        if (d) {
          shapes.push({
            d,
            rule: "nonzero",
            fillOpacity: stroke?.opacity ?? stroke?.color?.a ?? 1,
            m: [nextMat.m00, nextMat.m10, nextMat.m01, nextMat.m11, nextMat.m02, nextMat.m12].map((v) =>
              Number(v.toFixed(3))
            ),
          });
        }
      }
    }
    if (n.type === "INSTANCE" && n.symbolData?.symbolID) {
      for (const ch of children.get(gid(n.symbolData.symbolID)) || []) {
        walk(ch.id, nextMat);
      }
    } else {
      for (const ch of children.get(nid) || []) {
        walk(ch.id, nextMat);
      }
    }
  }

  walk(symbolId, ID_MAT);
  if (!shapes.length) return null;
  return { vb: `0 0 ${Math.round(w)} ${Math.round(h)}`, shapes };
}

function imgUrlPlaceholder(hash) {
  return hash ? `__IMG__${hash}__` : "";
}

// ── 3. Extract All Cashpot_test.fig Data ──────────────────────

// Helper for Banner cards (Pre-login hero & Logat secondary carousel)
function extractBannerItem(nodeId) {
  const tree = resolveNode(nodeId);
  if (!tree) return null;
  const imgs = collectImages(tree);
  const props = Object.values(tree.propMap || {}).filter((v) => v.text);
  const txts = collectTexts(tree);
  const ctaOv = (byId.get(nodeId)?.symbolData?.symbolOverrides || []).find(
    (o) => o.textData?.characters
  )?.textData?.characters;
  const tag =
    props.find((p) => p.text)?.text ||
    txts.find((t) => t.name === "Tag text")?.text ||
    "";
  const title = props[1]?.text || txts.find((t) => t.name === "Title")?.text || "";
  const sub = props[2]?.text || "";
  return {
    tag,
    title,
    sub,
    cta: ctaOv || "Vezi detalii",
    img: imgUrlPlaceholder(imgs[0]?.hash),
  };
}

// Secondary banners carousel (Logat) — clean typo & order so first 4 match x=0 in 2251:10271
const rawBanners = (children.get("2251:10271") || [])
  .map((c) => extractBannerItem(c.id))
  .filter(Boolean)
  .map((b) => ({
    ...b,
    tag: (b.tag || "").replace(/^RFecompense speciale$/i, "Recompense speciale"),
  }));
const secondaryBanners = [5, 6, 7, 8, 2, 3, 4, 0, 1]
  .map((i) => rawBanners[i])
  .filter(Boolean);

// Pre-login hero + 2 side cards
const preloginHero = {
  main: extractBannerItem("2027:965"),
  sides: [extractBannerItem("2027:1019"), extractBannerItem("2027:995")].filter(Boolean),
};

// Header assets & icons
const topNavIcons = {
  search: extractIconSvg("2014:67"),
  chevronDown: extractIconSvg("2014:76"),
  plus: extractIconSvg("2014:68") || {
    vb: "0 0 14 14",
    shapes: [{ d: "M6 2a1 1 0 0 1 2 0v4h4a1 1 0 1 1 0 2H8v4a1 1 0 1 1-2 0V8H2a1 1 0 1 1 0-2h4V2z", rule: "nonzero", fillOpacity: 1, m: [1, 0, 0, 1, 0, 0] }],
  },
};

// Extract hashes dynamically from the exact Figma nodes
function resolveDirectImageHash(nodeId) {
  const res = resolveNode(nodeId);
  const imgs = collectImages(res);
  return imgs[0]?.hash || null;
}

const headerAssets = {
  logo: imgUrlPlaceholder(resolveDirectImageHash("2228:6204")),
  mobileLogoMark: imgUrlPlaceholder(
    resolveDirectImageHash("2228:6178") ||
      trackHash("49cc4775839b8014cd3b6ce97e8aa8c1f10239ca")
  ),
  promotionsIcon: imgUrlPlaceholder(resolveDirectImageHash("2228:6222")),
  smarticoAvatar: imgUrlPlaceholder(resolveDirectImageHash("2222:10217")),
  vipBadge: imgUrlPlaceholder(resolveDirectImageHash("2557:5820")),
  vipSidebarBannerImg: imgUrlPlaceholder(
    resolveDirectImageHash("2508:15405") ||
      trackHash("08952db8e38ed6c4b61002341d0617e43e5f30ae")
  ),
  mobileVipHpWidgetImg: imgUrlPlaceholder(
    resolveDirectImageHash("2508:15720") ||
      trackHash("e99076f7933ccc26aaa911fd3fcc809faa125efd")
  ),
  coverBannerImg: imgUrlPlaceholder(
    resolveDirectImageHash("2001:3") ||
      trackHash("73a9751e99eff829db1ffc97bdcf5f2b41b557e0")
  ),
};

// Sidebar Featured & App Banner
const sidebarFeatured = [
  {
    id: "arena",
    title: "Play\nArena",
    img: imgUrlPlaceholder(resolveDirectImageHash("2493:53582")),
  },
  {
    id: "wheel",
    title: "Roata Norocului",
    img: imgUrlPlaceholder(resolveDirectImageHash("2493:53586")),
  },
  {
    id: "promo",
    title: "Promoții",
    img: imgUrlPlaceholder(resolveDirectImageHash("2493:53590")),
  },
];

const sidebarAppBannerImg = imgUrlPlaceholder(resolveDirectImageHash("2034:975"));

// Category tabs (all 13 from 2222:16016 — Pre-login/Logat identical bar!)
const categoryTabs = (children.get("2222:16016") || []).map((c) => {
  const n = byId.get(c.id);
  let label = c.n.name;
  let iconSym = null;
  for (const p of n?.componentPropAssignments || []) {
    const tv = p.value?.textValue?.characters || p.varValue?.value?.textDataValue?.characters;
    if (tv) label = tv;
    const sv = gid(p.value?.guidValue) || gid(p.varValue?.value?.symbolIdValue?.guid);
    if (sv) iconSym = sv;
  }
  return {
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    label,
    svg: iconSym ? extractIconSvg(iconSym) : null,
  };
});

// Sidebar nav groups & resolved SVG icons (from 2236:10019)
function extractSidebarItem(itemId) {
  const n = byId.get(itemId);
  if (!n) return null;
  let label = n.name;
  let iconSym = gid(
    (children.get(gid(n.symbolData?.symbolID)) || []).find((x) =>
      x.n.name?.startsWith("Icon")
    )?.n?.symbolData?.symbolID
  );
  let showBadge = false;
  for (const p of n.componentPropAssignments || []) {
    const tv = p.value?.textValue?.characters || p.varValue?.value?.textDataValue?.characters;
    if (tv) label = tv;
    const sv = gid(p.value?.guidValue) || gid(p.varValue?.value?.symbolIdValue?.guid);
    if (sv) iconSym = sv;
    const bv = p.value?.boolValue ?? p.varValue?.value?.boolValue;
    if (bv === true && !p.defID?.localID?.toString().includes("9")) {
      // checked below cleanly
    }
  }
  // Check Sidebar overrides on 2236:10019 if present
  const sbRoot = byId.get("2236:10019");
  for (const ov of sbRoot?.symbolData?.symbolOverrides || []) {
    if (ov.guidPath?.guids?.length === 1 && gid(ov.guidPath.guids[0]) === itemId) {
      for (const cp of ov.componentPropAssignments || []) {
        const tv = cp.value?.textValue?.characters || cp.varValue?.value?.textDataValue?.characters;
        if (tv) label = tv;
        const sv = gid(cp.value?.guidValue) || gid(cp.varValue?.value?.symbolIdValue?.guid);
        if (sv) iconSym = sv;
      }
    }
  }
  if (label === "VIP Club") showBadge = true;
  return {
    label,
    badge: showBadge ? "NOU" : null,
    svg: iconSym ? extractIconSvg(iconSym) : null,
  };
}

const sidebarGroups = {
  joc: (children.get("2222:15188") || []).map((c) => extractSidebarItem(c.id)).filter(Boolean),
  jocOferteParent: extractSidebarItem("2236:10056"),
  jocOferteSub: (children.get("2266:10648") || []).map((c) => extractSidebarItem(c.id)).filter(Boolean),
  clubExtra: (children.get("2222:15313") || []).map((c) => extractSidebarItem(c.id)).filter(Boolean),
  plati: (children.get("2236:10117") || []).map((c) => extractSidebarItem(c.id)).filter(Boolean),
  contulMeuTop: ["2236:10167", "2236:10181", "2236:10195"].map(extractSidebarItem).filter(Boolean),
  istoricParent: extractSidebarItem("2236:10209"),
  istoricSub: (children.get("2266:10717") || []).map((c) => extractSidebarItem(c.id)).filter(Boolean),
  setariParent: extractSidebarItem("2236:10234"),
  setariSub: (children.get("2266:10788") || [])
    .filter((c) => c.n.type === "INSTANCE")
    .map((c) => extractSidebarItem(c.id))
    .filter(Boolean),
  asistenta: extractSidebarItem("2236:10248"),
};

// Game Card Row Extractor
function extractGameCard(nodeId) {
  const n = byId.get(nodeId);
  if (!n) return null;
  const props = [];
  for (const p of n.componentPropAssignments || []) {
    const tv = p.value?.textValue?.characters || p.varValue?.value?.textDataValue?.characters;
    if (tv) props.push(tv);
  }
  const tree = resolveNode(nodeId);
  const imgs = collectImages(tree);
  const txts = collectTexts(tree);
  const cleanName = n.name
    .replace(/^Top 10 · \d+ · /, "")
    .replace(/ \(provizoriu\)$/i, "");
  let title =
    (props[0] && !/^\d+$/.test(props[0]) ? props[0] : "") || cleanName;
  let provider =
    props.find((p) => p !== title && !/^\d+$/.test(p)) ||
    txts.find((t) => t.text !== title && !/^\d+$/.test(t.text) && t.text.length < 28)?.text ||
    "";
  let imgHash = imgs[0]?.hash;
  if (!imgHash) {
    for (const ov of n.symbolData?.symbolOverrides || []) {
      const fp = ov.fillPaints?.find((p) => p.type === "IMAGE");
      if (fp?.image?.hash) {
        imgHash = trackHash(fp.image.hash);
        break;
      }
    }
  }
  if (!imgHash) return null;
  return {
    title,
    provider,
    img: imgUrlPlaceholder(imgHash),
  };
}

const populareGames = (children.get("2222:6396") || []).map((c) => extractGameCard(c.id)).filter(Boolean);
const top10Games = (children.get("2222:6415") || []).map((c, idx) => {
  const g = extractGameCard(c.id);
  return g ? { rank: idx + 1, ...g } : null;
}).filter(Boolean);
const jackpotRowGames = (children.get("2222:6428") || []).map((c) => extractGameCard(c.id)).filter(Boolean);

// Jackpot Cards Extractor (Homepage 5 + Lobby 10)
function extractJackpotCard(nodeId) {
  const n = byId.get(nodeId);
  if (!n) return null;
  const ovMap = new Map();
  let cardName = n.name;
  let cardBg = "#2b1a3d";
  let cardBg2 = null;
  let glowColor = "#b14bff";

  for (const ov of n.symbolData?.symbolOverrides || []) {
    const lastGid = gid(ov.guidPath?.guids?.[ov.guidPath.guids.length - 1]);
    if (!lastGid) continue;
    if (ov.guidPath?.guids?.length === 1 && lastGid === "2077:53620") {
      if (ov.name) cardName = ov.name;
      const fp = ov.fillPaints?.[0];
      if (fp?.type === "SOLID" && fp.color) cardBg = colorHex(fp.color);
      else if (fp?.type?.startsWith("GRADIENT") && fp.stops?.length) {
        cardBg = colorHex(fp.stops[0].color);
        cardBg2 = colorHex(fp.stops[fp.stops.length - 1].color);
      }
    } else if (lastGid === "2077:53621") {
      const fp = ov.fillPaints?.[0];
      if (fp?.color) glowColor = colorHex(fp.color);
    }
    ovMap.set(lastGid, ov);
  }

  const getImg = (targetGid) => {
    const ov = ovMap.get(targetGid);
    const h =
      ov?.fillPaints?.find((p) => p.type === "IMAGE")?.image?.hash ||
      byId.get(targetGid)?.fillPaints?.find((p) => p.type === "IMAGE")?.image?.hash;
    return h ? imgUrlPlaceholder(trackHash(h)) : "";
  };
  const getTxt = (targetGid, fallback = "") =>
    ovMap.get(targetGid)?.textData?.characters ||
    byId.get(targetGid)?.textData?.characters ||
    fallback;

  // Status badge override on 2135:2681 (or def)
  const tree = resolveNode(nodeId);
  const statusTxts = collectTexts(tree).map((t) => t.text);
  const badge =
    statusTxts.find((t) => ["ON FIRE", "BURN", "HEAT", "HOT", "DROP", "VIP"].includes(t.toUpperCase())) ||
    "ON FIRE";
  const ctaText =
    statusTxts.find((t) => t.toUpperCase().startsWith("VEZI")) || "VEZI TOATE";

  return {
    brand: cardName.replace(/^Jackpot · /, ""),
    provider: getTxt("2077:53629", "EGT Digital"),
    bg: cardBg,
    bg2: cardBg2 || "#18141e",
    glow: glowColor,
    logoImg: getImg("2077:53626"),
    badge,
    tiers: {
      grand: { amount: getTxt("2077:53637", "0,00"), icon: getImg("2077:53633") },
      major: { amount: getTxt("2077:53647", "0,00"), icon: getImg("2077:53643") },
      minor: { amount: getTxt("2077:53658", "0,00"), icon: getImg("2077:53654") },
      mini: { amount: getTxt("2077:53666", "0,00"), icon: getImg("2077:53662") },
    },
    thumbs: [
      getImg("2081:1291"),
      getImg("2081:1294"),
      getImg("2081:1297"),
    ].filter(Boolean),
    ctaText,
  };
}

const jackpotCardsHome = (children.get("2222:6455") || [])
  .map((c) => extractJackpotCard(c.id))
  .filter(Boolean);

const jackpotCardsLobby = (children.get("2336:40731") || [])
  .map((c) => extractJackpotCard(c.id))
  .filter(Boolean);

// Winners Ticker (2222:6466 -> resolveNode children)
function extractWinnersTicker() {
  const tree = resolveNode("2222:6466");
  const items = [];
  for (const c of tree?.children || []) {
    if (c.name !== "Winner item") continue;
    const txts = collectTexts(c).map((t) => t.text);
    const imgs = collectImages(c);
    const amount = txts.find((t) => t.includes("RON")) || "";
    const gameRaw = txts.find((t) => t.startsWith("la ")) || txts[txts.length - 1] || "";
    const user = txts[0] || "Jucător";
    items.push({
      user,
      amount,
      game: gameRaw,
      img: imgUrlPlaceholder(imgs[0]?.hash),
    });
  }
  return items;
}
const winnersTicker = extractWinnersTicker();

// Live RTP Home (2222:6468 Hot, 2222:6469 Cold)
function extractLiveRtpBox(nodeId) {
  const tree = resolveNode(nodeId);
  const boxTitle =
    (byId.get(nodeId)?.componentPropAssignments || [])
      .map((p) => p.value?.textValue?.characters || p.varValue?.value?.textDataValue?.characters)
      .find(Boolean) || tree?.name || "Hourly Hot";
  const rows = [];
  for (const c of tree?.children || []) {
    if (c.name === "Header") continue;
    const txts = collectTexts(c).map((x) => x.text);
    const imgs = collectImages(c);
    const rtp = txts.find((t) => t.includes("%")) || "100.0%";
    const rank = txts.find((t) => /^\d+$/.test(t)) || String(rows.length + 1);
    const title = txts[0] || c.name;
    const provider = txts.find((t) => t !== title && t !== "RTP:" && t !== rtp && t !== rank) || "";
    rows.push({
      rank,
      title,
      provider,
      rtp,
      img: imgUrlPlaceholder(imgs[0]?.hash),
    });
  }
  return { title: boxTitle, rows };
}

const liveRtpHome = {
  hot: extractLiveRtpBox("2222:6468"),
  cold: extractLiveRtpBox("2222:6469"),
  tooltip:
    collectTexts(resolveNode("2222:6470"))[0]?.text ||
    "Hourly Hot / Cold prezintă în timp real jocurile ordonate în funcție de RTP în decurs de 1h.",
};

// Providers 36 columns x 2 tiles = 72 from 2222:6478
const defaultProvImg = resolveDirectImageHash("2090:2");
const providersColumns = (children.get("2222:6478") || []).map((col) => {
  const tiles = (children.get(col.id) || []).map((t) => {
    const tree = resolveNode(t.id);
    const ovImg = (t.n.symbolData?.symbolOverrides || [])
      .flatMap((o) => o.fillPaints || [])
      .find((p) => p.type === "IMAGE")?.image?.hash;
    const hash = trackHash(ovImg) || trackHash(collectImages(tree)[0]?.hash) || trackHash(defaultProvImg);
    const name =
      (t.n.symbolData?.symbolOverrides || []).find((o) => o.name)?.name || t.n.name;
    return {
      name,
      img: imgUrlPlaceholder(hash),
    };
  });
  return tiles;
});

// Spotlights (Jocul săptămânii 2660:37562 & 2660:37563)
function extractSpotlight(nodeId) {
  const tree = resolveNode(nodeId);
  if (!tree) return null;
  const txts = collectTexts(tree).map((t) => t.text);
  const imgs = collectImages(tree);
  return {
    overline: txts.find((t) => t.toUpperCase().includes("JOCUL")) || "JOCUL SĂPTĂMÂNII",
    title: txts.find((t) => !t.toUpperCase().includes("JOCUL") && !t.toUpperCase().includes("JOAC")) || "Fruits & Gold Dice",
    cta: txts.find((t) => t.toUpperCase().includes("JOAC")) || "Joacă acum",
    provLogo: imgUrlPlaceholder(imgs[0]?.hash),
    artImg: imgUrlPlaceholder(imgs[1]?.hash || imgs[0]?.hash),
  };
}
const spotlights = [
  extractSpotlight("2660:37562"),
  extractSpotlight("2660:37563"),
].filter(Boolean);

// Themes 20 cards from 2222:6594
const themes = (children.get("2222:6594") || []).map((c) => {
  const tree = resolveNode(c.id);
  const txts = collectTexts(tree).map((t) => t.text);
  const imgs = collectImages(tree);
  return {
    name: txts[0] || c.n.name.replace("Theme card / ", ""),
    count: txts[1] || "120 jocuri",
    img: imgUrlPlaceholder(imgs[0]?.hash),
  };
});

// Pagina de Categorie Desktop (2336:23653)
const categoryPageGames = [];
for (const row of children.get("2336:23653") || []) {
  for (const ch of children.get(row.id) || []) {
    if (ch.n.type === "INSTANCE" && ch.n.name !== "Section header") {
      const g = extractGameCard(ch.id);
      if (g) categoryPageGames.push(g);
    } else if (ch.n.type === "FRAME") {
      for (const sub of children.get(ch.id) || []) {
        const g = extractGameCard(sub.id);
        if (g) categoryPageGames.push(g);
      }
    }
  }
}

// Live Casino Desktop (all 5 rows in 2381:94959) & Live Category Tabs (2381:94976)
const liveCasinoTabs = [
  { id: "ruleta", label: "Ruletă", svg: extractIconSvg("2191:4921") },
  { id: "blackjack", label: "Blackjack", svg: extractIconSvg("2183:4738") },
  { id: "baccarat", label: "Baccarat", svg: extractIconSvg("2381:97956") },
  { id: "toate-live", label: "Toate Live", svg: extractIconSvg("2381:97978") },
];
const liveCasinoHeaderIcon = extractIconSvg("2183:4690");

const liveCasinoRows = [];
for (const secId of ["2458:2", "2458:271", "2458:516", "2458:761", "2458:1006"]) {
  const sec = byId.get(secId);
  if (!sec) continue;
  const headerNode = (children.get(secId) || []).find((x) => x.n.name === "Section header");
  const title = headerNode ? collectTexts(resolveNode(headerNode.id))[0]?.text || sec.name : sec.name;
  const gamesFrame = (children.get(secId) || []).find((x) => x.n.name === "Games row");
  const games = gamesFrame
    ? (children.get(gamesFrame.id) || []).map((g) => extractGameCard(g.id)).filter(Boolean)
    : [];
  liveCasinoRows.push({ title, games });
}

// Live RTP Page rows (2381:88679 sections -> props: [title, provider, rtp])
const liveRtpPageSections = [];
for (const sec of children.get("2381:88679") || []) {
  if (sec.n.type !== "FRAME") continue;
  const subCh = children.get(sec.id) || [];
  const gamesRow = subCh.find((x) => x.n.name === "Games row");
  if (!gamesRow) continue;
  const secHeader = subCh.find((x) => x.n.name === "Section header");
  const title = secHeader ? collectTexts(resolveNode(secHeader.id))[0]?.text || sec.n.name : sec.n.name;
  const isCold = title.toLowerCase().includes("cold");
  const cards = [];
  for (const g of children.get(gamesRow.id) || []) {
    const rawProps = [];
    for (const p of g.n.componentPropAssignments || []) {
      const tv = p.value?.textValue?.characters || p.varValue?.value?.textDataValue?.characters;
      if (tv) rawProps.push(tv);
    }
    const tree = resolveNode(g.id);
    if (!tree) continue;
    const imgs = collectImages(tree);
    const txts = collectTexts(tree).map((t) => t.text);
    const cardRtp =
      rawProps.find((x) => x.includes("%")) ||
      txts.find((t) => t.includes("%")) ||
      (isCold ? "64.20%" : "112.40%");
    const nonPctProps = rawProps.filter((x) => !x.includes("%"));
    const cardTitle = nonPctProps[0] || g.n.name;
    const cardProvider =
      nonPctProps[1] ||
      txts.find((t) => t !== cardTitle && !t.includes("%") && t !== cardRtp && t.length < 32) ||
      "EGT Digital";
    if (imgs[0]?.hash) {
      cards.push({
        title: cardTitle,
        provider: cardProvider,
        rtp: cardRtp,
        isCold,
        img: imgUrlPlaceholder(imgs[0].hash),
      });
    }
  }
  if (cards.length) liveRtpPageSections.push({ title, isCold, cards });
}

// Live RTP Info Cards (2395:34422: Info · Secțiuni + Info · Actualizare BETA)
const liveRtpInfo = {
  sectiuni: collectTexts(resolveNode("2395:34423")).map((t) => t.text),
  actualizare: collectTexts(resolveNode("2395:34451")).map((t) => t.text),
};

// Move Cold fallback from liveRtpPageSections if Figma's Homepage Cold placeholder copied Hot values
if (liveRtpHome.cold.rows.every((r) => parseFloat(r.rtp) > 100) && liveRtpPageSections[1]?.cards?.length) {
  liveRtpHome.cold.rows = liveRtpPageSections[1].cards.slice(0, 3).map((c, idx) => ({
    rank: String(idx + 1),
    title: c.title,
    provider: c.provider || (idx === 0 ? "Pragmatic Play" : "EGT Digital"),
    rtp: c.rtp,
    img: c.img,
  }));
}

// Homepage Entry Point · Recomandate (2508:14852)
const extractedRecGames = (children.get("2508:14896") || [])
  .slice(1)
  .map((c) => extractGameCard(c.id))
  .filter(Boolean);
const recommendedEntry = {
  title: collectTexts(resolveNode("2508:14853"))[0]?.text || "Recomandate",
  widgetTexts: collectTexts(resolveNode("2508:14897")).map((t) => t.text),
  widgetImg: imgUrlPlaceholder(
    collectImages(resolveNode("2508:14897"))[0]?.hash ||
      trackHash("04adc49ef2dbc0e8f9c224f07819247627bf4f2d")
  ),
  games: extractedRecGames.length ? extractedRecGames : populareGames.slice(0, 8),
  note: byId.get("2508:14968")?.textData?.characters || "",
};

// 15 VIP Bold Duotone Icons (2529:3)
const vipDuotoneIcons = {};
for (const c of children.get("2529:3") || []) {
  const slug = c.n.name
    .replace(/^Icon\/Bold Duotone\//i, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-");
  const svg = extractIconSvg(c.id);
  if (slug && svg) vipDuotoneIcons[slug] = svg;
}

const uiIcons = {
  flame: extractIconSvg("2014:6"),
  fireLinear: extractIconSvg("2112:57988"),
  snowflake: extractIconSvg("2112:57992"),
  play: extractIconSvg("2109:447"),
  infoCircle: extractIconSvg("2014:54"),
  chevronRight: extractIconSvg("2014:70"),
  closeX: extractIconSvg("2173:4703"),
  loto: sidebarGroups.joc.find((x) => x.label === "Loto")?.svg || extractIconSvg("2191:4937"),
};

// Helper to parse tier 6 benefits reliably from Figma 2533:440
function buildTierBenefits(tierName) {
  const rows = [
    "Cashback săptămânal",
    "La fiecare nivel primești",
    "Cadou de ziua ta",
    "Turnee VIP",
    "Retrageri prioritare",
    "Manager VIP dedicat",
  ];
  const unlockCount = { Bronz: 2, Argint: 3, Aur: 4, Platină: 5, Diamant: 6 }[tierName] ?? 2;
  return rows.map((label, idx) => ({ label, unlocked: idx < unlockCount }));
}

// VIP Club Page Data (2537:38229 + 2537:40118 Pre-login + 2666:6148 Mecanica + 2537:44454 Modals)
const vipTiersTree = resolveNode("2538:6688");
const vipCashbackTree = resolveNode("2538:7143");
const vipHowTree = resolveNode("2679:6411");

const howStepsContainer = vipHowTree?.children?.[0]?.children?.length
  ? vipHowTree.children[0].children
  : vipHowTree?.children || [];

const vipClubData = {
  levelStatus: {
    tierName: "Argint 1",
    points: "420 / 600",
    nextHint: "Încă 180 puncte VIP până la Argint 2",
    cashbackAccumulated: "12,60 RON",
    nextReward: "30 RON bonus",
    badgeImg: headerAssets.vipBadge,
  },
  preloginTexts: collectTexts(resolveNode("2537:40122"))
    .map((t) => t.text)
    .filter((t) => t !== "Button" && t !== "Text link"),
  howItWorks: howStepsContainer.map((step) => {
    const t = collectTexts(step).map((x) => x.text);
    const im = collectImages(step)[0]?.hash;
    return {
      title: t[0] || step.name,
      lines: t.slice(1),
      img: im ? imgUrlPlaceholder(im) : "",
    };
  }),
  tiers: (children.get("2533:440") || []).map((c) => {
    const tree = resolveNode(c.id);
    const t = collectTexts(tree).map((x) => x.text);
    const im = collectImages(tree)[0]?.hash;
    const tierName =
      t.find((x) => ["Bronz", "Argint", "Aur", "Platină", "Diamant"].includes(x)) || c.n.name;
    return {
      name: tierName,
      isCurrent: t.includes("NIVELUL TĂU"),
      texts: t,
      benefits: buildTierBenefits(tierName),
      img: im ? imgUrlPlaceholder(im) : "",
    };
  }),
  cashbackTexts: collectTexts(vipCashbackTree).map((x) => x.text),
  faq: ["2536:1527", "2536:1528"].flatMap((colId) =>
    (children.get(colId) || []).map((item) => {
      const texts = [];
      for (const p of item.n.componentPropAssignments || []) {
        const tv = p.value?.textValue?.characters || p.varValue?.value?.textDataValue?.characters;
        if (tv) texts.push(tv);
      }
      return { q: texts[0] || item.n.name, a: texts[1] || "" };
    })
  ),
  mecanicaVip: {
    antet: collectTexts(resolveNode("2666:6149")).map((t) => t.text),
    cards: (children.get("2666:6153") || []).map((c) => ({
      id: c.id,
      name: c.n.name,
      texts: collectTexts(resolveNode(c.id)).map((t) => t.text),
    })),
  },
  vipModals: [
    { id: "rewards", label: "Detalii recompense", nodeId: "2537:44456" },
    { id: "points", label: "Puncte VIP", nodeId: "2537:44599" },
    { id: "levelUp", label: "Nivel nou · Argint 2", nodeId: "2537:44684" },
    { id: "cashback", label: "Cashback creditat · 20 RON", nodeId: "2537:44751" },
  ].map((m) => {
    const tree = resolveNode(m.nodeId);
    const tx = collectTexts(tree)
      .map((t) => t.text)
      .filter((t) => t !== "Button" && t !== "Text link");
    const imgs = collectImages(tree).map((i) => imgUrlPlaceholder(i.hash));
    return { id: m.id, label: m.label, texts: tx, imgs };
  }),
};

// Shop Page Data (2490:6746 & 2490:10221 + Prize Drawers 2498:7450 + Grand Prize 2495:7391 + Popups 2502:8848 + Deposit Missions 2507:9619)
const shopHeroImg = imgUrlPlaceholder(
  resolveDirectImageHash("2490:9862") ||
    trackHash("04adc49ef2dbc0e8f9c224f07819247627bf4f2d")
);
const shopCatsTree = resolveNode("2490:9890");
const shopMissionsTree = resolveNode("2490:12783");

function extractCardObjects(containerTree) {
  if (!containerTree) return [];
  const items = [];
  function walk(node) {
    if (node.size && node.size.x >= 180 && node.size.x <= 600 && node.size.y >= 120) {
      const im = collectImages(node)[0]?.hash;
      const tx = collectTexts(node).map((t) => t.text);
      if (im || tx.length >= 2) {
        items.push({
          title: tx[0] || node.name,
          texts: tx,
          img: im ? imgUrlPlaceholder(im) : "",
        });
        return;
      }
    }
    for (const c of node.children) walk(c);
  }
  for (const c of containerTree.children) walk(c);
  return items;
}

const shopShowcaseItems = [];
for (const row of children.get("2490:785") || []) {
  if (!row.n.name.startsWith("Row")) continue;
  for (const card of children.get(row.id) || []) {
    const tree = resolveNode(card.id);
    const txts = collectTexts(tree).map((t) => t.text);
    const im = collectImages(tree)[0]?.hash;
    shopShowcaseItems.push({
      title: txts[0] || card.n.name,
      points: txts[1] || "11 puncte",
      img: im ? imgUrlPlaceholder(im) : "",
    });
  }
}

const shopClaimedItems = [];
for (const claim of children.get("2490:974") || []) {
  if (claim.n.type !== "INSTANCE") continue;
  const tree = resolveNode(claim.id);
  const txts = collectTexts(tree).map((t) => t.text);
  const im = collectImages(tree)[0]?.hash;
  shopClaimedItems.push({
    user: txts[0] || "Jucător",
    action: txts[1] || "A revendicat",
    prize: txts[2] || txts[1] || "Premiu CashPot",
    time: txts[txts.length - 1] || "acum 5 min",
    img: im ? imgUrlPlaceholder(im) : "",
  });
}

const shopGrandPrize = {
  ribbon: "PREMIUL CEL MARE",
  title: collectTexts(resolveNode("2495:7369")).find((t) => t.text.includes("Bentley"))?.text || "Bentley Continental GT Speed V8 Hybrid",
  price: "7.777.777 puncte",
  stock: "În stoc: 1",
  missing: "Îți lipsesc 7.777.677 puncte",
  img: imgUrlPlaceholder(
    resolveDirectImageHash("2495:7370") ||
      trackHash("ac7f09d815e7a57cce54cc7b0d2f827cd71f78f0")
  ),
};

// Extract all 5 Prize Drawers from 2498:7450
function extractPrizeDrawer(frameId, category) {
  const drawerNode = (children.get(frameId) || []).find((c) => c.n.name === "Prize drawer");
  if (!drawerNode) return { category, items: [] };
  const bodyNode = (children.get(drawerNode.id) || []).find((c) => c.n.name === "Body");
  const gridNode = (children.get(bodyNode?.id) || [])[0];
  const items = [];
  for (const row of children.get(gridNode?.id) || []) {
    for (const card of children.get(row.id) || []) {
      if (/^Spacer/i.test(card.n.name)) continue;
      if (card.n.name === "Grand prize card" || gid(card.n.symbolData?.symbolID) === "2495:7369") {
        items.push({
          id: "grand-prize-bentley",
          isGrandPrize: true,
          ribbon: shopGrandPrize.ribbon,
          title: shopGrandPrize.title,
          subtitle: "",
          category,
          points: 7777777,
          pointsLabel: shopGrandPrize.price,
          stock: shopGrandPrize.stock,
          missing: shopGrandPrize.missing,
          img: shopGrandPrize.img,
        });
        continue;
      }
      const tree = resolveNode(card.id);
      if (!tree) continue;
      const tx = collectTexts(tree)
        .map((t) => t.text)
        .filter((t) => t !== "Button" && t !== "Preț:");
      const im = collectImages(tree)[0]?.hash;
      const ptsText = tx.find((t) => /\bpuncte\b/i.test(t) && !/lipsesc/i.test(t)) || "100 puncte";
      const ptsNum = parseInt(ptsText.replace(/\./g, ""), 10) || 100;
      const stock = tx.find((t) => /În stoc/i.test(t)) || "";
      const missing = tx.find((t) => /lipsesc/i.test(t)) || "";
      const title = tx[0] || card.n.name;
      const subtitle = tx.find(
        (t) =>
          t !== title &&
          t !== ptsText &&
          t !== stock &&
          t !== missing &&
          t !== "Revendică" &&
          t.length < 48
      ) || "";
      if (title && !/^Frame/i.test(title) && !/^Spacer/i.test(title)) {
        items.push({
          id: `${category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${items.length}`,
          title,
          subtitle,
          category,
          points: ptsNum,
          pointsLabel: ptsText,
          stock,
          missing,
          img: im ? imgUrlPlaceholder(im) : "",
        });
      }
    }
  }
  return { category, items };
}

const prizeDrawers = [
  extractPrizeDrawer("2498:7663", "Bani Bonus"),
  extractPrizeDrawer("2498:7950", "Premii Cash"),
  extractPrizeDrawer("2498:8228", "Rotiri Gratuite"),
  extractPrizeDrawer("2498:8669", "Rotiri Gratuite VIP"),
  extractPrizeDrawer("2498:8947", "Premii VIP"),
];

const shopMissionsList = (children.get("2488:734") || []).map((c) => {
  const tree = resolveNode(c.id);
  const tx = collectTexts(tree).map((t) => t.text).filter((t) => t !== "Button");
  const title = tx[0] || c.n.name;
  const points = tx.find((t) => /^\+\d+p/i.test(t)) || "+5p";
  const repeatable = tx.includes("Repetabil");
  const progress = tx.find((t) => /^\d+\s*\//.test(t)) || "0 / 1";
  const desc = tx.find((t) => t !== title && t !== points && t !== progress && t !== "Repetabil") || "";
  const im = collectImages(tree)[0]?.hash;
  return {
    title,
    desc,
    progress,
    points,
    repeatable,
    cta: title.toLowerCase().includes("depun") ? "Depune" : title.toLowerCase().includes("joac") ? "Joacă" : "Revendică",
    texts: tx,
    img: im ? imgUrlPlaceholder(im) : "",
  };
});

const shopHeroCopy = {
  loggedTitle: "Depune, joacă și finalizează misiuni pentru a câștiga puncte",
  pointsLabel: "PUNCTELE MELE",
  pointsDisplay: "241.604",
  ctaLabel: "Câștigă puncte",
  preloginTitle: "Câștigă puncte. Revendică premii.",
  preloginSub: "Depune, joacă și finalizează misiuni pentru a câștiga puncte.",
  totalPrizesLabel: "Total premii",
  totalPrizesValue: "241.604",
  totalValueLabel: "Valoarea premiilor",
  totalValueAmount: "+7,8M RON",
};

const shopAppBanner = {
  title: byId.get("2487:226")?.textData?.characters || "Descarcă aplicația Cashpot și câștigă puncte în fiecare zi",
  bullets: collectTexts(resolveNode("2487:227")).map((t) => t.text),
  qrLabel: byId.get("2487:241")?.textData?.characters || "Scanează codul QR",
};

const shopNextGoalTree = resolveNode("2490:10182");
const shopNextGoal = {
  texts: collectTexts(shopNextGoalTree)
    .map((t) => t.text)
    .filter((t) => t !== "Button"),
  img: imgUrlPlaceholder(
    collectImages(shopNextGoalTree)[0]?.hash ||
      trackHash("f4ee59cf5c9564360518566970235856a74d83f0")
  ),
};

const streakTexts = collectTexts(resolveNode("2504:9475"))
  .map((t) => t.text)
  .filter((t) => t !== "Button");

const shopPopups = [
  { id: "upsell", label: "Upsell revendicare", nodeId: "2502:8850" },
  { id: "login-app", label: "Login în aplicație", nodeId: "2502:8928" },
  { id: "daily-exit", label: "Depunere zilnică (exit)", nodeId: "2502:8972" },
  { id: "mission-done", label: "Misiune completă", nodeId: "2502:9016" },
  { id: "deposit-bonus", label: "Bonus fiecare depunere", nodeId: "2502:9060" },
  { id: "congrats", label: "Felicitare revendicare", nodeId: "2502:9104" },
  { id: "almost", label: "Ești aproape", nodeId: "2502:9148" },
  { id: "rating", label: "Rating experiență", nodeId: "2502:9280" },
  { id: "feedback", label: "Feedback", nodeId: "2502:9330" },
  { id: "qr-app", label: "QR aplicație", nodeId: "2502:9402" },
  { id: "how-points", label: "Cum câștig puncte", nodeId: "2502:9421" },
].map((p) => {
  const tree = resolveNode(p.nodeId);
  return {
    id: p.id,
    label: p.label,
    texts: collectTexts(tree)
      .map((t) => t.text)
      .filter((t) => t !== "Button" && t !== "Text link" && t !== "LABEL"),
    imgs: collectImages(tree).map((i) => imgUrlPlaceholder(i.hash)),
  };
});

const depositMissionsModal = {
  amounts: [60, 100, 199, 500, 900],
  title: "Fă o depunere",
  subtitle: "Fiecare depunere poate fi răsplătită! Alege-ți mai jos bonusul.",
  methodLabel: "ALEGE METODA",
  methodValue: "Plată cu cardul",
  methodAction: "Schimbă",
  sumLabel: "SUMĂ (RON)",
  missionsTitle: "Misiuni active (2)",
  missions: [
    { title: "Depune minim 100 RON", minAmount: 100, progress: "", points: "+5p" },
    { title: "Depune 7 zile consecutive, minim 50 RON", minAmount: 50, progress: "(3/7)", points: "+40p" },
  ],
  bonusSectionTitle: "Alege bonusul",
  bonuses: [
    { id: "b50", badge: "", headline: "50\nRotiri Gratuite", game: "la Shining Crown", extra: "+100% Bonus până la 1.500 RON", minText: "Depunere minimă 50 RON", minAmount: 50 },
    { id: "b125", badge: "CEA MAI BUNĂ OFERTĂ", headline: "125\nRotiri Gratuite", game: "la Shining Crown", extra: "+100% Bonus până la 1.500 RON", minText: "Depunere minimă 100 RON", minAmount: 100 },
    { id: "none", badge: "", headline: "Fără bonus de bun venit", game: "", extra: "", minText: "", minAmount: 0 },
  ],
  submitLabel: "Depune",
  taxNote: "Taxa de 2% este adăugată la depunerea ta.",
  laterLabel: "Depune mai târziu",
  golTexts: collectTexts(resolveNode("2507:9621"))
    .map((t) => t.text)
    .filter((t) => t !== "Button"),
  fullTexts: collectTexts(resolveNode("2507:10200"))
    .map((t) => t.text)
    .filter((t) => t !== "Button"),
};

// Flatten all real prize drawer items for Shop grid (plus grand prize fallback if needed)
const drawerFlattened = prizeDrawers.flatMap((d) => d.items);
const shopAllPrizes = drawerFlattened.length
  ? drawerFlattened
  : [
      { id: "airpods", title: "Apple AirPods Pro", category: "Premii VIP", points: 4000, stock: "În stoc: 100", img: imgUrlPlaceholder(trackHash("f4ee59cf5c9564360518566970235856a74d83f0")) },
      { id: "watch", title: "Apple Watch Ultra 3", category: "Premii VIP", points: 15000, stock: "În stoc: 10", img: imgUrlPlaceholder(trackHash("ecc4ab87295215acb54636e5d2377ff1712b0b96")) },
      { id: "iphone", title: "iPhone 17", category: "Premii VIP", points: 16000, stock: "În stoc: 15", img: imgUrlPlaceholder(trackHash("ab7f78604f6538968b91a5cf49725d27fcaf6334")) },
      { id: "tesla", title: "Tesla Model Y", category: "Premii VIP", points: 777777, stock: "În stoc: 1", img: imgUrlPlaceholder(trackHash("0e5376d3814c8c2ed016e70e5d65cd0efdaa68c6")) },
      { id: "bentley", title: "Bentley Continental GT Speed V8 Hybrid", category: "Premii VIP", points: 7777777, stock: "În stoc: 1", img: imgUrlPlaceholder(trackHash("ac7f09d815e7a57cce54cc7b0d2f827cd71f78f0")) },
    ];

const stickyBars = {
  streak: byId.get("2504:9434")?.textData?.characters || "Nu rata depunerea de azi!",
  nextPrize: byId.get("2504:9450")?.textData?.characters || "Mai ai nevoie de 55 puncte",
  ctaStreak: "Continuă streak-ul",
  ctaPoints: "Câștigă puncte",
};

const loginModalTexts = collectTexts(resolveNode("2505:9578"))
  .map((t) => t.text)
  .filter((t) => t !== "Button" && t !== "Text link");

const defaultCatCounts = {
  "Bani Bonus": "66.850 premii",
  "Premii Cash": "6.685 premii",
  "Rotiri Gratuite": "166.500 premii",
  "Rotiri Gratuite VIP": "1.100 premii",
  "Premii VIP": "304 premii",
};
const shopCategories = extractCardObjects(shopCatsTree).map((c) => ({
  ...c,
  count: c.texts.find((t) => /\d[\d.]*\s*premii/i.test(t)) || defaultCatCounts[c.title] || "",
  cta: "Vezi detalii",
}));

const shopData = {
  heroImg: shopHeroImg,
  heroCopy: shopHeroCopy,
  appBanner: shopAppBanner,
  categories: shopCategories,
  showcase: shopShowcaseItems,
  missions: shopMissionsList.length ? shopMissionsList : extractCardObjects(shopMissionsTree),
  claimed: shopClaimedItems,
  allPrizes: shopAllPrizes,
  prizeDrawers,
  grandPrize: shopGrandPrize,
  nextGoal: shopNextGoal,
  streakTexts,
  stickyBars,
  loginModalTexts,
  shopPopups,
  depositMissionsModal,
  phoneMockup: imgUrlPlaceholder(trackHash("f86a8ffd76818f97cc1abbcc209022f10c6425ea")),
  qrCode: imgUrlPlaceholder(trackHash("6e3c4022d377109d67cba1272a7aedcc46cd320f")),
};

function directOrSubImg(nid) {
  const direct = byId.get(nid)?.fillPaints?.find((f) => f.visible !== false && f.image?.hash)?.image?.hash;
  if (direct) return imgUrlPlaceholder(trackHash(direct));
  const sub = collectImages(resolveNode(nid))[0]?.hash;
  return sub ? imgUrlPlaceholder(trackHash(sub)) : "";
}

// Balance Drawer (2296:30457 Desktop / 2336:22792 Mobile)
const balanceDrawerTree = resolveNode("2296:30457");
const balanceDrawerData = {
  greetingTitle: "Hello, Name",
  greetingSub: "Please see your balance details below:",
  totalLabel: "Balanță",
  totalValue: "12000.00 RON",
  cashLabel: "Cash",
  cashValue: "7000.00 RON",
  bonusLabel: "Bonus",
  bonusValue: "5000.00 RON",
  bonuses: [
    { label: "Bonus 1", pct: 3, amount: "1.000,00 RON" },
    { label: "Bonus 2", pct: 42, amount: "2.500,00 RON" },
    { label: "Bonus 3", pct: 82, amount: "1.500,00 RON" },
  ],
  bonusNote: "Bonusurile vor fi plătite la 100%",
  withdrawalsLabel: "Retrageri în așteptare",
  withdrawalsValue: "25000.00 RON",
  cancelWithdrawalsLabel: "Anulează retrageri",
  orLabel: "SAU",
  depositLabel: "Depunere",
  icons: {
    arrowBack: extractIconSvg("172:2883"),
    close: extractIconSvg("172:2888"),
    wallet: extractIconSvg("2202:5522"),
    pendingWithdrawal: extractIconSvg("2332:31076"),
    wheel: extractIconSvg("2335:16407"),
    sport: extractIconSvg("2191:4929"),
    info: extractIconSvg("2014:54"),
    chevronUp: extractIconSvg("2296:30328") || extractIconSvg("2014:76"),
    spins: extractIconSvg("2194:4989"),
    clock: extractIconSvg("2014:44"),
    star: extractIconSvg("2014:30"),
  },
  rewardSections: [
    {
      id: "free-spins",
      title: "Rotiri gratuite",
      total: "90",
      iconKey: "spins",
      items: [
        { img: directOrSubImg("2296:30545"), badge: "30" },
        { img: directOrSubImg("2296:30549"), badge: "30" },
        { img: directOrSubImg("2296:30553"), badge: "30" },
      ],
    },
    {
      id: "time-spins",
      title: "Rotiri contra timp",
      total: "140 sec",
      iconKey: "clock",
      items: [
        { img: directOrSubImg("2296:30566"), badge: "90 sec" },
        { img: directOrSubImg("2296:30570"), badge: "32 sec" },
        { img: directOrSubImg("2296:30574"), badge: "18 sec" },
      ],
    },
    {
      id: "guaranteed-spins",
      title: "Rotiri cu câștig garantat",
      total: "∞",
      iconKey: "spins",
      items: [
        { img: directOrSubImg("2296:30587"), badge: "" },
        { img: directOrSubImg("2296:30591"), badge: "" },
        { img: directOrSubImg("2296:30595"), badge: "" },
      ],
    },
    {
      id: "special-spins",
      title: "Speciale",
      total: "2",
      iconKey: "star",
      items: [
        { img: directOrSubImg("2296:30608"), badge: "2" },
      ],
    },
    {
      id: "wheel-spins",
      title: "Roata Norocului",
      total: "1",
      iconKey: "wheel",
      items: [
        { img: directOrSubImg("2296:30621"), overlayImg: directOrSubImg("2296:30624"), badge: "1" },
      ],
    },
    {
      id: "free-bet",
      title: "Pariu Gratis",
      total: "1",
      iconKey: "sport",
      freeBetTicket: { amount: "5000 RON", badge: "1" },
      items: [],
    },
  ],
  greeting: collectTexts(resolveNode("2296:30458")).map((t) => t.text),
  balanceInfo: collectTexts(resolveNode("2296:30461")).map((t) => t.text),
  withdrawals: collectTexts(resolveNode("2296:30518")).map((t) => t.text),
  freeSpins: collectTexts(resolveNode("2296:30534")).map((t) => t.text),
  allTexts: collectTexts(balanceDrawerTree).map((t) => t.text),
};

// Account Menu Data (2263:10360 / 2296:19907)
const accountMenuData = {
  username: "Nume utilizator",
  depositCta: "Depunere",
  closeIcon: extractIconSvg("2173:4703"),
  chevronDown: extractIconSvg("2014:76"),
  groups: [
    {
      id: "cont",
      items: [
        { id: "info", label: "Informații personale", svg: extractIconSvg("2236:9723") },
        { id: "depunere", label: "Depunere", svg: extractIconSvg("2222:15486"), action: "deposit-missions" },
        { id: "retragere", label: "Retragere", svg: extractIconSvg("2236:9711") },
      ],
    },
    {
      id: "bonusuri",
      items: [
        {
          id: "bonusuri-acc",
          label: "Bonusuri",
          svg: extractIconSvg("2184:5908"),
          children: ["Bonusurile mele", "Bonusuri active", "Bonusuri încheiate", "Cod bonus"],
        },
      ],
    },
    {
      id: "istoric",
      items: [
        { id: "documente", label: "Documentele mele", svg: extractIconSvg("2222:15531") },
        { id: "balanta", label: "Balanță", svg: extractIconSvg("2202:5522"), action: "balance" },
        {
          id: "istoric-acc",
          label: "Istoricul meu",
          svg: extractIconSvg("2236:9750"),
          children: ["Joc", "Depunere", "Retragere", "Retrageri în așteptare", "Activitate"],
        },
      ],
    },
    {
      id: "setari",
      items: [
        { id: "asistenta", label: "Asistență", svg: extractIconSvg("2191:4976") },
        {
          id: "setari-acc",
          label: "Setări",
          svg: extractIconSvg("2236:9758"),
          children: [
            "Confidențialitate",
            "Schimbare parolă",
            "Cont",
            "Joc responsabil",
            "Limite de depunere",
            "Chestionar joc responsabil",
            "Mai multe informații",
          ],
        },
        { id: "deconectare", label: "Deconectare", svg: extractIconSvg("2236:9766"), action: "logout" },
      ],
    },
  ],
};

// Search Modal (2184:6341 & Mobile 2296:28585)
const searchTree = resolveNode("2184:6341");
const searchImgs = collectImages(searchTree);
const searchModalData = {
  texts: collectTexts(searchTree)
    .map((t) => t.text)
    .filter((t) => t !== "Button" && t !== "Text link"),
  spotlightImg: imgUrlPlaceholder(searchImgs[0]?.hash || trackHash(collectImages(resolveNode("2222:6396"))[0]?.hash)),
  suggestions: ["Fruit", "Fruity", "Fruits Go", "Fruitopolis", "Fruit Shop Megaways"],
  mobileSuggestions: ["Sweet Bonanza 1000", "Gates of Olympus 1000", "Big Bass Splash", "Book of Ra", "Shining Crown", "Burning Hot"],
  refreshSvg: extractIconSvg("2173:4710"),
  mostSearched: populareGames.slice(0, 6),
  mostPlayed: jackpotRowGames.slice(0, 6),
};

// Prelander Data (2203:5522 + stepper + 3 dark banners)
function extractFeatureBanner(nodeId, fallbackImg) {
  const tree = resolveNode(nodeId);
  const tx = collectTexts(tree)
    .map((t) => t.text)
    .filter((t) => t !== "Button");
  const im = collectImages(tree)[0]?.hash;
  return { texts: tx, img: im ? imgUrlPlaceholder(im) : fallbackImg };
}

const prelanderData = {
  hero: extractBannerItem("2203:5522") || preloginHero.main,
  stepper: collectTexts(resolveNode("2203:5889")).map((t) => t.text),
  jocuriNoi: ((children.get("2203:6004") || []).map((c) => extractGameCard(c.id)).filter(Boolean)).length
    ? (children.get("2203:6004") || []).map((c) => extractGameCard(c.id)).filter(Boolean)
    : populareGames.slice(0, 10),
  jocuriPopulare: (children.get("2203:6104") || []).map((c) => extractGameCard(c.id)).filter(Boolean),
  featureBanners: [
    extractFeatureBanner("2203:5954", secondaryBanners[0]?.img || preloginHero.main?.img || ""),
    extractFeatureBanner("2203:6056", populareGames[0]?.img || ""),
    extractFeatureBanner("2203:6194", liveCasinoRows[0]?.games[0]?.img || secondaryBanners[1]?.img || ""),
  ],
};

// Design System tokens & specimens (0:1 + 2529:3)
const designSystem = {
  colors: [
    { token: "bg / canvas", hex: "#0e0c10" },
    { token: "surface / deep", hex: "#16131a" },
    { token: "surface / card", hex: "#1f1b24" },
    { token: "surface / elevated", hex: "#27222d" },
    { token: "border / active", hex: "#464050" },
    { token: "text / muted", hex: "#8f84a4" },
    { token: "text / secondary", hex: "#d2cddb" },
    { token: "text / primary", hex: "#ffffff" },
    { token: "brand / gold", hex: "#f2b94b" },
    { token: "accent / gold-soft", hex: "#eeb665" },
    { token: "accent / purple", hex: "#6000c7" },
    { token: "status / hot-green", hex: "#22c55e" },
    { token: "status / cold-blue", hex: "#38bdf8" },
    { token: "status / alert-red", hex: "#ed3030" },
  ],
  typography: [
    { role: "Display H1", size: "32px / 800", sample: "Depune, joacă și câștigă premii VIP" },
    { role: "Section H2", size: "20px / 800", sample: "Jackpots · Hourly Hot · Hourly Cold" },
    { role: "Card Title H3", size: "16px / 700", sample: "Burning Hot Extreme Clover" },
    { role: "Body Medium", size: "14px / 600", sample: "1 punct VIP la fiecare 10 RON depuși" },
    { role: "Meta / Caption", size: "11.5px / 700", sample: "Actualizare live: 3s (1h) / 3m (24h)" },
  ],
};

// Mobile Bottom Nav Icons (2149:2878)
const mobileBottomNav = {
  tabs: [
    { id: "slots", label: "Slots", svg: extractIconSvg("2194:4989") },
    { id: "live", label: "Live", svg: extractIconSvg("2191:4921") },
    { id: "menu", label: "Menu", svg: extractIconSvg("2149:2876"), isCenter: true },
    { id: "sport", label: "Sport", svg: extractIconSvg("2194:4997") || sidebarGroups.joc[2]?.svg },
    { id: "cont", label: "Cont", svg: extractIconSvg("2194:5000") || sidebarGroups.contulMeuTop[0]?.svg },
  ],
};

// Footer (2017:375 & 2465:48627 USP)
const footerTree = resolveNode("2017:375");
const footerData = {
  uspItems: [
    { text: "Depuneri și retrageri rapide", svg: extractIconSvg("2202:5522") },
    { text: "Promoții și turnee în fiecare săptămână", svg: extractIconSvg("2191:4912") },
    { text: "Cazino Live cu dealeri reali", svg: extractIconSvg("2381:97978") },
    { text: "[număr] de jocuri de la furnizori licențiați", svg: extractIconSvg("2183:4763") },
  ],
  storeBadges: [
    imgUrlPlaceholder(trackHash("b019a520739b750504b2a8841dd8d241e8aa9cba")),
    imgUrlPlaceholder(trackHash("a51744a2e3e3527355e5a1e6ec6236da50a9f3af")),
    imgUrlPlaceholder(trackHash("99d06a5cdeea0a67fbf3745ea4bf5aaaed502234")),
  ].filter(Boolean),
  socialIcons: [extractIconSvg("2092:19"), extractIconSvg("2092:23")].filter(Boolean),
  onjn: imgUrlPlaceholder(trackHash("baca0023beaee405928d2ee88fd2d3466d4ac3f9")),
  anpc: imgUrlPlaceholder(trackHash("7fa777e2ea734e4a766293e4ef3669f2d8ce1f74")),
  texts: collectTexts(footerTree).map((t) => t.text),
};

// ── 4. Extract All Referenced Images to /public/figma-test/img/ ───
function detectExt(buf) {
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return ".png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return ".jpg";
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP")
    return ".webp";
  if (buf.slice(0, 200).toString("utf8").includes("<svg")) return ".svg";
  return ".png";
}

const hashToUrl = {};
let extractedCount = 0;
let skippedCount = 0;
let totalBytes = 0;

for (const hash of usedHashes) {
  // Reuse if already extracted under any extension
  const existing = [".png", ".jpg", ".webp", ".svg"].find((ext) => {
    const p = path.join(IMG_OUT_DIR, hash + ext);
    return fs.existsSync(p) && fs.statSync(p).size > 0;
  });
  if (existing) {
    hashToUrl[hash] = `/figma-test/img/${hash}${existing}`;
    totalBytes += fs.statSync(path.join(IMG_OUT_DIR, hash + existing)).size;
    skippedCount++;
    continue;
  }
  const imgBuf = execFileSync("unzip", ["-p", FIG_PATH, `images/${hash}`], {
    maxBuffer: 50 * 1024 * 1024,
  });
  const ext = detectExt(imgBuf);
  const outPath = path.join(IMG_OUT_DIR, `${hash}${ext}`);
  fs.writeFileSync(outPath, imgBuf);
  hashToUrl[hash] = `/figma-test/img/${hash}${ext}`;
  totalBytes += imgBuf.length;
  extractedCount++;
}

// Build final JSON and replace __IMG__<hash>__ with real /figma-test/img/<hash>.<ext> URL
const rawSpec = {
  headerAssets,
  topNavIcons,
  uiIcons,
  vipDuotoneIcons,
  sidebarFeatured,
  sidebarAppBannerImg,
  sidebarGroups,
  secondaryBanners,
  preloginHero,
  categoryTabs,
  populareGames,
  recommendedEntry,
  top10Games,
  jackpotRowGames,
  jackpotCardsHome,
  jackpotCardsLobby,
  winnersTicker,
  liveRtpHome,
  liveRtpPageSections,
  liveRtpInfo,
  providersColumns,
  spotlights,
  themes,
  categoryPageGames,
  liveCasinoTabs,
  liveCasinoHeaderIcon,
  liveCasinoRows,
  vipClubData,
  shopData,
  balanceDrawerData,
  accountMenuData,
  searchModalData,
  prelanderData,
  designSystem,
  mobileBottomNav,
  footerData,
};

let jsonStr = JSON.stringify(rawSpec, null, 2);
jsonStr = jsonStr.replace(/__IMG__([0-9a-f]{40})__/gi, (_, h) => hashToUrl[h] || "");

const jsFile = `// Auto-generated from Cashpot_test.fig by app/scripts/extract-cashpot-test.cjs\nexport const CASHPOT_FIGMA_SPEC = ${jsonStr};\n`;
fs.writeFileSync(SPEC_OUT_PATH, jsFile, "utf8");

console.log("SPEC WRITTEN:", SPEC_OUT_PATH);
console.log("UNIQUE IMAGES:", usedHashes.size, "EXTRACTED:", extractedCount, "CACHED:", skippedCount);
console.log("TOTAL IMG SIZE (MB):", (totalBytes / (1024 * 1024)).toFixed(2));
console.log("SUMMARY COUNTS:", {
  secondaryBanners: secondaryBanners.length,
  categoryTabs: categoryTabs.length,
  populareGames: populareGames.length,
  recommendedGames: recommendedEntry.games.length,
  top10Games: top10Games.length,
  jackpotCardsHome: jackpotCardsHome.length,
  jackpotCardsLobby: jackpotCardsLobby.length,
  winnersTicker: winnersTicker.length,
  providersCols: providersColumns.length,
  spotlights: spotlights.length,
  themes: themes.length,
  categoryPageGames: categoryPageGames.length,
  liveCasinoRows: liveCasinoRows.map((r) => `${r.title}:${r.games.length}`),
  liveRtpPageSections: liveRtpPageSections.map((s) => `${s.title}:${s.cards.length}`),
  vipDuotoneIcons: Object.keys(vipDuotoneIcons).length,
  vipTiers: vipClubData.tiers.length,
  vipMecanicaCards: vipClubData.mecanicaVip.cards.length,
  vipModals: vipClubData.vipModals.length,
  prizeDrawers: prizeDrawers.map((d) => `${d.category}:${d.items.length}`),
  shopPopups: shopData.shopPopups.length,
  prelanderBanners: prelanderData.featureBanners.length,
});
