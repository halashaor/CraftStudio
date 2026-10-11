import markup from './views/preview-issues.html';
import { PreviewIssueView } from './preview-issue-view.js';
import { frameBounds } from '../view/frame-bounds.js';

const advice = {
  terrain: '可抬高或移动设计；确需挖填时查看改动规则。',
  existing: '可移开设计，避开原建筑与植被；需要覆盖时查看改动规则。',
  protected: '移开设计，或在场地设置中调整这块保留区。',
  locked: '移开设计，或在场景集合中检查对象及上级集合的锁定。',
  other: '调整此处设计后，预览会重新检查。',
};

export class PreviewIssuesUI {
  constructor({ THREE, scene, requestRender, report, policyControls, policyChanged }) {
    this.view = new PreviewIssueView(THREE, scene, requestRender);
    this.element = document.createElement('section');
    this.element.className = 'preview-issues';
    this.element.hidden = true;
    this.element.innerHTML = markup;
    report.after(this.element);
    this.rules = document.createElement('details');
    this.rules.className = 'preview-rules';
    const heading = document.createElement('summary');
    heading.textContent = '场地改动规则';
    this.rules.append(heading);
    this.inputs = {};
    this.policyControls = policyControls;
    this.policyOverrides = {};
    for (const [kind, source] of Object.entries(policyControls)) {
      const label = document.createElement('label'),
        input = document.createElement('input');
      label.className = 'check';
      input.type = 'checkbox';
      input.checked = source.checked;
      input.dataset.previewPolicy = kind;
      label.append(input, document.createTextNode(source.closest('label').textContent.trim()));
      this.rules.append(label);
      this.inputs[kind] = input;
      input.onchange = () => {
        source.checked = input.checked;
        source.dispatchEvent(new Event('change', { bubbles: true }));
      };
      source.addEventListener('change', () => {
        this.syncPolicy();
        policyChanged();
      });
    }
    this.element.after(this.rules);
    this.policyHint = document.createElement('p');
    this.policyHint.className = 'small';
    this.policyHint.hidden = true;
    this.rules.append(this.policyHint);
  }
  setPolicyOverrides(overrides) {
    this.policyOverrides = overrides;
    this.policyHint.textContent = Object.values(overrides).join('；');
    this.policyHint.hidden = !this.policyHint.textContent;
    this.syncPolicy();
  }
  syncPolicy() {
    for (const [kind, input] of Object.entries(this.inputs)) {
      input.checked = !!this.policyOverrides[kind] || this.policyControls[kind].checked;
      input.disabled = !!this.policyOverrides[kind];
    }
  }
  focusBounds(bounds) {
    const rect = document.querySelector('#scene canvas').getBoundingClientRect();
    window.CraftStudio.setView(
      frameBounds(window.CraftStudio.viewState(), bounds, rect.width / Math.max(1, rect.height)),
    );
  }
  clear() {
    this.element.hidden = true;
    this.element.dataset.count = '0';
    this.element.querySelector('[data-issue-groups]').replaceChildren();
    this.view.clear();
  }
  show(summary) {
    this.clear();
    this.syncPolicy();
    if (!summary?.count) return;
    const element = this.element;
    element.hidden = false;
    element.dataset.count = String(summary.count);
    element.querySelector('[data-issue-total]').textContent =
      `${summary.count} 格受保护，暂不能确认`;
    element.querySelector('[data-issue-legend]').textContent =
      `带叉方框标记受阻位置${summary.truncated ? `（抽样 ${summary.sampleCount} 格）` : ''}。当前设计仍是预览。`;
    const positions = summary.groups.flatMap((group) => group.samples.map((sample) => sample.pos));
    element.querySelector('[data-issue-all]').onclick = () => {
      this.view.draw(positions);
      this.focusBounds(summary.bounds);
    };
    this.view.draw(positions);
    const groups = element.querySelector('[data-issue-groups]');
    for (const group of summary.groups) {
      const row = document.createElement('div'),
        title = document.createElement('strong'),
        help = document.createElement('p'),
        actions = document.createElement('div'),
        locate = document.createElement('button'),
        detail = document.createElement('p');
      row.className = 'preview-issue-group';
      row.dataset.issueKind = group.kind;
      title.textContent = `${group.label} · ${group.count} 格`;
      help.className = detail.className = 'small';
      help.textContent = advice[group.kind];
      actions.className = 'row';
      locate.type = 'button';
      locate.dataset.issueLocate = group.kind;
      locate.textContent = '定位一处';
      detail.hidden = true;
      let index = 0;
      locate.onclick = () => {
        const sample = group.samples[index];
        this.view.draw(group.samples.map((s) => s.pos));
        this.focusBounds({ min: sample.pos, max: sample.pos });
        detail.textContent = `样本 ${index + 1}/${group.samples.length} · ${sample.message}`;
        detail.hidden = false;
        index = (index + 1) % group.samples.length;
        locate.textContent = group.samples.length > 1 ? '定位下一处' : '再次定位';
      };
      actions.append(locate);
      if (['terrain', 'existing'].includes(group.kind)) {
        const rules = document.createElement('button');
        rules.type = 'button';
        rules.dataset.issueRules = group.kind;
        rules.textContent = '查看改动规则';
        rules.onclick = () => {
          this.rules.open = true;
          this.inputs[group.kind].scrollIntoView({ block: 'nearest' });
          this.inputs[group.kind].focus({ preventScroll: true });
        };
        actions.append(rules);
      }
      row.append(title, help, actions, detail);
      groups.append(row);
    }
  }
}
