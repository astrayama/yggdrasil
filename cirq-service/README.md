# Yggdrasil Cirq Service

Standalone Python Cloud Run service for CPU-based Cirq kernel computation.

This service is intentionally isolated from the Next.js app and Firebase Functions. It does not import app code, initialize Firebase, or call Gemini. Real quantum hardware is not used; the service uses `cirq.Simulator()` on CPU.

## API

### `GET /health`

Returns:

```json
{
  "ok": true
}
```

Example:

```bash
curl http://localhost:8080/health
```

### `POST /kernel`

Computes a simple quantum kernel similarity for two 8-dimensional vectors. Each value is encoded as a `cirq.ry(value)` rotation on one of 8 line qubits. The service prepares vector A, applies the inverse circuit for vector B, simulates the result, and returns the all-zero-state probability clamped to `[0, 1]`.

Request:

```json
{
  "vector_a": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8],
  "vector_b": [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]
}
```

Response:

```json
{
  "score": 1.0,
  "qubits": 8,
  "path": "cirq"
}
```

Example:

```bash
curl -X POST http://localhost:8080/kernel \
  -H "Content-Type: application/json" \
  -d '{"vector_a":[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8],"vector_b":[0.1,0.2,0.3,0.4,0.5,0.6,0.7,0.8]}'
```

Invalid vectors return HTTP `422`. Both vectors must contain exactly 8 finite numeric values.

### `POST /reduce`

Internal helper endpoint used by the nightly Hidden Connections batch. It fits PCA on one supplied user corpus and returns per-entry 8D PCA vectors plus normalized Cirq angle vectors. The endpoint expects entries from a single user/corpus; do not mix users in one request.

Request:

```json
{
  "entries": [
    {
      "id": "entry_a",
      "embedding": [0.0]
    }
  ],
  "previous_fit_corpus_size": 80
}
```

Each `embedding` must contain exactly 768 finite numeric values. The abbreviated vector above is only for readability.

Response fields include:

- `vectors[].reduced_vector`
- `vectors[].angle_vector`
- `explained_variance_ratio`
- `total_explained_variance`
- `refit_recommended`
- `corpus_size`

## PCA Reduction

XPE-HC-02 adds reusable PCA helpers in `app/pca.py` for reducing Gemini journal embeddings from 768 dimensions to 8 dimensions before Cirq encoding.

PCA is intentionally fitted per user/corpus. Future batch jobs should pass one user's embeddings at a time and should not reuse a model across users. This keeps the reduced space local to the user's own journal history.

The helper:

- validates that every embedding is exactly 768 finite numeric values
- requires at least 8 embeddings before fitting 8 PCA components
- fits `sklearn.decomposition.PCA(n_components=8)` on the supplied corpus
- returns raw 8D PCA vectors
- normalizes those 8D vectors into Cirq `ry()` rotation angles in `[-pi, pi]`
- returns the per-component explained variance ratio and total explained variance
- reports whether a refit is recommended as the corpus grows

40-65% variance retention is a reasonable early expectation for this feature, but the actual total explained variance depends heavily on the size and quality of a user's corpus. Small or repetitive corpora may behave very differently.

Example helper usage:

```python
from app.pca import reduce_embeddings_for_cirq

result = reduce_embeddings_for_cirq(
    user_embeddings,
    previous_fit_corpus_size=80,
)

angle_vectors = result.angle_vectors
total_variance = result.total_explained_variance
needs_refit = result.refit_recommended
```

Refit recommendation is intentionally lightweight until persistence is added. It returns `True` when there is no previous fit size, when the previous fit was below the minimum corpus size, or when the corpus has grown by at least the greater of 10 embeddings or 25%.

## Run Locally

From this directory:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Run PCA tests:

```bash
pytest
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Run PCA tests:

```powershell
pytest
```

## Docker

Build:

```bash
docker build -t yggdrasil-cirq-service .
```

Run:

```bash
docker run --rm -p 8080:8080 yggdrasil-cirq-service
```

## Cloud Run Notes

Example deployment:

```bash
gcloud run deploy yggdrasil-cirq-service \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --cpu=1 \
  --memory=512Mi \
  --port=8080
```

Use `--min-instances=0` so the service can scale to zero when idle. Authentication, service-to-service permissions, and caller wiring should be added when the hidden-connections batch job is implemented.
