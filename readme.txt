docker build -t barajacoffee/barajahub:latest .
docker push barajacoffee/barajahub:latest
docker-compose down
docker-compose up -d