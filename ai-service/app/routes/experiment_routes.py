from fastapi import APIRouter, HTTPException
from app.models.schemas import IEEEExperimentRequest, IEEEExperimentResponse
from app.services.experiment_runner import IEEEExperimentRunner

router = APIRouter(prefix="/experiments", tags=["IEEE Research Experiments"])

@router.post("/run-benchmark", response_model=IEEEExperimentResponse)
def run_benchmark(req: IEEEExperimentRequest):
    try:
        return IEEEExperimentRunner.run_benchmark(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to execute benchmark: {str(e)}")
