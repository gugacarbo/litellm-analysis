#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import subprocess
from pathlib import Path
from typing import List, Tuple

from fastembed import TextEmbedding
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams


DEFAULT_EXTENSIONS = {
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".cjs",
    ".json",
    ".md",
    ".sql",
    ".yaml",
    ".yml",
    ".toml",
}

DEFAULT_IGNORES = (
    "node_modules/",
    ".git/",
    "dist/",
    "build/",
    ".turbo/",
    "coverage/",
    ".next/",
    ".pnpm-store/",
    ".agents/skills/qdrant-search-workspace/",
)


def stable_u63_id(text: str) -> int:
    digest = hashlib.sha1(text.encode("utf-8")).digest()[:8]
    return int.from_bytes(digest, "big") & ((1 << 63) - 1)


def git_output(root: Path, *args: str) -> str:
    return (
        subprocess.check_output(["git", "-C", str(root), *args], text=True)
        .strip()
    )


def list_tracked_files(
    root: Path, extensions: set[str], ignores: Tuple[str, ...]
) -> List[Path]:
    files = git_output(root, "ls-files").splitlines()
    out: List[Path] = []
    for rel in files:
        if any(part in rel for part in ignores):
            continue
        p = root / rel
        if not p.exists() or not p.is_file():
            continue
        suffix = p.suffix.lower()
        if suffix in extensions or rel.endswith(".env.example"):
            out.append(p)
    return out


def chunk_ranges(
    lines: List[str], chunk_size: int, overlap: int, min_chunk_lines: int
) -> List[Tuple[int, int]]:
    n = len(lines)
    if n == 0:
        return []
    step = chunk_size - overlap
    out: List[Tuple[int, int]] = []
    i = 0
    while i < n:
        j = min(n, i + chunk_size)
        if j < n:
            low = max(i + min_chunk_lines, j - 25)
            high = min(n - 1, j + 10)
            boundary = None
            for k in range(high, low - 1, -1):
                t = lines[k].strip()
                if (
                    t.startswith("export ")
                    or t.startswith("function ")
                    or t.startswith("class ")
                    or t.startswith("app.")
                ):
                    boundary = k
                    break
            if boundary is not None and boundary > i + min_chunk_lines:
                j = boundary + 1
        if j - i >= min_chunk_lines:
            out.append((i + 1, j))
        if j >= n:
            break
        i = max(i + step, j - overlap)
    return out


def find_symbol(lines: List[str], start: int, end: int) -> str:
    window = lines[max(0, start - 1) : min(len(lines), end + 1)]
    for ln in window:
        s = ln.strip()
        if s.startswith("export function ") or s.startswith("function "):
            return s.split("(")[0].replace("export ", "").strip()
        if s.startswith("export class ") or s.startswith("class "):
            return s.split("{")[0].replace("export ", "").strip()
        if s.startswith("export const ") or s.startswith("const "):
            return s.split("=")[0].replace("export ", "").strip()
    return "module"


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Index the whole tracked codebase into Qdrant."
    )
    parser.add_argument(
        "--root",
        default=".",
        help="Repository root (default: current directory).",
    )
    parser.add_argument(
        "--qdrant-url",
        default="http://localhost:6333",
        help="Qdrant URL.",
    )
    parser.add_argument(
        "--collection",
        default="lite_llm_analytics_codebase",
        help="Target Qdrant collection.",
    )
    parser.add_argument(
        "--embedding-model",
        default="sentence-transformers/all-MiniLM-L6-v2",
        help="Embedding model for fastembed.",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=140,
        help="Chunk size in lines.",
    )
    parser.add_argument(
        "--overlap",
        type=int,
        default=30,
        help="Chunk overlap in lines.",
    )
    parser.add_argument(
        "--min-lines",
        type=int,
        default=20,
        help="Minimum lines per chunk.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=64,
        help="Upsert batch size.",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Recreate collection before indexing.",
    )
    args = parser.parse_args()

    if args.overlap >= args.chunk_size:
        raise SystemExit("--overlap must be smaller than --chunk-size.")

    root = Path(args.root).resolve()
    repo = root.name
    branch = git_output(root, "rev-parse", "--abbrev-ref", "HEAD")
    commit = git_output(root, "rev-parse", "--short", "HEAD")

    files = list_tracked_files(root, DEFAULT_EXTENSIONS, DEFAULT_IGNORES)
    print(f"files_selected={len(files)}")

    embedder = TextEmbedding(model_name=args.embedding_model)
    vector_size = len(next(embedder.embed(["healthcheck vector"])))
    client = QdrantClient(url=args.qdrant_url)

    if args.reset:
        try:
            client.delete_collection(collection_name=args.collection)
        except Exception:
            pass
        client.create_collection(
            collection_name=args.collection,
            vectors_config=VectorParams(
                size=vector_size,
                distance=Distance.COSINE,
            ),
        )
    else:
        existing = [c.name for c in client.get_collections().collections]
        if args.collection not in existing:
            client.create_collection(
                collection_name=args.collection,
                vectors_config=VectorParams(
                    size=vector_size,
                    distance=Distance.COSINE,
                ),
            )

    batch_texts: List[str] = []
    batch_meta: List[dict] = []
    stored = 0

    def flush_batch() -> int:
        nonlocal batch_texts, batch_meta
        if not batch_texts:
            return 0
        vecs = list(embedder.embed(batch_texts))
        points: List[PointStruct] = []
        for vec, payload in zip(vecs, batch_meta):
            point_id = stable_u63_id(
                f"{payload['path']}:{payload['startLine']}:{payload['endLine']}:"
                f"{commit}"
            )
            points.append(
                PointStruct(
                    id=point_id,
                    vector=vec.tolist(),
                    payload=payload,
                )
            )
        client.upsert(
            collection_name=args.collection,
            points=points,
            wait=True,
        )
        count = len(points)
        batch_texts = []
        batch_meta = []
        return count

    for p in files:
        rel = p.relative_to(root).as_posix()
        try:
            lines = p.read_text(encoding="utf-8").splitlines()
        except Exception:
            continue

        for start, end in chunk_ranges(
            lines=lines,
            chunk_size=args.chunk_size,
            overlap=args.overlap,
            min_chunk_lines=args.min_lines,
        ):
            code = "\n".join(lines[start - 1 : end])
            if not code.strip():
                continue
            symbol = find_symbol(lines, start, end)
            language = p.suffix.lower().lstrip(".") or "txt"
            top_folder = rel.split("/", 1)[0]
            tags = [top_folder]
            if "/routes/" in rel:
                tags.append("endpoint")
            if "/queries/" in rel:
                tags.append("query")
            if "/orchestration/" in rel:
                tags.append("orchestration")

            summary = f"{rel}:{start}-{end} ({symbol})"
            payload = {
                "repo": repo,
                "branch": branch,
                "path": rel,
                "symbol": symbol,
                "startLine": start,
                "endLine": end,
                "language": language,
                "commit": commit,
                "tags": tags,
                "code": code[:4000],
                "summary": summary,
            }
            batch_texts.append(f"{summary}\n\n{code}")
            batch_meta.append(payload)
            if len(batch_texts) >= args.batch_size:
                stored += flush_batch()
                print(f"upserted={stored}")

    stored += flush_batch()

    info = client.get_collection(collection_name=args.collection)
    print(f"stored_points={stored}")
    print(f"collection={args.collection}")
    print(f"collection_points={info.points_count}")
    print(f"collection_status={info.status}")


if __name__ == "__main__":
    main()
