# MathSolver Backend

The MathSolver Backend is a Node.js application built with NestJS that uses OpenAI's GPT-3.5-turbo model to solve mathematical problems and Pinecone's vector database to store and retrieve similar questions and their solutions.

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Error Handling](#error-handling)
- [License](#license)

## Installation

To get started with the MathSolver Backend, follow these steps:

1. Clone the repository:

    ```bash
    git clone https://github.com/AdebisiJoe/math-solver-backend.git
    cd math-solver-backend
    ```

2. Install the dependencies:

    ```bash
    npm install
    ```

3. Build the application:

    ```bash
    npm run build
    ```

4. Start the application:

    ```bash
    npm run start
    ```

## Configuration

The MathSolver Backend requires configuration for API keys. Create a `.env` file in the root directory of your project and add the following environment variables:

```env
OPENAI_API_KEY=your_openai_api_key
PINECONE_API_KEY=your_pinecone_api_key
```

## Usage

After starting the application, the server will be running on `http://localhost:3000`. You can now interact with the API using HTTP requests.

## API Endpoints

### Solve a Math Question

- **Endpoint**: `/solve`
- **Method**: `POST`
- **Description**: Solves a mathematical question and returns the solution in LaTeX format.

- **Request Body**:
    ```json
    {
      "question": "string"
    }
    ```

- **Response**:
    ```json
    {
      "solution": "string"
    }
    ```

### Get Similar Questions

- **Endpoint**: `/similar`
- **Method**: `POST`
- **Description**: Retrieves similar questions and their solutions from the Pinecone database.

- **Request Body**:
    ```json
    {
      "question": "string"
    }
    ```

- **Response**:
    ```json
    [
      {
        "question": "string",
        "solution": "string"
      },
      ...
    ]
    ```

## Error Handling

The MathSolver Backend uses HTTP status codes to indicate the success or failure of an API request. The following are the possible error responses:

- **400 Bad Request**: The request is malformed or missing required parameters.
- **500 Internal Server Error**: An unexpected error occurred on the server.

When an error occurs, the response will include a message describing the error:

```json
{
  "statusCode": 500,
  "message": "Failed to solve the question: error message"
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
