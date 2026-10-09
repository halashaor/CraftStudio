import { guideActions } from '../modeling/guide-actions.js';
import { closedProfiles } from './sketch-profiles.js';

export class SketchBrowser {
  constructor({ $, editSaved, openFromGuide, frameGuide }) {
    Object.assign(this, { $, editSaved, openFromGuide, frameGuide });
    this.editingId = null;
    this.signature = '';
    const tree = document.createElement('details');
    this.tree = tree;
    tree.open = true;
    tree.innerHTML = '<summary>草图与辅助轮廓</summary><div id="cad-sketch-list"></div>';
    $('dock-objects').append(tree);
  }

  update(s, links) {
    const { $, editSaved, openFromGuide, frameGuide } = this;
    const sketchKey = JSON.stringify([s.workspaceId, s.design?.guides, links.guides]);
    if (sketchKey !== this.signature) {
      this.signature = sketchKey;
      const guideProfiles = closedProfiles(s.design?.guides || []);
      $('cad-sketch-list').replaceChildren(
        ...(s.design?.guides || [])
          .filter((g) => g.recipe?.kind && g.recipe.points)
          .map((g) => {
            const row = document.createElement('div');
            row.className = 'row tree-sketch';
            row.dataset.guideId = g.id;
            const button = document.createElement('button');
            const linked = links.guides.find((r) => r.id === g.id)?.dependents || [];
            button.textContent =
              g.name +
              ' · 编辑' +
              (linked.length ? ' · 直接关联 ' + linked.length + ' 个结果' : '');
            button.dataset.guideId = g.id;
            button.onclick = () => editSaved(g.id);
            row.append(button);
            const locate = document.createElement('button');
            locate.textContent = '定位';
            locate.dataset.guideId = g.id;
            locate.dataset.guideAction = 'frame';
            locate.title = '定位此草图，保留视角方向和投影；Home 返回上一视角';
            locate.onclick = () => frameGuide(g.id);
            row.append(locate);

            const actions = guideActions(s.design.guides, g.id, guideProfiles);
            for (const [operation, label] of [
              ['extrude', '拉伸'],
              ['sweep', '沿曲线摆方块'],
            ]) {
              const action = actions[operation],
                b = document.createElement('button');
              b.textContent = label;
              b.dataset.guideAction = operation;
              b.dataset.guideId = g.id;
              b.disabled = !!action.reason;
              b.title =
                action.reason ||
                (operation === 'extrude' && action.sourceIds.length > 1
                  ? '使用相接的 ' + action.sourceIds.length + ' 段闭合线框'
                  : '使用此草图作为来源');
              b.onclick = () => openFromGuide(g.id, operation);
              row.append(b);
            }
            const offsetSource = links.guides.find((r) => r.id === g.id)?.source;
            if (offsetSource) {
              const detail = document.createElement('div');
              detail.className = 'generation-sources';
              const label = document.createElement('small');
              label.textContent =
                (offsetSource.outdated ? '来源已变 · ' : '') +
                '偏移副本 · ' +
                offsetSource.name +
                ' · 距离 ' +
                offsetSource.distance;
              detail.append(label);
              const edit = document.createElement('button');
              edit.textContent = '编辑来源';
              edit.disabled = offsetSource.missing;
              edit.dataset.offsetSourceId = offsetSource.guideId;
              edit.onclick = () =>
                window.dispatchEvent(
                  new CustomEvent('craftstudio-edit-sketch', {
                    detail: { id: offsetSource.guideId },
                  }),
                );
              const rebuild = document.createElement('button');
              rebuild.textContent = '按来源重建';
              rebuild.dataset.offsetRebuildId = g.id;
              rebuild.disabled = !offsetSource.canRebuild;
              rebuild.title = offsetSource.reason || '保留距离，预览新的偏移轮廓与下游建筑';
              rebuild.onclick = () =>
                window.dispatchEvent(
                  new CustomEvent('craftstudio-rebuild-offset', { detail: { guideId: g.id } }),
                );
              const repair = document.createElement('button');
              repair.textContent = '更换来源';
              repair.dataset.offsetRepairId = g.id;
              repair.onclick = () =>
                window.dispatchEvent(
                  new CustomEvent('craftstudio-rebuild-offset', {
                    detail: { guideId: g.id, repair: true },
                  }),
                );
              detail.append(edit, rebuild, repair);
              row.append(detail);
            }
            return row;
          }),
      );
    }
    this.setEditing(this.editingId);
  }

  setEditing(id) {
    this.editingId = id;
    for (const row of this.$('cad-sketch-list').children) {
      row.classList.toggle('editing', row.dataset.guideId === id);
      row
        .querySelector('button:not([data-guide-action])')
        .setAttribute('aria-current', String(row.dataset.guideId === id));
    }
  }

  reveal(id) {
    const row = [...this.$('cad-sketch-list').children].find((row) => row.dataset.guideId === id);
    if (!row) return;
    this.tree.open = true;
    row.scrollIntoView({ block: 'nearest' });
  }
}
