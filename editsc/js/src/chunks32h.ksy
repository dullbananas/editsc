meta:
  id: chunks32h
  endian: le
seq:
  - id: directory_entries
    type: directory_entry
    repeat: expr
    repeat-expr: 65536
  - id: guard_entry
    type: directory_entry
  - id: chunks
    type: chunk
    repeat: eos
types:
  directory_entry:
    seq:
      - id: x_position
        type: s4
      - id: z_position
        type: s4
      - id: index
        type: s4
  chunk:
    seq:
      - id: header
        type: chunk_header
      - id: blocks
        type: u4
        repeat: expr
        repeat-expr: 32768 * 2
      - id: surface
        type: surface_point
        repeat: expr
        repeat-expr: 256
  chunk_header:
    seq:
      - id: mgagic_1
        contents: [0xef, 0xbe, 0xad, 0xde]
      - id: magic_2
        contents: [0xfe, 0xff, 0xff, 0xff]
      - id: x_position
        type: s4
      - id: z_position
        type: s4
  surface_point:
    seq:
      - id: maxheight
        type: u1
      - id: temphumidity
        type: u1
      - id: unused1
        type: u1
      - id: unused2
        type: u1
