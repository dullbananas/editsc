from editsc.chunksparsers import utils


def test_get_bits():
	subvalue = 0b1001
	fullvalue = 0b100110
	assert utils.get_bits(fullvalue, 2, 5) == subvalue
	fullvalue = 0b1001
	assert utils.get_bits(fullvalue, 0, 3) == subvalue
	fullvalue = 0b11111001
	assert utils.get_bits(fullvalue, 0, 3) == subvalue


def test_set_bits():
	subvalue = 0b0110
	fullvalue = 0b110011
	assert utils.set_bits(fullvalue, 2, 5, subvalue) == 0b011011
