from fastapi import FastAPI

app = FastAPI(
    title="AURON API Gateway",
    version="0.1.0",
    description="API Gateway for the AURON commerce and fulfillment platform.",
)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "auron-api-gateway",
        "version": "0.1.0",
    }
