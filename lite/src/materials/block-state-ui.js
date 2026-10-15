import markup from './views/block-state-edit.html';
import { propertyNames, propertyValues } from './state-labels.js';
export class BlockStateUI {
  constructor({ $, host, labelName, change, reuse }) {
    Object.assign(this, { $, host, labelName, change, reuse });
    host.innerHTML = markup;
    this.reset();
    $('state-edit-source').onchange = () =>
      change(() => {
        this.model = { sourceName: $('state-edit-source').value, properties: {} };
        this.fields();
      });
    $('state-edit-reset').onclick = () =>
      change(() => {
        this.model.properties = {};
        this.fields();
      });
    $('state-edit-reuse').onclick = () => {
      if (this.reusable) reuse(structuredClone(this.reusable));
    };
  }
  reset() {
    this.model = { sourceName: '', properties: {} };
    this.sources = [];
    this.signature = '';
    this.reusable = null;
    this.pending();
    this.fields();
  }
  snapshot() {
    return structuredClone(this.model);
  }
  restore(model) {
    this.model = structuredClone(model || { sourceName: '', properties: {} });
    this.fields();
  }
  config() {
    return this.snapshot();
  }
  pending() {
    this.$('state-edit-reuse').disabled = true;
  }
  update(data) {
    if (!this.model.sourceName) this.model.sourceName = data.sourceName;
    const signature = JSON.stringify(data.sources);
    if (signature !== this.signature) {
      this.signature = signature;
      this.sources = data.sources;
      this.fields();
    }
    this.reusable = data.reusableState;
    this.$('state-edit-reuse').disabled = !this.reusable;
    this.$('state-edit-reuse').title = this.reusable
      ? '在素材库预览并保存为可复用形态'
      : '当前类型仍有不同状态；缩小选择或统一属性后可复用';
    this.$('state-edit-info').textContent =
      `当前类型 ${data.matched} 格 · 将修改 ${data.changed} 格` +
      (data.excluded ? ` · 其他 ${data.excluded} 格保留` : '');
  }
  fields() {
    const select = this.$('state-edit-source');
    select.replaceChildren(
      ...this.sources.map(
        (s) => new Option(this.labelName({ Name: s.Name }) + ' · ' + s.count + ' 格', s.Name),
      ),
    );
    if (this.model.sourceName && !this.sources.some((s) => s.Name === this.model.sourceName))
      select.add(new Option('原类型已不在选区，请重新选择', this.model.sourceName));
    select.value = this.model.sourceName;
    const source = this.sources.find((s) => s.Name === this.model.sourceName);
    this.$('state-edit-fields').replaceChildren(
      ...(source?.properties || []).map((p, i) => {
        const label = document.createElement('label'),
          name = document.createElement('span'),
          input = document.createElement('select');
        name.textContent = propertyNames[p.key] || p.key;
        input.id = 'state-edit-property-' + i;
        input.dataset.property = p.key;
        input.setAttribute('aria-label', name.textContent);
        const original = p.mixed
          ? '混合'
          : p.missing
            ? '未设置'
            : propertyValues[p.values[0]] || p.values[0];
        input.add(new Option('保持原值 · ' + original, ''));
        for (const v of p.choices) input.add(new Option(propertyValues[v] || v, v));
        const value = this.model.properties[p.key];
        if (value !== undefined && !p.choices.includes(value)) input.add(new Option(value, value));
        input.value = value ?? '';
        label.dataset.changed = String(value !== undefined);
        input.onchange = () =>
          this.change(() => {
            if (input.value === '') delete this.model.properties[p.key];
            else this.model.properties[p.key] = input.value;
            label.dataset.changed = String(input.value !== '');
          });
        label.append(name, input);
        return label;
      }),
    );
    if (source && !source.properties.length) {
      const p = document.createElement('p');
      p.className = 'small';
      p.textContent = '当前资源和场景没有提供此类型的可选属性。仍可使用换材质或自由编辑接口。';
      this.$('state-edit-fields').append(p);
    }
  }
}
