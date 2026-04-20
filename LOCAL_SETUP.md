# Lancement local

## Frontend Expo

```bash
cd frontend
npx expo start --clear
```

Le `--clear` est utile quand l'app Expo Go reste bloquee sur un ancien bundle ou une ancienne config d'environnement.

## Backend en mode Symfony natif

```bash
cd backend
docker compose up -d database
symfony serve --allow-all-ip --no-tls
```

URL a utiliser depuis un telephone sur le meme reseau :

```bash
EXPO_PUBLIC_API_URL=http://<IP_LAN_PC>:8000/api
```

## Backend web via Docker Compose

```bash
cd backend
docker compose up -d
```

URL a utiliser depuis un telephone sur le meme reseau :

```bash
EXPO_PUBLIC_API_URL=http://<IP_LAN_PC>/api
```
