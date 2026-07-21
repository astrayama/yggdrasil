from __future__ import annotations

import math
import sys
from pathlib import Path

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.pca import (
    ANGLE_LIMIT_RADIANS,
    INPUT_DIMENSIONS,
    OUTPUT_DIMENSIONS,
    reduce_embeddings_for_cirq,
    should_refit_pca,
)


def make_embeddings(count: int) -> list[list[float]]:
    rng = np.random.default_rng(42)
    return rng.normal(size=(count, INPUT_DIMENSIONS)).astype(float).tolist()


def test_reduces_768_dimensional_embeddings_to_8_dimensions() -> None:
    result = reduce_embeddings_for_cirq(
        make_embeddings(12),
        previous_fit_corpus_size=12,
    )

    assert result.corpus_size == 12
    assert len(result.reduced_vectors) == 12
    assert len(result.reduced_vectors[0]) == OUTPUT_DIMENSIONS
    assert len(result.angle_vectors) == 12
    assert len(result.angle_vectors[0]) == OUTPUT_DIMENSIONS
    assert len(result.explained_variance_ratio) == OUTPUT_DIMENSIONS
    assert 0.0 <= result.total_explained_variance <= 1.0
    assert result.refit_recommended is False


def test_angle_vectors_are_finite_and_clamped_to_rotation_range() -> None:
    result = reduce_embeddings_for_cirq(make_embeddings(10))

    for vector in result.angle_vectors:
        for value in vector:
            assert math.isfinite(value)
            assert -ANGLE_LIMIT_RADIANS <= value <= ANGLE_LIMIT_RADIANS


def test_requires_enough_embeddings_for_eight_components() -> None:
    with pytest.raises(ValueError, match="at least 8 embeddings"):
        reduce_embeddings_for_cirq(make_embeddings(7))


def test_validates_input_dimensions() -> None:
    embeddings = make_embeddings(8)
    embeddings[0] = embeddings[0][:-1]

    with pytest.raises(ValueError, match="exactly 768"):
        reduce_embeddings_for_cirq(embeddings)


def test_rejects_non_finite_values() -> None:
    embeddings = make_embeddings(8)
    embeddings[0][0] = float("nan")

    with pytest.raises(ValueError, match="finite number"):
        reduce_embeddings_for_cirq(embeddings)


def test_refit_recommendation_uses_growth_since_previous_fit() -> None:
    assert should_refit_pca(previous_fit_corpus_size=None, current_corpus_size=8)
    assert not should_refit_pca(previous_fit_corpus_size=100, current_corpus_size=109)
    assert should_refit_pca(previous_fit_corpus_size=100, current_corpus_size=125)
    assert should_refit_pca(previous_fit_corpus_size=20, current_corpus_size=30)
