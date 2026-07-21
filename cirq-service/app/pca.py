from __future__ import annotations

import math
from dataclasses import dataclass
from numbers import Real
from typing import Sequence

import numpy as np
from sklearn.decomposition import PCA


INPUT_DIMENSIONS = 768
OUTPUT_DIMENSIONS = 8
MIN_EMBEDDINGS_FOR_PCA = OUTPUT_DIMENSIONS
ANGLE_LIMIT_RADIANS = math.pi
DEFAULT_REFIT_GROWTH_FRACTION = 0.25
DEFAULT_REFIT_MIN_NEW_EMBEDDINGS = 10


@dataclass(frozen=True)
class PcaReductionResult:
    reduced_vectors: list[list[float]]
    angle_vectors: list[list[float]]
    explained_variance_ratio: list[float]
    total_explained_variance: float
    refit_recommended: bool
    corpus_size: int
    input_dimensions: int = INPUT_DIMENSIONS
    output_dimensions: int = OUTPUT_DIMENSIONS


def reduce_embeddings_for_cirq(
    embeddings: Sequence[Sequence[float]],
    *,
    previous_fit_corpus_size: int | None = None,
    refit_growth_fraction: float = DEFAULT_REFIT_GROWTH_FRACTION,
    refit_min_new_embeddings: int = DEFAULT_REFIT_MIN_NEW_EMBEDDINGS,
) -> PcaReductionResult:
    """Fit PCA on one user's corpus and return 8D Cirq-ready vectors.

    The caller must pass embeddings for a single user/corpus. No global PCA state
    is kept here; each call fits PCA only against the provided corpus.
    """
    matrix = validate_embedding_matrix(embeddings)

    pca = PCA(n_components=OUTPUT_DIMENSIONS)
    reduced = pca.fit_transform(matrix)
    angle_vectors = normalize_reduced_vectors_to_angles(reduced)
    explained_variance_ratio = pca.explained_variance_ratio_.astype(float).tolist()
    total_explained_variance = float(np.sum(pca.explained_variance_ratio_))

    return PcaReductionResult(
        reduced_vectors=reduced.astype(float).tolist(),
        angle_vectors=angle_vectors.astype(float).tolist(),
        explained_variance_ratio=explained_variance_ratio,
        total_explained_variance=total_explained_variance,
        refit_recommended=should_refit_pca(
            previous_fit_corpus_size=previous_fit_corpus_size,
            current_corpus_size=matrix.shape[0],
            growth_fraction=refit_growth_fraction,
            min_new_embeddings=refit_min_new_embeddings,
        ),
        corpus_size=matrix.shape[0],
    )


def validate_embedding_matrix(embeddings: Sequence[Sequence[float]]) -> np.ndarray:
    if not isinstance(embeddings, Sequence) or isinstance(embeddings, (str, bytes)):
        raise ValueError("embeddings must be a sequence of 768-dimensional vectors")

    if len(embeddings) < MIN_EMBEDDINGS_FOR_PCA:
        raise ValueError(
            f"at least {MIN_EMBEDDINGS_FOR_PCA} embeddings are required to fit "
            f"{OUTPUT_DIMENSIONS} PCA components"
        )

    rows: list[list[float]] = []
    for row_index, embedding in enumerate(embeddings):
        if not isinstance(embedding, Sequence) or isinstance(embedding, (str, bytes)):
            raise ValueError(f"embedding {row_index} must be a sequence")

        if len(embedding) != INPUT_DIMENSIONS:
            raise ValueError(
                f"embedding {row_index} must contain exactly {INPUT_DIMENSIONS} values"
            )

        normalized_row: list[float] = []
        for value_index, value in enumerate(embedding):
            if isinstance(value, bool) or not isinstance(value, Real):
                raise ValueError(
                    f"embedding {row_index} value {value_index} must be a finite number"
                )

            number = float(value)
            if not math.isfinite(number):
                raise ValueError(
                    f"embedding {row_index} value {value_index} must be a finite number"
                )

            normalized_row.append(number)

        rows.append(normalized_row)

    return np.asarray(rows, dtype=np.float64)


def normalize_reduced_vectors_to_angles(
    reduced_vectors: np.ndarray,
    *,
    angle_limit: float = ANGLE_LIMIT_RADIANS,
) -> np.ndarray:
    """Scale each PCA component into a stable ry() rotation-angle range.

    PCA outputs are centered scores with arbitrary units. We scale each component
    by the maximum absolute value seen in this user's fitted corpus, preserving
    sign and mapping the observed range to [-angle_limit, angle_limit].
    """
    if reduced_vectors.ndim != 2 or reduced_vectors.shape[1] != OUTPUT_DIMENSIONS:
        raise ValueError(f"reduced_vectors must have shape (n, {OUTPUT_DIMENSIONS})")

    max_abs_by_component = np.max(np.abs(reduced_vectors), axis=0)
    safe_scale = np.where(max_abs_by_component > 0, max_abs_by_component, 1.0)
    normalized = reduced_vectors / safe_scale
    return np.clip(normalized, -1.0, 1.0) * angle_limit


def should_refit_pca(
    *,
    previous_fit_corpus_size: int | None,
    current_corpus_size: int,
    growth_fraction: float = DEFAULT_REFIT_GROWTH_FRACTION,
    min_new_embeddings: int = DEFAULT_REFIT_MIN_NEW_EMBEDDINGS,
) -> bool:
    if current_corpus_size < MIN_EMBEDDINGS_FOR_PCA:
        return False

    if previous_fit_corpus_size is None:
        return True

    if previous_fit_corpus_size < MIN_EMBEDDINGS_FOR_PCA:
        return True

    if current_corpus_size <= previous_fit_corpus_size:
        return False

    new_embeddings = current_corpus_size - previous_fit_corpus_size
    growth_threshold = max(min_new_embeddings, math.ceil(previous_fit_corpus_size * growth_fraction))
    return new_embeddings >= growth_threshold
