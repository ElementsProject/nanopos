FROM node:carbon
WORKDIR /opt/nanopos
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9112 9116
CMD [ "npm", "start" ]
