docker build -t barajacoffee/barajahub:latest .
docker push barajacoffee/barajahub:latest

PRODUCTION LINUX

docker-compose down
docker-compose up -d


TEST WINDOWS

docker-compose down
docker-compose -f docker-compose.dev.yml up -d
docker logs barajahub -f