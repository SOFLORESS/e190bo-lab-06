
# Your idea board in a box: the API and the page, in one image.

FROM python:3.13-slim

WORKDIR /app

COPY src/requirements-app.txt .
RUN pip install --no-cache-dir -r requirements-app.txt

COPY src/ .

ENV PORT=8000

CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port $PORT"]
