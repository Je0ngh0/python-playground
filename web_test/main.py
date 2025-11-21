from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# static 폴더를 /static 경로로 서빙
app.mount("/static", StaticFiles(directory="static"), name="static")

# 루트(/) 경로에서 index.html 제공
@app.get("/")
def read_index():
    return FileResponse("static/index.html")