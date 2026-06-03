FROM nginx:alpine


RUN rm -rf /usr/share/nginx/html/*

COPY index.html auth.html chat.html /usr/share/nginx/html/

COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/

EXPOSE 100

CMD ["nginx", "-g", "daemon off;"]