FROM python:3.11-alpine AS flask

WORKDIR /app

# Copy all Files
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# Set the Flask application entry point
ENV FLASK_APP=main.py

EXPOSE 8000

# Command to start the Flask server using Gunicorn
CMD ["gunicorn", "-b", "0.0.0.0:8000", "-k", "gevent", "main:app"]