# 🛒 Declutter Backend

[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen)](https://github.com/afolabi/Declutter_backend)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-22.x-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.x-lightgrey)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green)](https://www.mongodb.com/)

**Declutter Backend** is a high-performance, scalable, and secure e-commerce engine built with **TypeScript** and **Express**. It serves as the robust backbone for a modern marketplace, handling complex workflows including user multi-tier authentication, inventory management, dynamic pricing, and automated background processes.

---

## 🌟 Key Features

### 🛡️ Advanced Security & Robustness

- **Rate Limiting & Bot Protection**: Integrated `express-rate-limit` and custom bot blocking middleware to prevent DDoS and scraping.
- **Secure Authentication**: Multi-layered JWT-based authentication with separate flows for users and administrators.
- **Input Validation**: Strict schema-based validation using `express-validator` to ensure data integrity and prevent injection attacks.

### 📦 Commerce & Inventory Engine

- **Full-featured Cart & Order Management**: Complex state-driven order lifecycle from placement to fulfillment.
- **Dynamic Category & Product Logic**: Managed through administrative hierarchies and automated inventory tracking.
- **Logistic Integration**: Backend support for tracking and shipping state management.

### ⚙️ Automation & Operational Excellence

- **Automated Workflows**: Scheduled background tasks using `node-cron` for periodic updates and maintenance.
- **Centralized Error Handling**: Robust error propagation and consistent API responses across all modules.
- **Environment Driven Config**: Flexible configuration management for development, staging, and production environments.

### 📑 API First Design (Swagger/OpenAPI)

- **Built-in Documentation**: Automated API documentation available via Swagger UI, ensuring seamless frontend integration and developer onboarding.

---

## 🛠️ Tech Stack

### Core

- **Language**: [TypeScript](https://www.typescriptlang.org/) (Static typing for enterprise-grade reliability)
- **Runtime**: [Node.js](https://nodejs.org/)
- **Framework**: [Express.js](https://expressjs.com/) (High-performance web framework)

### Database & Storage

- **Primary Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) (Object Modeling)
- **Media Management**: [ImageKit](https://imagekit.io/) (Cloud-based asset optimization)

### Services & Utilities

- **Messaging**: [Brevo](https://www.brevo.com/) (SMTP/Transactional Emails)
- **PDF Generation**: [Pdfkit](http://pdfkit.org/) & [JSPDF](https://github.com/parallax/jsPDF) (Invoicing and reporting)
- **Utilities**: [Lodash](https://lodash.com/), [Axios](https://axios-http.com/), [Dotenv](https://github.com/motdotla/dotenv)

---

## 🏗️ Architecture Overview

The project follows a modular **MVC-inspired** architecture designed for scalability and maintainability:

```text
src/
├── controllers/    # Request handling and business logic orchestration
├── models/         # Mongoose schemas and data persistence logic
├── routes/         # Express routing definitions (API/Admin/User)
├── middlewares/    # Security, Auth, and Request processing
├── cronJob/        # Background automation tasks
├── swagger.ts       # OpenAPI/Swagger configuration
└── server/          # Entry point and server initialization
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)
- npm or yarn

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/afolabi/Declutter_backend.git
    cd Declutter_backend
    ```

2.  **Install dependencies**:

    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and populate it based on the requirements (see `.env.example` if available).

4.  **Launch the Application**:

    ```bash
    # Development mode (with Hot Reload)
    npm run dev

    # Build and Start for Production
    npm run build
    npm start
    ```

---

## 📖 API Documentation

The API is fully documented using Swagger. Once the server is running, you can access the interactive documentation at:
`http://localhost:6000/api-docs` (Default port)

---

## 👨‍💻 Author

**Yusuf Afolabi**  
_Full Stack (Backend) Developer_

---

## ⚖️ License

This project is licensed under the **ISC License**.
