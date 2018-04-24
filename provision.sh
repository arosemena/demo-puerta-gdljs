#!/bin/bash

# Para correr en el raspberry despues de instalar Raspbian

# Actualizar paquetes
sudo apt update

# Instalar dependencias
sudo apt install npm redis-server -y

# Instalar dependencias npm
npm install

# Iniciamos redis
sudo systemctl enable redis
sudo systemctl start redis