#!/usr/bin/env python3.8
from setuptools import setup, find_packages

setup(
	name='editsc',
	version='0.0.0',
	description='Browser-based Survivalcraft world editor',
	author='Dull Bananas',
	author_email='dull.bananas0@gmail.com',

	packages=find_packages(),
	install_requires=[
	],

	include_package_data=True,
	zip_safe=False,
)
