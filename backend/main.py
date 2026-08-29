from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "SIH26154 backend is running"}
