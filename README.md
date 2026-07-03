🚀 UniLance
UniLance is a full-stack, role-based freelancing platform tailored specifically for college students. It helps student freelancers showcase their technical skills, secure jobs within their university networks, and dynamically build professional resumes using an integrated, data-driven system.

🛠️ Tech Stack
Backend Architecture
Runtime Environment: Node.js

Framework: Express.js (REST API design, modular routing system)

Database: MongoDB with Mongoose (Object Data Modeling)

Authentication & Security: JSON Web Tokens (JWT) with secure HTTP-only cookies, Custom Role-Based Access Control (RBAC) middleware

File Management: Multer (handling local profile photo uploads and portfolio images)

Frontend Architecture
Library: React.js

State Management: Context API / Redux Toolkit

Styling: Tailwind CSS (fully responsive, modern UI layouts)

🌟 Key Features
Role-Based Access Control (RBAC): Distinct dashboards and access patterns for Clients (students looking to hire) and Workers/Freelancers (students looking for tasks).

Dynamic Portfolio & Profiles: Real-time profile updates including technical bio management, automated skills-tagging, and link binding (GitHub, personal portfolios).

Integrated Resume Builder: A streamlined utility pulling user profile data directly from MongoDB to generate professional resume formats seamlessly.

Media & Document Processing: Secure file processing engines built to parse, process, and map profile photos or project attachments cleanly.

Robust Worker Discovery: Advanced text-based regex query engine allowing users to dynamically search for peers based on specialized skills, names, or usernames.

University-Centric Infrastructure: Filters and locks ensuring jobs, ratings, and reviews stay contextualized to the specific campus ecosystem.

📁 Repository Structure
Plaintext
unilance/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route handler logic (user, job, review controllers)
│   │   ├── middlewares/      # Authentication & route protection layers
│   │   ├── models/           # Mongoose schemas (User, Job, Review Models)
│   │   └── routes/           # Express routing mapping system
│   ├── uploads/              # Local storage destination for images/avatars
│   ├── .env                  # Environment configurations
│   └── server.js             # Server entry point
└── frontend/                 # Client application root
⚡ Quick Start
Prerequisites
Node.js (v18 or higher recommended)

MongoDB Instance (Local or Atlas cluster)

Backend Setup
Navigate to the backend directory:

Bash
cd backend
Install the clean, optimized dependencies:

Bash
npm install
Create a .env file in the backend/ root directory and populate it with your environment parameters:

Code snippet
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret_key
Fire up the development environment using nodemon:

Bash
npm run dev
Frontend Setup
Open a new terminal window and navigate to the frontend folder:

Bash
cd frontend
Install the required client packages:

Bash
npm install
Start the application:

Bash
npm start
Development Note: Ensure that no standalone packages named router are injected into your workspace dependencies. Always rely strictly on Express's native implementation: express.Router().
