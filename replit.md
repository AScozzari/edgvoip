# W3 VoIP System - Enterprise Multi-tenant VoIP Platform

## Overview

W3 VoIP System is a comprehensive multi-tenant enterprise VoIP platform designed for modern communication needs. It features a React frontend with a glassmorphism UI, an Express backend with secure RESTful APIs, a PostgreSQL database for PBX functionalities, and deep integration with FreeSWITCH for full enterprise PBX capabilities. The system supports multi-tenancy with complete data isolation, targeting deployment on Debian VPS instances. The project aims to provide a robust, scalable, and secure VoIP solution for businesses.

## User Preferences

### Communication
- **Language:** Italiano
- **Style:** Professional, concise

### Development
- **Security First:** Always validate inputs, use env vars for secrets
- **Multi-tenant:** Strict data isolation per tenant
- **Error Handling:** Comprehensive logging and error messages

## System Architecture

The W3 VoIP System adopts a microservices-like architecture with distinct frontend, backend, and database layers, integrated with FreeSWITCH.

**Technology Stack:**
-   **Frontend:** React with Vite for a modern glassmorphism UI, real-time dashboards, and multi-tenant admin panels.
-   **Backend:** Express.js with TypeScript, providing multi-tenant isolation, JWT authentication, RESTful APIs for PBX features, FreeSWITCH ESL client for call control, and an XML service for dynamic FreeSWITCH configuration.
-   **Database:** PostgreSQL, structured for multi-tenancy to manage IVR, Queues, Voicemail, CDR, and Extensions.
-   **PBX Core:** FreeSWITCH, handling SIP/RTP, trunking, IVR, queues, and voicemail functionalities.

**Key Design Decisions & Features:**
-   **Multi-tenancy:** Implemented with strict data isolation at the database level and enforced via backend middleware.
-   **Security:** Focus on SQL injection prevention (whitelist validation), environment variable-based secrets management, and restrictive CORS configuration.
-   **Database Stability (2025-10-24):**
    -   **Connection Pool:** Enterprise-grade pool with automatic reconnection, exponential backoff retry logic (1s → 2s → 4s → 8s → 16s), and comprehensive event handlers (error, connect, remove, acquire, release)
    -   **Health Monitoring:** Periodic health checks every 30 seconds with detailed pool statistics logging
    -   **Error Handling:** Graceful handling of all PostgreSQL connection errors (57P01, 57P02, 57P03, 08003, 08006, ECONNREFUSED) without process termination
    -   **Resilience:** Backend continues operation during PostgreSQL restarts/disconnections with automatic recovery
-   **FreeSWITCH Integration:**
    -   **ESL Service:** Robust auto-reconnecting client for real-time event handling (CHANNEL_CREATE, CHANNEL_ANSWER, CHANNEL_HANGUP) and comprehensive CDR tracking.
    -   **XML Service:** Dynamic configuration generation for FreeSWITCH, including user authentication, dialplan, IVR, queue, and voicemail routing. Critical for dynamic tenant lookup and routing of Italian national and international numbers.
-   **Frontend UI/UX:** Utilizes a modern glassmorphism design with specific CSS classes for cards, headers, sidebars, modals, inputs, and buttons, along with gradient backgrounds and status indicators.
-   **Database Schema:** Comprehensive multi-tenant schema including `Tenants`, `Extensions`, `SIP Trunks`, `IVR Menus`, `Call Queues`, `Voicemail Boxes`, `Conference Rooms`, and `CDR`.
-   **Deployment:** Automated VPS setup script for Debian, configuring Node.js, PostgreSQL, FreeSWITCH (with necessary modules like `mod_xml_curl`, `mod_event_socket`, `mod_sofia`), UFW firewall rules, and systemd services.
-   **API Endpoints:** Structured API for authentication, tenant management, and extension management, with planned expansion for IVR, queues, voicemail, conference, and call control.

## External Dependencies

-   **PostgreSQL:** Relational database for all application data, managed with Drizzle ORM.
-   **FreeSWITCH:** Open-source telephony platform integrated via Event Socket Layer (ESL) for real-time control and XML Curl for dynamic configuration.
-   **MessageNet (example SIP provider):** Used for SIP trunking for external calls.
-   **Node.js:** Runtime environment for backend services.
-   **NPM/Yarn:** Package managers for project dependencies.
-   **Vite:** Frontend build tool for React application.
-   **systemd:** Service manager for running backend and FreeSWITCH on Linux.
-   **UFW (Uncomplicated Firewall):** For managing network security on the VPS.