"""
This module provides a refactored approach to managing different types of packages,
such as NPM and PyPI, with a focus on extensibility and improved readability.
"""

import json
import re
import sys
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict

import tomlkit

# A simplified BuildRelease class for type hinting purposes
class BuildRelease:
    pass

# A simplified SemVer regular expression
SemVerRegEx = re.compile(r"^(?P<major>0|[1-9]\d*)\.(?P<minor>0|[1-9]\d*)\.(?P<patch>0|[1-9]\d*)$")

class BasePackage(ABC):
    """
    An abstract base class for different package types.
    It provides a common interface for accessing package information.
    """

    def __init__(self, path: Path):
        self.path = path
        self._data: Dict[str, Any] | None = None

    @property
    @abstractmethod
    def file_path(self) -> Path:
        """The path to the package's metadata file."""
        ...

    @abstractmethod
    def _load_data(self) -> Dict[str, Any]:
        """Load the package's metadata from its file."""
        ...

    def get_data(self) -> Dict[str, Any]:
        """Load and cache the package's metadata."""
        if self._data is None:
            self._data = self._load_data()
        return self._data

    @abstractmethod
    def package_name(self) -> str:
        """Get the package name."""
        ...

    @abstractmethod
    def package_version(self) -> str:
        """Get the package version."""
        ...

    @abstractmethod
    def update_version(self, build_release: BuildRelease) -> str:
        """Update the package version."""
        ...

class NpmPackage(BasePackage):
    """A class to represent an NPM package."""

    @property
    def file_path(self) -> Path:
        return self.path / 'package.json'

    def _load_data(self) -> Dict[str, Any]:
        with open(self.file_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    def package_name(self) -> str:
        return self.get_data()['name']

    def package_version(self) -> str:
        return self.get_data()['version']

    def update_version(self, build_release: BuildRelease) -> str:
        data = self.get_data()
        version_str = data.get('version', '0.0.0')
        matched = re.match(SemVerRegEx, version_str)
        if not matched:
            raise ValueError(f"Invalid version format in {self.file_path}: {version_str}")

        patch = int(matched.group('patch')) + 1
        if patch > sys.maxsize:
            patch = 0
        
        new_version = '.'.join([matched.group('major'), matched.group('minor'), str(patch)])
        data['version'] = new_version

        with open(self.file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)
        
        self._data = data  # Update cached data
        return new_version

class PyPiPackage(BasePackage):
    """A class to represent a PyPI package."""

    @property
    def file_path(self) -> Path:
        return self.path / 'pyproject.toml'

    def _load_data(self) -> Dict[str, Any]:
        with open(self.file_path, 'r', encoding='utf-8') as f:
            return tomlkit.parse(f.read())

    def package_name(self) -> str:
        name = self.get_data().get('project', {}).get('name')
        if not name:
            raise ValueError(f'No name in {self.file_path} project section')
        return str(name)

    def package_version(self) -> str:
        version = self.get_data().get('project', {}).get('version')
        if not version:
            raise ValueError(f'No version in {self.file_path} project section')
        return str(version)

    def update_version(self, build_release: BuildRelease) -> str:
        data = self.get_data()
        project_table = data.get('project')
        if project_table is None:
            raise ValueError(f'No project section in {self.file_path}')

        version_str = project_table.get('version')
        if not version_str:
            raise ValueError(f'No version in {self.file_path} project section')

        matched = re.match(SemVerRegEx, str(version_str))
        if not matched:
            raise ValueError(f"Invalid version format in {self.file_path}: {version_str}")

        patch = int(matched.group('patch')) + 1
        if patch > sys.maxsize:
            patch = 0
        
        new_version = '.'.join([matched.group('major'), matched.group('minor'), str(patch)])
        project_table['version'] = new_version

        with open(self.file_path, 'w', encoding='utf-8') as f:
            f.write(tomlkit.dumps(data))
        
        self._data = data  # Update cached data
        return new_version

def get_package(path: Path) -> BasePackage:
    """
    Factory function to get the appropriate package object based on the files present.
    """
    if (path / 'pyproject.toml').exists():
        return PyPiPackage(path)
    if (path / 'package.json').exists():
        return NpmPackage(path)
    raise FileNotFoundError("No pyproject.toml or package.json found in the specified path.")
