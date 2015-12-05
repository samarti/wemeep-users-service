FROM centos:centos6

# Enable Extra Packages for Enterprise Linux (EPEL) for CentOS
RUN     yum install -y epel-release
# Install Node.js and npm
RUN     yum install -y nodejs npm git

# Install app dependencies
COPY src/package.json /package.json
RUN cd /src; npm install

# Bundle app source
COPY . /src

EXPOSE 8080
RUN npm install neo4j --save
RUN npm install --save body-parser
CMD ["node", "/src/index.js"]
