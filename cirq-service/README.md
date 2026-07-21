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

## Run Locally

From this directory:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

On Windows PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
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
