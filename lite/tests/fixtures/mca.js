import { zlibSync } from 'fflate';
import { tag, writeNBT } from '../../src/minecraft/codec.js';

export function makeMca(name, chunks) {
  const records = chunks.map((chunk) => {
    const sections = (chunk.sections || [{ y: 0, state: { Name: 'minecraft:oak_planks' } }]).map(
      (section) => ({
        Y: tag(1, section.y),
        block_states: tag(10, {
          palette: tag(9, [
            10,
            (section.palette || [section.state]).map((state) => ({
              Name: tag(8, state.Name),
              ...(state.Properties
                ? {
                    Properties: tag(
                      10,
                      Object.fromEntries(
                        Object.entries(state.Properties).map(([key, value]) => [
                          key,
                          tag(8, value),
                        ]),
                      ),
                    ),
                  }
                : {}),
            })),
          ]),
          ...(section.data ? { data: tag(12, section.data) } : {}),
        }),
      }),
    );
    const root = tag(10, {
      DataVersion: tag(3, chunk.version ?? 3955),
      xPos: tag(3, chunk.x),
      zPos: tag(3, chunk.z),
      sections: tag(9, [10, sections]),
      block_entities: tag(9, [10, (chunk.entities || []).map((entity) => entity.v)]),
    });
    const data = zlibSync(writeNBT(root, false));
    return { chunk, data, sectors: Math.ceil((data.length + 5) / 4096) };
  });
  const bytes = new Uint8Array((2 + records.reduce((n, record) => n + record.sectors, 0)) * 4096),
    view = new DataView(bytes.buffer);
  let sector = 2;
  for (const { chunk, data, sectors } of records) {
    const index = (chunk.x & 31) + (chunk.z & 31) * 32;
    view.setUint32(index * 4, (sector << 8) | sectors, false);
    view.setUint32(4096 + index * 4, 123, false);
    view.setUint32(sector * 4096, data.length + 1, false);
    bytes[sector * 4096 + 4] = 2;
    bytes.set(data, sector * 4096 + 5);
    sector += sectors;
  }
  return { name, bytes };
}
export function boundaryMcaFiles() {
  return [
    makeMca('r.0.0.mca', [
      { x: 0, z: 0 },
      { x: 31, z: 0 },
    ]),
    makeMca('r.1.0.mca', [
      {
        x: 32,
        z: 0,
        sections: [
          { y: 0, state: { Name: 'example:stairs', Properties: { facing: 'east', half: 'top' } } },
        ],
        entities: [
          tag(10, {
            id: tag(8, 'example:machine'),
            x: tag(3, 512),
            y: tag(3, 1),
            z: tag(3, 0),
            Long: tag(4, '9223372036854775807'),
          }),
        ],
      },
    ]),
  ];
}
