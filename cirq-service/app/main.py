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


@app.get("/health")
async def health() -> dict[str, bool]:
    return {"ok": True}


@app.post("/kernel", response_model=KernelResponse)
async def kernel(payload: KernelRequest) -> KernelResponse:
    score = compute_kernel_similarity(payload.vector_a, payload.vector_b)
    return KernelResponse(score=score, qubits=QUBIT_COUNT, path="cirq")


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


def clamp_score(value: float) -> float:
    if not math.isfinite(value):
        return 0.0

    return max(0.0, min(1.0, value))
