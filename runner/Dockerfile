FROM python:3.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends g++ nlohmann-json3-dev && rm -rf /var/lib/apt/lists/*
RUN useradd --uid 10001 --create-home student
USER student
WORKDIR /work
CMD ["python3", "--version"]
