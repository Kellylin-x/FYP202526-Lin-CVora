from fastapi import APIRouter

router = APIRouter()


@router.get("/cv/sample")
def sample_cv():
    return {"cv": "sample placeholder"}
