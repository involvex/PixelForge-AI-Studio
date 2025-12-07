import json
import re
from pathlib import Path
from unittest.mock import MagicMock, mock_open, patch
from typing import Any, Dict

import pytest
import tomlkit

from package_manager import (
    BasePackage,
    BuildRelease,
    NpmPackage,
    PyPiPackage,
    get_package,
)

# Mock data for package.json
NPM_MOCK_DATA = {"name": "test-npm-package", "version": "1.2.3"}
PYPI_MOCK_DATA = {
    "project": {"name": "test-pypi-package", "version": "0.1.0"}
}

@pytest.fixture
def mock_npm_package_path(tmp_path: Path) -> Path:
    """Fixture to create a mock NPM package directory."""
    pkg_path = tmp_path / "npm_project"
    pkg_path.mkdir()
    (pkg_path / "package.json").write_text(json.dumps(NPM_MOCK_DATA))
    return pkg_path

@pytest.fixture
def mock_pypi_package_path(tmp_path: Path) -> Path:
    """Fixture to create a mock PyPI package directory."""
    pkg_path = tmp_path / "pypi_project"
    pkg_path.mkdir()
    (pkg_path / "pyproject.toml").write_text(tomlkit.dumps(PYPI_MOCK_DATA))
    return pkg_path

class TestNpmPackage:
    """Tests for the NpmPackage class."""

    def test_package_name(self, mock_npm_package_path: Path):
        """Test that package_name returns the correct name."""
        npm_pkg = NpmPackage(mock_npm_package_path)
        assert npm_pkg.package_name() == "test-npm-package"

    def test_package_version(self, mock_npm_package_path: Path):
        """Test that package_version returns the correct version."""
        npm_pkg = NpmPackage(mock_npm_package_path)
        assert npm_pkg.package_version() == "1.2.3"

    def test_update_version(self, mock_npm_package_path: Path):
        """Test that update_version correctly increments the patch version."""
        npm_pkg = NpmPackage(mock_npm_package_path)
        mock_build_release = MagicMock(spec=BuildRelease)
        new_version = npm_pkg.update_version(mock_build_release)
        assert new_version == "1.2.4"
        
        # Verify the file was updated
        with open(npm_pkg.file_path, 'r') as f:
            updated_data = json.load(f)
        assert updated_data["version"] == "1.2.4"

class TestPyPiPackage:
    """Tests for the PyPiPackage class."""

    def test_package_name(self, mock_pypi_package_path: Path):
        """Test that package_name returns the correct name."""
        pypi_pkg = PyPiPackage(mock_pypi_package_path)
        assert pypi_pkg.package_name() == "test-pypi-package"

    def test_package_version(self, mock_pypi_package_path: Path):
        """Test that package_version returns the correct version."""
        pypi_pkg = PyPiPackage(mock_pypi_package_path)
        assert pypi_pkg.package_version() == "0.1.0"

    def test_update_version(self, mock_pypi_package_path: Path):
        """Test that update_version correctly increments the patch version."""
        pypi_pkg = PyPiPackage(mock_pypi_package_path)
        mock_build_release = MagicMock(spec=BuildRelease)
        new_version = pypi_pkg.update_version(mock_build_release)
        assert new_version == "0.1.1"

        # Verify the file was updated
        with open(pypi_pkg.file_path, 'r') as f:
            updated_data = tomlkit.parse(f.read())
        assert updated_data["project"]["version"] == "0.1.1"

class TestGetPackage:
    """Tests for the get_package factory function."""

    def test_get_npm_package(self, mock_npm_package_path: Path):
        """Test that get_package returns an NpmPackage instance."""
        pkg = get_package(mock_npm_package_path)
        assert isinstance(pkg, NpmPackage)

    def test_get_pypi_package(self, mock_pypi_package_path: Path):
        """Test that get_package returns a PyPiPackage instance."""
        pkg = get_package(mock_pypi_package_path)
        assert isinstance(pkg, PyPiPackage)

    def test_get_package_not_found(self, tmp_path: Path):
        """Test that get_package raises FileNotFoundError."""
        with pytest.raises(FileNotFoundError):
            get_package(tmp_path)

class TestBasePackage:
    """Tests for the BasePackage abstract class."""

    def test_get_data_caching(self):
        """Test that data is loaded only once."""
        class MockPackage(BasePackage):
            @property
            def file_path(self) -> Path:
                return Path("mock/path")
            def _load_data(self) -> Dict[str, Any]:
                return {"key": "value"}
            def package_name(self) -> str:
                return "mock"
            def package_version(self) -> str:
                return "1.0"
            def update_version(self, build_release: BuildRelease) -> str:
                return "1.1"

        pkg = MockPackage(Path("."))
        
        with patch.object(pkg, '_load_data', wraps=pkg._load_data) as mock_load:
            pkg.get_data()
            pkg.get_data()
            mock_load.assert_called_once()

if __name__ == "__main__":
    pytest.main()