#!/usr/bin/env python3
# -*- coding: utf-8 -*-
#
# Copyright (C) 2015-2020 Bitergia
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program. If not, see <http://www.gnu.org/licenses/>.
#
# Authors:
#     Santiago Dueñas <sduenas@bitergia.com>
#     Jesus M. Gonzalez-Barahona <jgb@gsyc.es>
#     Alvaro del Castillo <acs@bitergia.com>
#     Stephan Barth <stephan.barth@gmail.com>
#     Valerio Cosentino <valcos@bitergia.com>
#     Miguel Ángel Fernández <mafesan@bitergia.com>
#     David Pose Fernández <dpose@bitergia.com>
#

import codecs
import os.path
import re
import sys
import unittest

from setuptools import setup
from setuptools.command.test import test as TestClass

here = os.path.abspath(os.path.dirname(__file__))
readme_md = os.path.join(here, 'README.md')
version_py = os.path.join(here, 'perceval', '_version.py')

# Get the package description from the README.md file
with codecs.open(readme_md, encoding='utf-8') as f:
    long_description = f.read()

with codecs.open(version_py, 'r', encoding='utf-8') as fd:
    version = re.search(r'^__version__\s*=\s*[\'"]([^\'"]*)[\'"]',
                        fd.read(), re.MULTILINE).group(1)


class TestCommand(TestClass):
    user_options = []
    __dir__ = os.path.dirname(os.path.realpath(__file__))

    def initialize_options(self):
        super().initialize_options()
        sys.path.insert(0, os.path.join(self.__dir__, 'tests'))

    def run_tests(self):
        test_suite = unittest.TestLoader().discover('.', pattern='test_*.py')
        result = unittest.TextTestRunner(buffer=True).run(test_suite)
        sys.exit(not result.wasSuccessful())


cmdclass = {'test': TestCommand}

setup(name="perceval",
      description="Fetch data from software repositories",
      long_description=long_description,
      long_description_content_type='text/markdown',
      url="https://github.com/chaoss/grimoirelab-perceval",
      version=version,
      author="Bitergia",
      author_email="sduenas@bitergia.com",
      license="GPLv3",
      classifiers=[
          'Development Status :: 5 - Production/Stable',
          'Intended Audience :: Developers',
          'Topic :: Software Development',
          'License :: OSI Approved :: GNU General Public License v3 or later (GPLv3+)',
          'Programming Language :: Python :: 3'
      ],
      keywords="development repositories analytics git github bugzilla jira jenkins",
      packages=[
          'perceval',
          'perceval.backends',
          'perceval.backends.core'
      ],
      namespace_packages=[
          'perceval',
          'perceval.backends'
      ],
      setup_requires=[
          'wheel',
          'pandoc'
      ],
      tests_require=[
          'httpretty>=0.9.6'
      ],
      install_requires=[
          'python-dateutil>=2.6.0',
          'requests>=2.7.0',
          'beautifulsoup4>=4.3.2',
          'feedparser>=5.1.3',
          'dulwich>=0.20.0',
          'urllib3>=1.22',
          'PyJWT>=1.7.1',
          'cryptography>=3.3.1',
          'grimoirelab-toolkit>=0.1.4'
      ],
      entry_points={
          'console_scripts': [
              'perceval=perceval.perceval:main'
          ]
      },
      cmdclass=cmdclass,
      zip_safe=False)
