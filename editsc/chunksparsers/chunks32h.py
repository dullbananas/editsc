# Survivalcraft 2.2 and later
# Only difference from chunks32 is the chunk height is doubled

import numpy
import struct
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
		'B' # Currently unused; must be 0
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

@dataclass
class SurfacePoint:
	maxheight: int
	temphumidity: int

@dataclass
class DirEntry:
	x: int
	z: int
	index: int

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

class SurfacePoints:
	def __init__(self, surface_pt_values):
		surface_pt_objects = [
			SurfacePoint(maxheight=y, temphumidity=th)
			for (y, th, *unused) in surface_pt_values
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

class Chunk:
	def __init__(self, block_values, surface_pt_values):
		self.blocks = Blocks(block_values)
		self.surface_pts = SurfacePoints(surface_pt_values)

class ChunksFile:
	def __init__(self, data):
		dir_entry_size = structs['DirectoryEntry'].size
		used_directory_size = dir_entry_size * 65536 # Does not include guard entry
		directory_size = dir_entry_size * 65537
		# Iterate through directory entries
		dir_objs = []
		# TODO: change to used_directory_size
		dir_data = data[:used_directory_size]
		for entry_data in grouper(dir_data, dir_entry_size, b'\0'):
			x, z, index = structs['DirectoryEntry'].unpack(entry_data)
			dir_objs.append(DirEntry(x=x, z=z, index=index))
		self.directory = numpy.array(dir_objs, dtype=DirEntry)
		# Iterate through the chunks
		self.chunks = {}
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
			self.chunks[(x, z)] = Chunk(block_values, surface_pt_values)
