from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SHARED_PY = PROJECT_ROOT / "packages" / "shared" / "python"
if SHARED_PY.exists():
    sys.path.insert(0, str(SHARED_PY))
