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
