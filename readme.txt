docker build -t rilspers/baraja-server:latest .
docker push rilspers/baraja-server:latest
docker-compose down
docker-compose up -d