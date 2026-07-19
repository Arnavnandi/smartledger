# SmartLedger

An AI-powered Invoice & Billing System for freelancers and small businesses.

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, React Hook Form, Zod, Recharts
**Backend:** Java 21, Spring Boot 3, Spring Security, JWT, Spring Data JPA, Hibernate, Maven
**Database:** PostgreSQL
**AI & Utilities:** Google Gemini API, Tesseract OCR, OpenPDF, Gmail SMTP

## Getting Started

### Prerequisites
- Node.js (v20+)
- Java 21+
- Maven
- Docker & Docker Compose
- API Keys: Google Gemini API Key

### Local Development Setup

#### 1. Start Database
```bash
docker-compose up -d db
```

#### 2. Backend
Navigate to the `backend` directory, install dependencies and run the application:
```bash
cd backend
mvn spring-boot:run
```
The backend API will be running on `http://localhost:8080`.
Swagger UI documentation can be accessed at `http://localhost:8080/swagger-ui.html`.

#### 3. Frontend
Navigate to the `frontend` directory, install dependencies and run the development server:
```bash
cd frontend
npm install
npm run dev
```
The frontend will be running on `http://localhost:5173`.

## Architecture
This project follows clean architecture principles:
- **backend**: Features a layered Spring Boot architecture (`controller`, `service`, `repository`, `model`).
- **frontend**: Scalable React folder structure containing reusable `components`, layout `pages`, and `services` layer for API interaction.
