import numpy as np
from pydantic import BaseModel

import cirq
from fastapi import FastAPI


app = FastAPI()
sim = cirq.Simulator()


class KernelRequest(BaseModel):
    a: list[float]
    b: list[float]


class KernelResponse(BaseModel):
    similarity_score: float


def feature_map(x):
    qubits = cirq.LineQubit.range(len(x))
    return cirq.Circuit(
        [cirq.H(q) for q in qubits] +  # put qubits in superposition state
        [cirq.rz(x[i])(qubits[i]) for i in range(len(x))]  # rotate each qubit by the feature value
    )


def encode(x):
    return sim.simulate(feature_map(x)).final_state_vector


def kernel(a, b):
    return float(np.abs(np.vdot(encode(a), encode(b)))**2)


@app.post("/kernel")
async def compute_kernel_score(req: KernelRequest):
    return KernelResponse(similarity_score=kernel(req.a, req.b))







