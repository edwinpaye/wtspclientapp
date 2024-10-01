# Step 1: Base Image
FROM node:latest
# FROM node:18-alpine

RUN apt-get update \
  && apt-get install -y \
  gconf-service \
  libgbm-dev \
  libasound2 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgcc1 \
  libgconf-2-4 \
  libgdk-pixbuf2.0-0 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  ca-certificates \
  fonts-liberation \
  libappindicator1 \
  libnss3 \
  lsb-release \
  xdg-utils \
  && rm -rf /var/lib/apt/lists/*


# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and package-lock.json files
COPY package.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the source code into the container
COPY main.js .

# Step 6: Expose the application port
EXPOSE 3000

# Step 7: Start the application
CMD ["node", "main.js"]
