FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN printf 'log_format main_ext "$$remote_addr - $$remote_user [$$time_local] \"$$request\" $$status $$body_bytes_sent \"$$http_referer\" \"$$http_user_agent\" rt=$$request_time uct=$$upstream_connect_time uht=$$upstream_header_time urt=$$upstream_response_time";\nserver {\n  listen 80;\n  server_name _;\n\n  access_log /var/log/nginx/access.log main_ext;\n  error_log /var/log/nginx/error.log warn;\n\n  root /usr/share/nginx/html;\n  index index.html;\n\n  location / {\n    try_files $uri $uri/ /index.html;\n  }\n\n  location /analyze-profile {\n    proxy_pass http://backend:8000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_connect_timeout 180s;\n    proxy_send_timeout 180s;\n    proxy_read_timeout 180s;\n  }\n\n  location /health {\n    proxy_pass http://backend:8000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_connect_timeout 180s;\n    proxy_send_timeout 180s;\n    proxy_read_timeout 180s;\n  }\n\n  location /auth-status {\n    proxy_pass http://backend:8000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_connect_timeout 180s;\n    proxy_send_timeout 180s;\n    proxy_read_timeout 180s;\n  }\n\n  location /extractor-status {\n    proxy_pass http://backend:8000;\n    proxy_set_header Host $host;\n    proxy_set_header X-Real-IP $remote_addr;\n    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n    proxy_set_header X-Forwarded-Proto $scheme;\n    proxy_connect_timeout 180s;\n    proxy_send_timeout 180s;\n    proxy_read_timeout 180s;\n  }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
