FROM ubuntu
EXPOSE 8080

RUN apt-get update
RUN apt-get install -y nodejs npm

# Install app dependencies
COPY src/package.json /package.json
RUN cd /src; npm install

# Bundle app source
COPY . /src

EXPOSE 8080
RUN npm install mongodb --save
RUN npm install --save body-parser
CMD ["bash", "/src/init.sh"]
