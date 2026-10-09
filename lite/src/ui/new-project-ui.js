import markup from './views/new-project.html';
import { newProject } from '../storage/new-project.js';

export function newProjectUI({ $, task, openFile, notice }) {
  const dialog = document.createElement('dialog');
  dialog.id = 'new-project-dialog';
  dialog.className = 'cad-dialog';
  dialog.innerHTML = markup;
  document.body.append(dialog);
  const button = document.createElement('button');
  button.id = 'new-project-open';
  button.className = 'full';
  button.textContent = '新建空白工程';
  button.onclick = () => {
    $('cad-file-dialog').close();
    dialog.showModal();
    $('new-project-name').select();
  };
  document.querySelector('#cad-file-dialog .cad-dialog-body').prepend(button);
  $('new-project-close').onclick = () => dialog.close();
  $('new-project-form').onsubmit = (event) => {
    event.preventDefault();
    task(async () => {
      const project = newProject({
        name: $('new-project-name').value,
        size: ['x', 'y', 'z'].map((axis) => Number($('new-project-' + axis).value)),
      });
      await openFile(
        new File([JSON.stringify(project)], 'new.craft.json', { type: 'application/json' }),
      );
      dialog.close();
      $('cad-site-dialog').close();
      notice('空白工程已创建，可以直接画草图或放置方块');
    }, '正在创建工程…');
  };
}
