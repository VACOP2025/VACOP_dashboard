FROM python:3.10-slim

WORKDIR /app

# Installation des dépendances système pour psycopg2
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 5000

# Lancement : on joue le seed (création tables/admin) puis on lance l'app
CMD ["sh", "-c", "python seed.py && python -m backend.app"]