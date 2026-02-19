server_ip := env_var("AWAIS_SERVER_IP")

frontend:
	cd frontend && npm run build
	rsync -azP --delete dist/ younes@{{ server_ip }}:/home/younes/allstyles/
