import { unzipSync } from 'fflate';
import { stateKey } from '../minecraft/codec.js';
import { parseOBJ, parseMTL } from '../minecraft/obj.js';
export function fallback(state) {
  const name = state.Name,
    p = state.Properties || {},
    faces = () =>
      Object.fromEntries(
        ['east', 'west', 'up', 'down', 'north', 'south'].map((k) => [k, { texture: null }]),
      );
  let elements = [{ from: [0, 0, 0], to: [16, 16, 16], faces: faces() }],
    angle = 0;
  if (/_sail$/.test(name)) {
    elements = [{ from: [0, 0, 7.5], to: [16, 16, 8.5], faces: faces() }];
    angle = { north: 0, south: 180, east: 270, west: 90 }[p.facing] || 0;
  }
  if (/slab$/.test(name) && p.type !== 'double')
    elements = [
      {
        from: [0, p.type === 'top' ? 8 : 0, 0],
        to: [16, p.type === 'top' ? 16 : 8, 16],
        faces: faces(),
      },
    ];
  if (/stairs$/.test(name)) {
    const top = p.half === 'top';
    elements = [
      { from: [0, top ? 8 : 0, 0], to: [16, top ? 16 : 8, 16], faces: faces() },
      { from: [0, top ? 0 : 8, 8], to: [16, top ? 8 : 16, 16], faces: faces() },
    ];
    angle = { north: 180, east: 270, south: 0, west: 90 }[p.facing] || 0;
  }
  if (/_door$/.test(name)) {
    elements = [{ from: [0, 0, 0], to: [16, 16, 3], faces: faces() }];
    angle =
      ({ north: 0, east: 270, south: 180, west: 90 }[p.facing] || 0) +
      (p.open === 'true' ? (p.hinge === 'right' ? -90 : 90) : 0);
  }
  if (/fence$/.test(name))
    elements = [
      { from: [6, 0, 6], to: [10, 16, 10], faces: faces() },
      { from: [0, 5, 7], to: [16, 8, 9], faces: faces() },
      { from: [0, 12, 7], to: [16, 15, 9], faces: faces() },
    ];
  if (/lantern$/.test(name))
    elements = [
      { from: [5, 1, 5], to: [11, 10, 11], faces: faces() },
      { from: [4, 0, 4], to: [12, 2, 12], faces: faces() },
    ];
  if (/pane$/.test(name))
    elements = [
      { from: [7, 0, 0], to: [9, 16, 16], faces: faces() },
      { from: [0, 0, 7], to: [16, 16, 9], faces: faces() },
    ];
  if (/water$/.test(name)) elements = [{ from: [0, 0, 0], to: [16, 15, 16], faces: faces() }];
  if (/grass|petals|flower|sapling|fern/.test(name) && !/_block$/.test(name))
    elements = [{ from: [4, 0, 4], to: [12, 8, 12], faces: faces() }];
  return {
    id: name,
    state,
    parts: [{ x: 0, y: angle, elements }],
    issues: ['简化方块模型；附加对应资源文件后可使用真实静态模型。'],
    missing: true,
    full:
      elements.length === 1 &&
      elements[0].to.join(',') === '16,16,16' &&
      elements[0].from.join(',') === '0,0,0',
    alpha: /glass|water|ice/.test(name) ? 'transparent' : 'opaque',
  };
}
export class Resources {
  constructor() {
    this.files = new Map();
    this.cache = new Map();
    this.sources = [];
    this.saved = { models: {}, images: {}, textures: {} };
    this.version = 0;
    this.partialVersion = 0;
    this.summaryCache = null;
  }
  addZip(bytes, name) {
    const entries = unzipSync(bytes, {
      filter: (file) => file.name.startsWith('assets/') && !file.name.endsWith('/'),
    });
    for (const [key, value] of Object.entries(entries)) this.files.set(key, value);
    this.sources.push({ name, count: Object.keys(entries).length });
    this.cache.clear();
    this.version++;
    this.summaryCache = null;
    return this.summary();
  }
  json(key) {
    try {
      const bytes = this.files.get(key);
      return bytes ? JSON.parse(new TextDecoder().decode(bytes)) : {};
    } catch {
      return {};
    }
  }
  summary() {
    return (
      this.summaryCache ||
      (this.summaryCache = {
        sources: this.sources,
        resources: this.files.size,
        blocks: this.catalogue('').length,
        embeddedModels: Object.keys(this.saved.models).length,
      })
    );
  }
  catalogue(q) {
    const names = {};
    for (const language of ['en_us', 'zh_cn'])
      for (const key of this.files.keys())
        if (key.endsWith('/lang/' + language + '.json')) Object.assign(names, this.json(key));
    const items = [];
    for (const key of this.files.keys()) {
      if (!key.includes('/blockstates/') || !key.endsWith('.json')) continue;
      const ns = key.split('/')[1],
        path = key.split('/blockstates/')[1].slice(0, -5),
        id = ns + ':' + path,
        label = names['block.' + ns + '.' + path.replaceAll('/', '.')] || path;
      if ((id + ' ' + label).toLowerCase().includes(q.toLowerCase())) items.push({ id, label });
    }
    return items.sort((a, b) => a.id.localeCompare(b.id));
  }
  resolve(name, seen = new Set()) {
    if (seen.has(name) || seen.size > 32) return {};
    seen.add(name);
    const [ns, path] = name.includes(':') ? name.split(':') : ['minecraft', name];
    const model = this.json('assets/' + ns + '/models/' + path + '.json'),
      parent =
        model.parent && !model.parent.startsWith('builtin/')
          ? this.resolve(model.parent, seen)
          : {};
    return { ...parent, ...model, textures: { ...parent.textures, ...model.textures } };
  }
  partial(name, orientation = {}) {
    const key = 'partial:' + name + '|' + JSON.stringify(orientation);
    if (this.cache.has(key)) return this.cache.get(key);
    if (
      this.saved.models[key] &&
      !this.files.has('assets/' + name.split(':')[0] + '/models/' + name.split(':')[1] + '.json')
    ) {
      const saved = this.saved.models[key];
      this.cache.set(key, saved);
      if (!saved.missing) this.partialVersion++;
      return saved;
    }
    const m = this.resolve(name),
      tex = (ref) => {
        const seen = new Set();
        while (ref?.startsWith('#')) {
          if (seen.has(ref)) return null;
          seen.add(ref);
          ref = m.textures?.[ref.slice(1)];
        }
        if (!ref) return null;
        const [ns, path] = ref.includes(':') ? ref.split(':') : ['minecraft', ref];
        return 'assets/' + ns + '/textures/' + path + '.png';
      },
      elements = (m.elements || []).map((e) => ({
        ...e,
        faces: Object.fromEntries(
          Object.entries(e.faces || {}).map(([d, f]) => [d, { ...f, texture: tex(f.texture) }]),
        ),
      }));
    let triangles = [];
    const issues = [];
    if (m.loader === 'neoforge:obj' && m.model) {
      const [ns, path] = m.model.split(':'),
        objKey = 'assets/' + ns + '/' + path,
        bytes = this.files.get(objKey);
      if (bytes) {
        const text = new TextDecoder().decode(bytes),
          base = objKey.slice(0, objKey.lastIndexOf('/') + 1),
          mtl = {};
        for (const line of text.split(/\r?\n/))
          if (line.startsWith('mtllib ')) {
            const b = this.files.get(base + line.slice(7).trim());
            if (b) Object.assign(mtl, parseMTL(new TextDecoder().decode(b)));
          }
        triangles = parseOBJ(text, mtl, tex, !!m.flip_v);
      }
    }
    if (m.loader && m.loader !== 'neoforge:obj')
      issues.push('此 partial 使用未适配的自定义模型加载器：' + m.loader);
    const result = {
      id: name,
      parts: [{ x: orientation.x || 0, y: orientation.y || 0, elements, triangles }],
      full: false,
      alpha: 'opaque',
      missing: !elements.length && !triangles.length,
      issues,
    };
    this.cache.set(key, result);
    if (!result.missing) this.partialVersion++;
    return result;
  }
  model(state) {
    const cacheKey = stateKey(state);
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
    const [ns, path] = state.Name.split(':'),
      raw = this.json('assets/' + ns + '/blockstates/' + path + '.json');
    if (!Object.keys(raw).length) {
      const result = this.saved.models[cacheKey] || fallback(state);
      this.cache.set(cacheKey, result);
      return result;
    }
    const props = { ...state.Properties },
      choices = [];
    if (!Object.keys(props).length && raw.variants) {
      Object.assign(
        props,
        Object.fromEntries(
          Object.keys(raw.variants)[0]
            .split(',')
            .filter((a) => a.includes('='))
            .map((a) => a.split('=')),
        ),
      );
    }
    for (const [k, v] of Object.entries(raw.variants || {})) {
      if (
        k
          .split(',')
          .filter((a) => a.includes('='))
          .every((a) => {
            const [n, value] = a.split('=');
            return value.split('|').includes(props[n]);
          })
      ) {
        choices.push(v);
        break;
      }
    }
    const matches = (w) =>
      !w
        ? true
        : w.OR
          ? w.OR.some(matches)
          : w.AND
            ? w.AND.every(matches)
            : Object.entries(w).every(([k, v]) => String(v).split('|').includes(props[k]));
    for (const p of raw.multipart || []) if (matches(p.when)) choices.push(p.apply);
    const parts = [],
      issues = [];
    for (let choice of choices) {
      if (Array.isArray(choice)) {
        choice = choice[0];
        issues.push('加权模型使用第一组');
      }
      const model = this.resolve(choice.model);
      if (model.loader) issues.push('自定义加载器 ' + model.loader + ' 未执行');
      const tex = (ref) => {
        const visited = new Set();
        while (ref?.startsWith('#')) {
          if (visited.has(ref)) return null;
          visited.add(ref);
          ref = model.textures?.[ref.slice(1)];
        }
        if (!ref) return null;
        const [tn, tp] = ref.includes(':') ? ref.split(':') : ['minecraft', ref];
        return 'assets/' + tn + '/textures/' + tp + '.png';
      };
      const elements = (model.elements || []).map((e) => ({
        ...e,
        faces: Object.fromEntries(
          Object.entries(e.faces || {}).map(([d, f]) => [d, { ...f, texture: tex(f.texture) }]),
        ),
      }));
      parts.push({ x: choice.x || 0, y: choice.y || 0, elements });
      if (choice.uvlock) issues.push('UV 锁定使用近似预览');
    }
    if (!parts.some((p) => p.elements.length)) {
      const result = fallback(state);
      result.issues.push(...issues);
      return result;
    }
    const full =
      parts.length === 1 &&
      parts[0].elements.length === 1 &&
      parts[0].elements[0].from.join(',') === '0,0,0' &&
      parts[0].elements[0].to.join(',') === '16,16,16';
    const result = {
      id: state.Name,
      state,
      parts,
      issues,
      missing: false,
      full,
      alpha: /glass|water|ice/.test(state.Name) ? 'transparent' : 'opaque',
    };
    this.cache.set(cacheKey, result);
    return result;
  }
  addSaved(pack) {
    Object.assign(this.saved.models, pack.models || {});
    Object.assign(this.saved.images, pack.images || {});
    Object.assign(this.saved.textures, pack.textures || {});
    this.cache.clear();
    this.version++;
    this.summaryCache = null;
  }
  texture(key) {
    if (this.files.has(key)) return { bytes: this.files.get(key) };
    const def = this.saved.textures[key];
    return def ? { uri: this.saved.images[def.image], tile: def.tile } : null;
  }
  bundle(palette) {
    for (const key of Object.keys(this.saved.models))
      if (key.startsWith('partial:')) {
        const split = key.indexOf('|');
        if (split < 0) continue;
        try {
          this.partial(key.slice(8, split), JSON.parse(key.slice(split + 1)));
        } catch {}
      }
    const models = {},
      textures = {},
      images = {};
    for (const state of palette) models[stateKey(state)] = this.model(state);
    for (const [key, m] of this.cache)
      if (key.startsWith('partial:') && !m.missing) models[key] = m;
    for (const m of Object.values(models))
      for (const part of m.parts) {
        const keys = [];
        for (const e of part.elements || [])
          for (const f of Object.values(e.faces || {})) if (f.texture) keys.push(f.texture);
        for (const t of part.triangles || []) if (t.texture) keys.push(t.texture);
        for (const key of keys) {
          if (textures[key]) continue;
          const tex = this.texture(key);
          if (!tex) continue;
          if (tex.bytes) {
            let binary = '';
            for (let i = 0; i < tex.bytes.length; i += 32768)
              binary += String.fromCharCode(...tex.bytes.subarray(i, i + 32768));
            images[key] = 'data:image/png;base64,' + btoa(binary);
            textures[key] = { image: key };
          } else {
            const definition = this.saved.textures[key];
            textures[key] = definition;
            images[definition.image] = tex.uri;
          }
        }
      }
    return { models, images, textures };
  }
}
