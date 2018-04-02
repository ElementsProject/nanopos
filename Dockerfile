FROM node:carbon
WORKDIR /opt/nanopos
COPY . .
ENV HOST=0.0.0.0
RUN npm install
RUN npm run dist
EXPOSE 9116
CMD ["node", "./dist/cli.js"]
