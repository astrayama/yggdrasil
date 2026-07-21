from __future__ import annotations

import math
from numbers import Real
from typing import Any

import cirq
from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, field_validator

from app.pca import INPUT_DIMENSIONS, PcaReductionResult, reduce_embeddings_for_cirq


QUBIT_COUNT = 8

app = FastAPI(
    title="Yggdrasil Cirq Kernel Service",
    version="0.1.0",
    description="Isolated CPU-based Cirq service for hidden-connections kernel scoring.",
)

simulator = cirq.Simulator()
qubits = cirq.LineQubit.range(QUBIT_COUNT)


class KernelRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    vector_a: list[float]
    vector_b: list[float]

    @field_validator("vector_a", "vector_b", mode="before")
    @classmethod
    def validate_vector(cls, value: Any) -> list[float]:
        if not isinstance(value, list):
            raise ValueError("vector must be a list of 8 finite numbers")

        if len(value) != QUBIT_COUNT:
            raise ValueError("vector must contain exactly 8 values")

        normalized: list[float] = []
        for item in value:
            if isinstance(item, bool) or not isinstance(item, Real):
                raise ValueError("vector values must be finite numbers")

            number = float(item)
            if not math.isfinite(number):
                raise ValueError("vector values must be finite numbers")

            normalized.append(number)

        return normalized


class KernelResponse(BaseModel):
    score: float
    qubits: int
    path: str


class ReductionEntry(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str
    embedding: list[float]

    @field_validator("embedding", mode="before")
    @classmethod
    def validate_embedding(cls, value: Any) -> list[float]:
        return validate_numeric_vector(value, INPUT_DIMENSIONS)


class ReductionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entries: list[ReductionEntry]
    previous_fit_corpus_size: int | None = None


class ReducedEntry(BaseModel):
    id: str
    reduced_vector: list[float]
    angle_vector: list[float]


class ReductionResponse(BaseModel):
    vectors: list[ReducedEntry]
    explained_variance_ratio: list[float]
    total_explained_variance: float
    refit_recommended: bool
    corpus_size: int
    input_dimensions: int
    output_dimensions: int


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": "invalid_request",
            "detail": jsonable_encoder(exc.errors()),
        },
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": "invalid_request",
            "detail": str(exc),
        },
    )


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/kernel", response_model=KernelResponse)
async def kernel(payload: KernelRequest) -> KernelResponse:
    score = compute_kernel_similarity(payload.vector_a, payload.vector_b)
    return KernelResponse(score=score, qubits=QUBIT_COUNT, path="cirq")


@app.post("/reduce", response_model=ReductionResponse)
async def reduce(payload: ReductionRequest) -> ReductionResponse:
    result = reduce_embeddings_for_cirq(
        [entry.embedding for entry in payload.entries],
        previous_fit_corpus_size=payload.previous_fit_corpus_size,
    )

    return build_reduction_response(payload.entries, result)


def compute_kernel_similarity(vector_a: list[float], vector_b: list[float]) -> float:
    circuit = cirq.Circuit()
    circuit.append(encode_vector(vector_a))
    circuit.append(cirq.inverse(cirq.Circuit(encode_vector(vector_b))))

    result = simulator.simulate(circuit)
    state_vector = result.final_state_vector
    zero_state_probability = abs(state_vector[0]) ** 2

    return clamp_score(float(zero_state_probability))


def encode_vector(vector: list[float]) -> list[cirq.Operation]:
    return [cirq.ry(value).on(qubit) for value, qubit in zip(vector, qubits)]


def build_reduction_response(
    entries: list[ReductionEntry],
    result: PcaReductionResult,
) -> ReductionResponse:
    return ReductionResponse(
        vectors=[
            ReducedEntry(
                id=entry.id,
                reduced_vector=result.reduced_vectors[index],
                angle_vector=result.angle_vectors[index],
            )
            for index, entry in enumerate(entries)
        ],
        explained_variance_ratio=result.explained_variance_ratio,
        total_explained_variance=result.total_explained_variance,
        refit_recommended=result.refit_recommended,
        corpus_size=result.corpus_size,
        input_dimensions=result.input_dimensions,
        output_dimensions=result.output_dimensions,
    )


def validate_numeric_vector(value: Any, expected_length: int) -> list[float]:
    if not isinstance(value, list):
        raise ValueError(f"vector must be a list of {expected_length} finite numbers")

    if len(value) != expected_length:
        raise ValueError(f"vector must contain exactly {expected_length} values")

    normalized: list[float] = []
    for item in value:
        if isinstance(item, bool) or not isinstance(item, Real):
            raise ValueError("vector values must be finite numbers")

        number = float(item)
        if not math.isfinite(number):
            raise ValueError("vector values must be finite numbers")

        normalized.append(number)

    return normalized


def clamp_score(value: float) -> float:
    if not math.isfinite(value):
        return 0.0

    return max(0.0, min(1.0, value))
