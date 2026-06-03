
FROM nginx:alpine

RUN sed -i 's/listen       80;/listen       100;/g' /etc/nginx/conf.d/default.conf


COPY . /usr/share/nginx/html

EXPOSE 100
CMD ["nginx", "-g", "daemon off;"]