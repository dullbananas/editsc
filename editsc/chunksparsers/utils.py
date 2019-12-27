def get_bits(num, lowest, highest):
	# Example:
	# 6543210
	# vvvvvvv
	# 1101000
	# ^^^^ <------ let's get these buts
	# >>> get_bits(0b1101000, 3, 6)
	# 0b1101

	# mask will be a string of binary digits
	# We will do `num & mask`
	mask = '1' * (highest - lowest + 1)
	mask += '0' * lowest

	result = num & int(mask, 2)
	result = result >> lowest

	return result


def set_bits(num, lowest, highest, newvalue):
	# Erase old value
	mask = '0' * (highest - lowest + 1)
	mask += '1' * lowest
	num = num & int(mask, 2)
	# Move new value to the left
	newvalue = newvalue << lowest
	# Put new value into num
	return num | newvalue
