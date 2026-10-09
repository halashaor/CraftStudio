import { CheckpointDraftWriter, DraftConflict } from './checkpoint-draft.js';

export class DraftController {
  constructor({ library, call, baselineRequest, captureForm, context, status, unavailable }) {
    Object.assign(this, { library, call, captureForm, context, status, unavailable });
    this.checkpoints = new CheckpointDraftWriter({ library, call, baselineRequest, context });
    this.epoch = 0;
    this.dirty = false;
    this.timer = null;
    this.promise = null;
  }

  markDirty() {
    this.epoch++;
    this.dirty = true;
    this.status('编辑已更新 · 等待空闲保存草稿');
    this.schedule(1800);
  }

  schedule(delay = 1000) {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.autosave(), delay);
  }

  async autosave() {
    const current = this.context();
    if (!current.available || current.summary?.preview) return;
    if (current.blocked || this.promise) {
      this.schedule();
      return;
    }
    await this.persist();
  }

  persist() {
    if (this.promise) return this.promise;
    this.cancelScheduled();
    const { summary, active } = this.context();
    const saveForm = this.captureForm();
    const snapshot = {
      epoch: this.epoch,
      projectId: active?.id || null,
      workspaceId: summary.workspaceId,
      saveForm,
      title: saveForm.title || summary.name,
    };
    this.promise = this.write(snapshot).finally(() => {
      this.promise = null;
    });
    return this.promise;
  }

  async write(snapshot) {
    const { epoch, projectId, workspaceId, saveForm, title } = snapshot;
    try {
      await this.library.open();
      if (
        (this.library.store?.info || this.library.desktop)?.capabilities?.includes(
          'checkpoint-draft/1',
        )
      )
        await this.checkpoints.write(snapshot);
      else {
        const data = await this.call('draft', { title, saveForm });
        await this.library.draft(data, projectId);
      }
      if (this.context().remote)
        await this.library.preference('save-form:' + workspaceId, saveForm);
      if (epoch === this.epoch) {
        this.dirty = false;
        this.cancelScheduled();
        const { active } = this.context();
        const store = this.library.desktop ? 'SQLite' : '浏览器本地';
        this.status(
          active
            ? `${store}草稿已保存 · 正式版本 v${active.head}`
            : this.library.desktop
              ? 'SQLite 草稿已保存；点击保存加入工程库'
              : '浏览器本地草稿已保存；点击保存加入工程库',
        );
      } else this.schedule();
    } catch (error) {
      if (error instanceof DraftConflict) {
        this.dirty = true;
        this.status('草稿等待重新同步：' + error.message);
        this.schedule();
      } else {
        this.unavailable(error);
        this.status('本地存储不可用，请下载完整工程：' + error.message);
      }
    }
  }

  cancelScheduled() {
    clearTimeout(this.timer);
    this.timer = null;
  }
}
