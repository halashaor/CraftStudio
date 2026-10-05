import json
import sqlite3
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from storage import Library
from design import room, apply_operations
from nbt import compound, Tag, to_json


class StorageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.db = Library(self.root / 'data' / 'library.sqlite3')
        self.project = room(8, 8, 5)
        self.project['metadata']['instance'] = 'test-instance'
        self.project['blocks'][0]['nbt'] = to_json(compound({'long': Tag(4, 9223372036854775807), 'byte': Tag(1, -128)}))

    def tearDown(self):
        self.temp.cleanup()

    def test_save_reopen_and_long_precision(self):
        item = self.db.save(self.project, title='中文 🧱 建筑', tags=['机械动力', '厂房'])
        reopened = Library(self.db.path).load(item['id'])
        self.assertEqual(reopened['project']['blocks'], self.project['blocks'])
        self.assertEqual(reopened['project']['name'], '中文 🧱 建筑')
        self.assertEqual(reopened['item']['tags'], ['机械动力', '厂房'])

    def test_versions_and_restore_as_new_version(self):
        first = self.db.save(self.project)
        second_project = apply_operations(self.project, [{'type': 'set', 'pos': [3, 1, 3], 'state': {'Name': 'minecraft:stone'}}])
        second = self.db.save(second_project, identifier=first['id'], note='第二版', expected_head=1)
        self.assertEqual(second['head'], 2)
        old = self.db.load(first['id'], 1)['project']
        third = self.db.save(old, identifier=first['id'], expected_head=2)
        self.assertEqual(third['head'], 3)
        self.assertEqual(self.db.load(first['id'], 2)['project'], second_project)
        self.assertEqual(self.db.versions(first['id'])[1]['note'], '第二版')

    def test_identical_save_does_not_duplicate_version(self):
        item = self.db.save(self.project)
        again = self.db.save(self.project, identifier=item['id'], description='更新说明')
        self.assertEqual(again['head'], 1)
        self.assertEqual(again['description'], '更新说明')

    def test_new_version_note_is_not_lost_when_geometry_is_same(self):
        item = self.db.save(self.project)
        again = self.db.save(self.project, identifier=item['id'], note='确定采用这个方案')
        self.assertEqual(again['head'], 2)
        self.assertEqual(self.db.versions(item['id'])[0]['note'], '确定采用这个方案')
        self.assertEqual(self.db.load(item['id'], 1)['project'], self.db.load(item['id'], 2)['project'])

    def test_conflict_is_atomic(self):
        item = self.db.save(self.project)
        with self.assertRaises(ValueError):
            self.db.save(self.project, identifier=item['id'], title='不能写入', expected_head=0)
        self.assertEqual(self.db.get(item['id'])['title'], self.project['name'])

    def test_trash_restore_keeps_versions(self):
        item = self.db.save(self.project)
        self.db.trash(item['id'])
        self.assertEqual(self.db.list()['total'], 0)
        self.assertEqual(self.db.list(deleted=True)['total'], 1)
        with self.assertRaises(ValueError):
            self.db.load(item['id'])
        self.db.trash(item['id'], restore=True)
        self.assertEqual(self.db.load(item['id'])['project']['blocks'], self.project['blocks'])

    def test_search_and_metadata(self):
        item = self.db.save(self.project, title='中文屋顶', tags=['复用'], kind='component')
        self.db.metadata(item['id'], {'favorite': True})
        self.assertEqual(self.db.list(query='复用', favorite=True, kind='component')['total'], 1)
        self.assertEqual(self.db.list(query="' OR 1=1 --")['total'], 0)
        self.assertEqual(self.db.list(query='%')['total'], 0)

    def test_session_survives_restart(self):
        item = self.db.save(self.project)
        self.db.put_session(self.project, 123, item['id'])
        recovered = Library(self.db.path).session()
        self.assertEqual(recovered['revision'], 123)
        self.assertEqual(recovered['project_id'], item['id'])
        self.assertEqual(recovered['project'], self.project)

    def test_each_project_keeps_draft_after_switching(self):
        item = self.db.save(self.project)
        draft = apply_operations(self.project, [{'type': 'set', 'pos': [3, 2, 3], 'state': {'Name': 'minecraft:stone'}}])
        self.db.put_session(draft, 12, item['id'])
        self.db.put_session(room(), 13)
        reopened = Library(self.db.path)
        self.assertEqual(reopened.draft(item['id'])['project'], draft)
        self.assertEqual(reopened.load(item['id'])['project'], self.project)

    def test_backup_includes_wal_content(self):
        item = self.db.save(self.project)
        path = self.db.backup(self.root / 'backups')
        backup = Library(path)
        self.assertEqual(backup.load(item['id'])['project'], self.project)
        conn = sqlite3.connect(path)
        try:
            self.assertEqual(conn.execute('PRAGMA integrity_check').fetchone()[0], 'ok')
        finally:
            conn.close()

    def test_migration_is_idempotent_and_keeps_bad_file(self):
        folder = self.root / 'projects'
        folder.mkdir()
        (folder / 'old.craft.json').write_text(json.dumps(self.project), encoding='utf-8')
        (folder / 'broken.craft.json').write_text('broken', encoding='utf-8')
        first = self.db.migrate_files(folder)
        self.assertEqual(first['imported'], 1)
        self.assertEqual(len(first['errors']), 1)
        self.assertEqual(self.db.migrate_files(folder)['imported'], 0)
        self.assertTrue((folder / 'broken.craft.json').is_file())

    def test_parallel_same_head_only_one_writer(self):
        item = self.db.save(self.project)
        def writer(n):
            try:
                return self.db.save(self.project, identifier=item['id'], title=f'v{n}', expected_head=1)['head']
            except ValueError:
                return None
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(writer, [1, 2]))
        self.assertEqual(results.count(2), 1)
        self.assertEqual(results.count(None), 1)


if __name__ == '__main__':
    unittest.main()
