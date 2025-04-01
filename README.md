# Stock Management Application

This repository contains the source code for a stock management application, comprising both a backend server (built with Node.js) and a frontend client (built with React.js).

## Description

This application allows users to manage stock information, including adding, viewing, updating, and deleting stock items. The backend server provides API endpoints for data manipulation, while the frontend offers a user-friendly interface for interacting with these endpoints.

## Prerequisites

Before running the application, ensure you have the following installed:

* **Node.js and npm (Node Package Manager):** Required for running the backend server and managing frontend dependencies.
* **Go (Golang):** Required to run the go code.
* **nodemon (optional):** Recommended for automatically restarting the server during development. Install it globally using: `npm install -g nodemon`

## Backend Setup (Node.js)

1.  **Navigate to the backend directory:**
    ```bash
    cd stock
    ```

2.  **Start the server:**
    * If you have nodemon installed:
        ```bash
        nodemon server.js
        ```
    * Otherwise, use Node.js:
        ```bash
        node server.js
        ```

    This will start the backend server, typically listening on a specified port (e.g., port 3001). Check the console output for the server's address and port.

## Frontend Setup (React.js)

1.  **Open a new terminal window or tab.**

2.  **Navigate to the frontend directory:**
    ```bash
    cd my-app
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

4.  **Start the React application:**
    ```bash
    npm start
    ```

    This will launch the React development server and open the application in your default web browser. The application will typically run on `http://localhost:3000`.

## Important Notes

* **Backend API Endpoint:** The React application communicates with the backend server via API endpoints. Ensure the backend server is running before starting the frontend.
* **Port Configuration:** If the backend and frontend servers are running on different ports, you may need to adjust the API endpoint URLs in the React application's code to match the backend's port.
* **Data Persistence:** The current implementation might use in-memory data storage. For persistent data storage, consider integrating a database (e.g., MongoDB, PostgreSQL) and updating the backend accordingly.
* **Go code:** the go code is included in the stock folder. if you want to run the go code, you can use the command "go run ." in the stock folder.



