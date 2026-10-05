"""Isolated HTTP contract test; never connects to Minecraft or the user's database."""
import copy
import json
import os
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path
import sys

TEMP = tempfile.TemporaryDirectory()
os.environ['CRAFTSTUDIO_STORAGE_DIR'] = TEMP.name
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server


class LiteBridgeTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.calls = []
        cls.original = server.request_bridge
        def mocked(body, action):
            cls.calls.append((copy.deepcopy(body), action))
            return {'status': 'completed', 'verifiedStates': len(body.get('payload', {}).get('project', {}).get('blocks', []))}
        server.request_bridge = mocked
        cls.http = server.ThreadingHTTPServer(('127.0.0.1', 0), server.Handler)
        cls.thread = threading.Thread(target=cls.http.serve_forever, daemon=True)
        cls.thread.start()

    @classmethod
    def tearDownClass(cls):
        cls.http.shutdown()
        cls.http.server_close()
        server.request_bridge = cls.original

    def request(self, body, origin=None):
        headers = {'Content-Type': 'application/json', 'X-CraftStudio-Token': server.TOKEN}
        if origin:
            headers['Origin'] = origin
        req = urllib.request.Request(f'http://127.0.0.1:{self.http.server_port}/api/lite/bridge', data=json.dumps(body).encode(), headers=headers)
        return urllib.request.urlopen(req)

    def test_lite_build_does_not_replace_full_editor_session(self):
        original = copy.deepcopy(server.CURRENT)
        revision = server.REVISION
        project = {'schema': 1, 'name': 'isolated', 'size': [2, 2, 2], 'origin': [100, 64, 100], 'dataVersion': 3955, 'palette': [{'Name': 'minecraft:stone_bricks'}], 'blocks': [{'pos': [0, 0, 0], 'state': 0}], 'entities': [], 'metadata': {}}
        with self.request({'action': 'apply', 'token': 'mock-only', 'payload': {'project': project, 'origin': project['origin'], 'dimension': 'minecraft:overworld'}}) as response:
            self.assertEqual(json.load(response)['verifiedStates'], 1)
        self.assertEqual(self.calls[-1][1], 'apply')
        self.assertEqual(server.CURRENT, original)
        self.assertEqual(server.REVISION, revision)

    def test_native_entities_are_not_silently_dropped(self):
        project = {'schema': 1, 'size': [1, 1, 1], 'palette': [], 'blocks': [], 'entities': [{'nbt': {}}], 'metadata': {}}
        with self.assertRaises(urllib.error.HTTPError) as error:
            self.request({'action': 'apply', 'payload': {'project': project}})
        self.assertEqual(error.exception.code, 400)

    def test_cross_site_requests_are_rejected(self):
        with self.assertRaises(urllib.error.HTTPError):
            self.request({'action': 'health'}, 'https://untrusted.example')


if __name__ == '__main__':
    unittest.main()
