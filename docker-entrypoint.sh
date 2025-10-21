#!/bin/sh
set -e

echo "Esperando que Postgres esté listo..."
while ! nc -z $DB_HOST $DB_PORT; do
  echo "Postgres no está disponible aún - esperando..."
  sleep 2
done

echo "Postgres está listo! Ejecutando migraciones..."

# Ejecutar migraciones y seeders
npm run db:migrate
npm run db:seed

echo "Iniciando aplicación..."
exec npm start