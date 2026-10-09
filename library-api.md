# Library API Specification - Books Resource

This document outlines the REST API design for managing books within the library system.

## Endpoints

### 1. List All Books
* **Method:** `GET`
* **Path:** `/api/books`
* **Description:** Retrieves a list of all available books in the library.
* **Success Status Code:** `200 OK`

### 2. Get Single Book
* **Method:** `GET`
* **Path:** `/api/books/:id`
* **Description:** Retrieves detailed information for a specific book by its unique ID.
* **Success Status Code:** `200 OK`

### 3. Create a Book
* **Method:** `POST`
* **Path:** `/api/books`
* **Description:** Adds a new book to the library catalog.
* **Example Request Body:**
  ```json
  {
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "publishedYear": 1925
  }
  ```
* **Success Status Code:** `201 Created`

### 4. Update a Book
* **Method:** `PUT`
* **Path:** `/api/books/:id`
* **Description:** Updates all details of an existing book identified by its ID.
* **Example Request Body:**
  ```json
  {
    "title": "The Great Gatsby (Revised Edition)",
    "author": "F. Scott Fitzgerald",
    "isbn": "9780743273565",
    "publishedYear": 1925
  }
  ```
* **Success Status Code:** `200 OK`

### 5. Delete a Book
* **Method:** `DELETE`
* **Path:** `/api/books/:id`
* **Description:** Removes a book record permanently from the library catalog using its ID.
* **Success Status Code:** `204 No Content`

### 6. List Books by Author
* **Method:** `GET`
* **Path:** `/api/books?author=:authorName`
* **Description:** Filters and returns all books written by a specific author passed as a query parameter.
* **Success Status Code:** `200 OK`

## Standard Error Codes

* **400 Bad Request**
  * **When it happens:** Sent when the request payload is malformed or missing required fields (e.g., trying to create a book without a `title` field).

* **404 Not Found**
  * **When it happens:** Sent when requesting or attempting to modify a book ID that does not exist in the system (e.g., calling `GET /api/books/99999`).