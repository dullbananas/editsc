// This is a generated file! Please edit source .ksy file and use kaitai-struct-compiler to rebuild

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['kaitai-struct/KaitaiStream'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('kaitai-struct/KaitaiStream'));
  } else {
    root.Chunks32h = factory(root.KaitaiStream);
  }
}(this, function (KaitaiStream) {
var Chunks32h = (function() {
  function Chunks32h(_io, _parent, _root) {
    this._io = _io;
    this._parent = _parent;
    this._root = _root || this;

    this._read();
  }
  Chunks32h.prototype._read = function() {
    this.directoryEntries = new Array(65536);
    for (var i = 0; i < 65536; i++) {
      this.directoryEntries[i] = new DirectoryEntry(this._io, this, this._root);
    }
    this.guardEntry = new DirectoryEntry(this._io, this, this._root);
    this.chunks = [];
    var i = 0;
    while (!this._io.isEof()) {
      this.chunks.push(new Chunk(this._io, this, this._root));
      i++;
    }
  }

  var Chunk = Chunks32h.Chunk = (function() {
    function Chunk(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Chunk.prototype._read = function() {
      this.header = new ChunkHeader(this._io, this, this._root);
      this.blocks = new Array((32768 * 2));
      for (var i = 0; i < (32768 * 2); i++) {
        this.blocks[i] = new Block(this._io, this, this._root);
      }
      this.surface = new Array(256);
      for (var i = 0; i < 256; i++) {
        this.surface[i] = new SurfacePoint(this._io, this, this._root);
      }
    }

    return Chunk;
  })();

  var SurfacePoint = Chunks32h.SurfacePoint = (function() {
    function SurfacePoint(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    SurfacePoint.prototype._read = function() {
      this.maxheight = this._io.readU1();
      this.temphumidity = this._io.readU1();
      this.unused1 = this._io.readU1();
      this.unused2 = this._io.readU1();
    }

    return SurfacePoint;
  })();

  var DirectoryEntry = Chunks32h.DirectoryEntry = (function() {
    function DirectoryEntry(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    DirectoryEntry.prototype._read = function() {
      this.xPosition = this._io.readS4le();
      this.zPosition = this._io.readS4le();
      this.index = this._io.readS4le();
    }

    return DirectoryEntry;
  })();

  var Block = Chunks32h.Block = (function() {
    function Block(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    Block.prototype._read = function() {
      this.data = this._io.readU4le();
    }

    return Block;
  })();

  var ChunkHeader = Chunks32h.ChunkHeader = (function() {
    function ChunkHeader(_io, _parent, _root) {
      this._io = _io;
      this._parent = _parent;
      this._root = _root || this;

      this._read();
    }
    ChunkHeader.prototype._read = function() {
      this.mgagic1 = this._io.ensureFixedContents([239, 190, 173, 222]);
      this.magic2 = this._io.ensureFixedContents([254, 255, 255, 255]);
      this.xPosition = this._io.readS4le();
      this.zPosition = this._io.readS4le();
    }

    return ChunkHeader;
  })();

  return Chunks32h;
})();
return Chunks32h;
}));
