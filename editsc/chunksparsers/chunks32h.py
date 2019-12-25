# Survivalcraft 2.2 and later
# Only difference from chunks32 is the chunk height is doubled

import numpy
import struct
import collections
import itertools
from dataclasses import dataclass


def grouper(iterable, n, fillvalue=None):
	# From https://stackoverflow.com/a/434411/11041613
	# grouper('ABCDEFG', 3, 'x') --> 'ABC' 'DEF' 'Gxx'
	args = [iter(iterable)] * n
	return (
		bytes(i)
		for i in itertools.zip_longest(*args, fillvalue=fillvalue)
	)


structs = {
	'DirectoryEntry': (
		'i' # Chunk X position, (1 unit equals 16 blocks, must be positive)
		'i' # Chunk Z position, (1 unit equals 16 blocks, must be positive)
		'i' # Index of chunk starting at 0; is -1 if entry is unused or is the guard entry
	),
	'ChunkHeader': (
		'I' # Must be 0xDEADBEEF
		'I' # Must be 0xFFFFFFFF
		'i' # Chunk X position, (1 unit equals 16 blocks, must be positive)
		'i' # Chunk Z position, (1 unit equals 16 blocks, must be positive)
	),
	'Block': (
		'I'
		# Bits 0 to 9 (10 bits): Block type
		# Bits 10 to 13 (4 bits): Block light value
		# Bits 14 to 31 (18 bits): Block data determining state of the block
	),
	'SurfacePoint': (
		'B' # Maximum height at this point
		'B' # 4 low bits contain temperature, 4 high bits contain humidity
		'B' # Currently unused; must be 0 (seems to actually be 65)
		'B' # Currently unused; must be 0
	),
}

# Add '<' before the formats to specify little-endian
# and convert them to Struct objects
structs = {
	key: struct.Struct('<' + value)
	for (key, value) in structs.items()
}


@dataclass
class Block:
	blockdata: int
	def serialize(self):
		return structs['Block'].pack(self.blockdata)

@dataclass
class SurfacePoint:
	maxheight: int
	temphumidity: int
	unused1: int
	unused2: int
	def serialize(self):
		return structs['SurfacePoint'].pack(self.maxheight, self.temphumidity, self.unused1, self.unused2)

@dataclass
class DirEntry:
	x: int
	z: int
	index: int
	def serialize(self):
		return structs['DirectoryEntry'].pack(self.x, self.z, self.index)

class Blocks:
	def __init__(self, block_values):
		block_objects = [
			Block(blockdata=d)
			for d in block_values
		]
		self.block_array = numpy.array(block_objects, dtype=Block)
	def __getitem__(self, key):
		x, y, z = key
		index = y + x * 256 + z * 256 * 16
		return self.block_array[index]
	def __setitem__(self, key, value):
		x, y, z = key
		index = y + x * 256 + z * 256 * 16
		self.block_array[index] = value
	def serialize(self):
		for block in self.block_array:
			yield block.serialize()

class SurfacePoints:
	def __init__(self, surface_pt_values):
		surface_pt_objects = [
			SurfacePoint(maxheight=y, temphumidity=th, unused1=u1, unused2=u2)
			for (y, th, u1, u2) in surface_pt_values
		]
		self.surface_pt_array = numpy.array(surface_pt_objects, dtype=SurfacePoint)
	def __getitem__(self, key):
		x, z = key
		index = x + z * 16
		return self.surface_pt_array[index]
	def __setitem__(self, key, value):
		x, z = key
		index = x + z * 16
		self.surface_pt_array[index]
	def serialize(self):
		for surface_pt in self.surface_pt_array:
			yield surface_pt.serialize()

class Chunk:
	def __init__(self, block_values, surface_pt_values, x, z):
		self.blocks = Blocks(block_values)
		self.surface_pts = SurfacePoints(surface_pt_values)
		self.x = x
		self.z = z
	def serialize(self):
		# Header
		yield structs['ChunkHeader'].pack(0xDEADBEEF, 0xFFFFFFFE, self.x, self.z)
		# Blocks
		#yield from self.blocks.serialize()
		yield b''.join([i for i in self.blocks.serialize()])
		# Surface points
		#yield from self.surface_pts.serialize()
		yield b''.join([i for i in self.surface_pts.serialize()])

class ChunksFile:
	def __init__(self, data):
		self.ogdata = data
		dir_entry_size = structs['DirectoryEntry'].size
		used_directory_size = dir_entry_size * 65536 # Does not include guard entry
		directory_size = dir_entry_size * 65537
		# Iterate through directory entries
		dir_objs = []
		dir_data = data[:used_directory_size]
		for entry_data in grouper(dir_data, dir_entry_size, b'\0'):
			x, z, index = structs['DirectoryEntry'].unpack(entry_data)
			dir_objs.append(DirEntry(x=x, z=z, index=index))
		self.directory = numpy.array(dir_objs, dtype=DirEntry)
		# Iterate through the chunks
		self.chunks = collections.OrderedDict()
		chunks_data = data[directory_size:]
		chunk_size = (
			structs['ChunkHeader'].size
			+ structs['Block'].size * 65536
			+ structs['SurfacePoint'].size * 256
		)
		for chunk_data in grouper(chunks_data, chunk_size, b'\0'):
			header_size = structs['ChunkHeader'].size
			block_size = structs['Block'].size
			blocks_total_size = block_size * 65536
			surface_pt_size = structs['SurfacePoint'].size
			# Parse header
			header_data = chunk_data[:header_size]
			magic1, magic2, x, z = structs['ChunkHeader'].unpack(header_data)
			assert magic1 == 0xDEADBEEF
			assert magic2 == 0xFFFFFFFE
			del magic1, magic2
			# Parse blocks
			block_values = []
			blocks_data = chunk_data[header_size:header_size+blocks_total_size]
			for block_data in grouper(blocks_data, block_size, b'\0'):
				block_values.append(structs['Block'].unpack(block_data)[0])
			# Parse surface points
			surface_pt_values = []
			surface_pts_data = chunk_data[header_size+blocks_total_size:]
			for surface_pt_data in grouper(surface_pts_data, surface_pt_size, b'\0'):
				surface_pt_values.append(structs['SurfacePoint'].unpack(surface_pt_data))
			# Append new Chunk object to self.chunks
			self.chunks[(x, z)] = Chunk(block_values, surface_pt_values, x, z)

	def serialize(self):
		result = bytearray()
		# Directory entries
		for entry in self.directory:
			result += entry.serialize()
		assert self.ogdata.startswith(result)
		# Guard directory entry
		result += structs['DirectoryEntry'].pack(0, 0, -1)
		assert self.ogdata.startswith(result)
		# Chunks
		for i, ((x, z), chunk) in enumerate(self.chunks.items()):
			for entry in self.directory:
				if (x, z) == (entry.x, entry.z):
					assert i == entry.index
			for data in chunk.serialize():
				result += data
				assert self.ogdata.startswith(result)
			# Chunk header
			#result += structs['ChunkHeader'].pack(0xDEADBEEF, 0xFFFFFFFE, x, z)
			#assert self.ogdata.startswith(result)

			# Blocks
			#for block in chunk.blocks.block_array:
				#result += structs['Block'].pack(block.blockdata)
			#assert self.ogdata.startswith(result)
			# Surface points
			#for surface_pt in chunk.surface_pts.surface_pt_array:
				#result += structs['SurfacePoint'].pack(surface_pt.maxheight, surface_pt.temphumidity, 0, 0)
				#assert self.ogdata.startswith(result)
		assert self.ogdata == result
		return result
