# ipx.run - Premium Network Analysis Dashboard

ipx.run is a modern, high-tech dashboard for network analysis and diagnostics of IP addresses and domain names. The interface features a premium design with glassmorphism effects, smooth micro-animations (using framer-motion), and an interactive map.

The project supports 5 core modules:
1. Geolocation & Security: Detects coordinates, Internet Service Provider (ISP), Autonomous System Number (ASN), and runs checks for proxies, VPNs, Tor exit nodes, and spam databases.
2. DNS Records: Performs parallel queries and parses standard domain records (A, AAAA, MX, TXT, NS, CNAME).
3. WHOIS Lookup: Retrieves domain registration and network allocation data via the modern IETF RDAP (Registration Data Access Protocol) with an interactive raw JSON viewer.
4. Interactive Ping (Ping Latency): Live streaming of ping output in real-time using Server-Sent Events (SSE), a visual latency wave analyzer, and automatic RTT metric calculations.
5. Advanced Dig (Dig DNS): A fully featured replacement for the command-line dig utility. It queries public resolvers like Google (8.8.8.8), Cloudflare (1.1.1.1), OpenDNS (208.67.222.222), or domain authoritative nameservers, presenting results in both structured tables and raw console logs.

---

## System Requirements and Environment

To ensure all features work correctly, the following components are required:

### 1. Runtime Environment
* Node.js: Version 18.x or higher (LTS versions 20.x / 22.x are recommended).
* npm (comes with Node.js) or alternative package managers (Yarn / pnpm / Bun).

### 2. System Binaries
For maximum accuracy and native output, the Ping and Dig modules execute system-level binaries. Ensure they are installed on your host system:

* Linux (Debian / Ubuntu / Linux Mint):
  ```bash
  sudo apt update
  sudo apt install -y iputils-ping dnsutils
  ```
* Linux (CentOS / RHEL / Rocky Linux / Fedora):
  ```bash
  sudo dnf install -y iputils bind-utils
  ```
* macOS:
  * Ping (ping) is built into the system by default.
  * For the dig utility, install the bind package:
    ```bash
    brew install bind
    ```
* Windows:
  * The project is designed for Unix-like environments. To run it on Windows, it is highly recommended to use WSL (Windows Subsystem for Linux) with an Ubuntu distribution.

#### Built-in Resilient Fallbacks (Cloud Hosting Compatibility)
If the project is deployed in a serverless environment (such as Vercel) or inside containers where running system binaries is restricted:
* Ping automatically falls back to TCP-PING mode (measuring TCP handshake latency on ports 80/443 using native Node.js net sockets).
* Dig automatically falls back to Node.js's built-in asynchronous DNS resolver (dns/promises), generating a matching log format for the terminal.

---

## Quick Start

### 1. Clone the Repository
Clone the project from GitHub:
```bash
git clone https://github.com/bogdanovby/ipx.run.git
cd ipx.run
```

### 2. Install Dependencies
Install the required NPM packages:
```bash
npm install
```

### 3. Run in Development Mode
Start the local development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The server supports Hot Module Replacement (HMR) on file saves.

### 4. Build and Run in Production
To build an optimized, production-ready bundle:
```bash
npm run build
npm run start
```

---

## Project Structure

* src/services/ - Logic for requests to APIs and system binaries:
  * ipService.ts - Geolocation parsing and security scoring.
  * whoisService.ts - RDAP vCard parsing and registry date formatting.
  * dnsService.ts - Standard DNS record lookups.
  * pingService.ts - Subprocess spawning for system ping and TCP fallback.
  * digService.ts - Execution of dig queries and stdout parsing.
* src/app/api/ - Routes for Next.js App Router API endpoints:
  * api/ip/[ip]/route.ts - Unified payload builder for IP/Domain lookups.
  * api/ping/route.ts - Ping streaming over Server-Sent Events (SSE).
  * api/dig/route.ts - Execution and parsing of the dig utility.
* src/components/ - Interactive UI components:
  * Dashboard.tsx - Main dashboard with tab switching and state management.
  * Cards/ - Visual cards for each module (including PingCard.tsx and DigCard.tsx).
* src/app/globals.css - Tailwind CSS v4 styling, custom theme variables, grids, and glassmorphic designs.

---

## Security

Since the project interacts with system-level commands, all inputs (domains, IPs, record types, and nameserver addresses) undergo strict white-list validation and escaping in the backend services. The use of execFile instead of exec ensures complete immunity to Shell Command Injection, as arguments are passed directly to the OS kernel as an array of strings, completely bypassing the /bin/sh command interpreter.
