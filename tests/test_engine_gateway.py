import unittest,tempfile,os
from pathlib import Path
from unittest.mock import patch
from engine_gateway import EngineGateway

class EngineGatewayTests(unittest.TestCase):
    def test_explicit_disable_never_starts_process(self):
        with tempfile.TemporaryDirectory() as folder,patch.dict(os.environ,{'CRAFTSTUDIO_ENGINE':'0'}):
            gateway=EngineGateway(Path(__file__).resolve().parents[1],Path(folder)/'test.sqlite','synthetic-token-123456')
            self.assertFalse(gateway.ensure());self.assertIsNone(gateway.process);gateway.close()
    def test_missing_dependencies_fall_back_without_installing(self):
        with tempfile.TemporaryDirectory() as folder:
            gateway=EngineGateway(folder,Path(folder)/'test.sqlite','synthetic-token-123456')
            self.assertFalse(gateway.ensure());self.assertIsNone(gateway.node);gateway.close()
    def test_engine_records_copy_without_replacing_newer_destination_or_touching_legacy(self):
        import sqlite3
        with tempfile.TemporaryDirectory() as folder,patch.dict(os.environ,{'CRAFTSTUDIO_ENGINE':'0'}):
            old=Path(folder)/'legacy.sqlite';new=Path(folder)/'engine.sqlite'
            with sqlite3.connect(old) as c:
                c.execute('CREATE TABLE designer_engine_blobs(id TEXT PRIMARY KEY,payload BLOB NOT NULL)')
                c.execute('CREATE TABLE designer_engine_heads(key TEXT PRIMARY KEY,sequence INTEGER NOT NULL,digest TEXT NOT NULL,payload BLOB NOT NULL)')
                c.execute('INSERT INTO designer_engine_blobs VALUES (?,?)',('blob',b'payload'))
                c.execute('INSERT INTO designer_engine_heads VALUES (?,?,?,?)',('scene',1,'digest',b'head'))
            c.close();before=old.read_bytes();gateway=EngineGateway(folder,new,'synthetic-token-123456',legacy_database=old);gateway.migrate()
            with sqlite3.connect(new) as c:
                self.assertEqual(c.execute('SELECT payload FROM designer_engine_blobs').fetchone()[0],b'payload')
                self.assertEqual(c.execute('SELECT sequence FROM designer_engine_heads').fetchone()[0],1)
                c.execute('UPDATE designer_engine_heads SET sequence=2')
            c.close();gateway.migrate()
            with sqlite3.connect(new) as c:self.assertEqual(c.execute('SELECT sequence FROM designer_engine_heads').fetchone()[0],2)
            c.close();self.assertEqual(old.read_bytes(),before);gateway.close()
