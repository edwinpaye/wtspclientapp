# Step 1: Base Image
FROM node:18-alpine

# Step 2: Set the working directory inside the container
WORKDIR /usr/src/app

# Step 3: Copy the package.json and package-lock.json files
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the source code into the container
COPY . .

# Step 6: Expose the application port
EXPOSE 3000

# Step 7: Start the application
CMD ["node", "index.js"]
