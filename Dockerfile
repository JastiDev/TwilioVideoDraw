FROM node

# Bundle app source
COPY . .

RUN npm install

CMD [ "node", "server.js" ]
