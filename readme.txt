docker build -t barajacoffee/barajahub:latest .
docker push barajacoffee/barajahub:latest

PRODUCTION LINUX


docker rm -f barajahub / docker system prune -f
docker-compose down
docker-compose build --no-cache
docker-compose up -d


TEST WINDOWS

docker-compose -f docker-compose.dev.yml down; docker-compose -f docker-compose.dev.yml up -d; docker logs barajahub_windows -f

docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d