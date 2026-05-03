up:
	docker compose -f .local/docker-compose.yml up -d

build:
	docker compose -f .local/docker-compose.yml up --build -d

buildCache:
	docker compose -f .local/docker-compose.yml build --no-cache

down:
	docker compose -f .local/docker-compose.yml down

restart:
	docker compose -f .local/docker-compose.yml down && docker compose -f .local/docker-compose.yml up -d

service:
	docker compose -f .local/docker-compose.yml up --build saaserp -d

fixdatabase:
	docker exec -it  chown -R postgres:postgres /var/lib/postgresql/data

#

#fixdatabase:
#	docker exec -it local-db-1 chown -R mysql:mysql /var/lib/mysql