import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
export class SourceReader {
  constructor(path, ids) {
    this.path = path;
    this.ids = new Set(ids);
    this.reads = 0;
    this.bytesRead = 0;
    this.db = new DatabaseSync(path, { readOnly: true });
    this.db.exec('PRAGMA busy_timeout=15000; PRAGMA query_only=ON');
    this.query = this.db.prepare('SELECT payload FROM designer_engine_blobs WHERE id=?');
    this.sizeQuery = this.db.prepare(
      'SELECT length(payload) AS bytes FROM designer_engine_blobs WHERE id=?',
    );
  }
  size(id) {
    if (!this.ids.has(id)) throw Error('Unknown source blob');
    const row = this.sizeQuery.get(id);
    if (!row) throw Error('Missing source blob');
    return row.bytes;
  }
  read(id) {
    if (!this.ids.has(id)) throw Error('Unknown source blob');
    const row = this.query.get(id);
    if (!row || createHash('sha256').update(row.payload).digest('hex') !== id)
      throw Error('Missing or corrupt source blob');
    this.reads++;
    this.bytesRead += row.payload.length;
    return row.payload;
  }
  close() {
    this.db.close();
  }
}
