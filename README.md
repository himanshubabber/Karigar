# 🛠️ Karigar  
### On-Demand Skilled Worker Platform

> A full-stack web application that connects customers with nearby skilled workers  
> such as plumbers, electricians, and carpenters — in real time.

🔗 **Live Demo:** https://karigar-mu.vercel.app/  
🔗 **Workflow:** https://drive.google.com/file/d/18v9C-WVOXxjLFcXRIIacTIzwdZiP0SGH/view?usp=sharing
---

## ✨ Overview

* Karigar simplifies finding reliable local service professionals.
* Manages the **complete service lifecycle** from request creation to job completion.
* Built with scalability, real-time tracking, and clean architecture in mind.

---

## 🚀 Features

### 👤 Customer
* Secure authentication
* Create service requests with category & description
* Optional audio note upload
* Live worker tracking on map
* Distance & location details
* Cancel service with reason
* Rate worker after job completion

### 🧑‍🔧 Worker
* Worker authentication
* Accept or reject service requests
* Real-time location updates
* Job status management (Pending → Ongoing → Completed)
* Profile information management

---

## 🗺️ Map & Location System

* Interactive maps using Leaflet
* Real-time worker & customer coordinates
* Human-readable location names
* Distance calculation between worker and customer

---

## 🧠 Service Workflow

* Customer creates a service request
* System searches nearby available workers
* Worker accepts the request
* Live worker location sharing
* Job status updates
* Job completion & rating
* Optional cancellation handling

---

## 🧰 Tech Stack

### 🎨 Frontend
* Core: React.js  
* Styling: Tailwind CSS  
* Routing: React Router  
* Maps: Leaflet (Geospatial visualization)  
* State Management: Context API  

---

### ⚙️ Backend
* Environment: Node.js  
* Framework: Express.js  
* Database: MongoDB (NoSQL)  
* Authentication: JSON Web Tokens (JWT)  
* File Handling: Multer (specialized for audio uploads)  

---

### 🔌 Third-Party Services
* Payments: Razorpay (secure payment gateway integration)  
* SMS / OTP: Twilio (real-time notifications and verification)  
* Email Service: Nodemailer (transactional email notifications)  
---

## 🏗️ Project Structure

### Frontend
* Modular components for maps & service requests
* Separate views for worker and customer
* Centralized state using Context API

### Backend
* RESTful API architecture
* Controllers for service lifecycle
* Middleware for authentication & error handling
* Utility helpers for async handling

---

## 🔐 Security

* JWT-based authentication
* Protected routes
* Role-based access control
* Centralized async error handling
* Secure file upload handling

---

## 📚 Learning Outcomes

* Real-time location-based system design
* Complex service lifecycle management
* Role-based authentication & authorization
* Backend architecture with Express & MongoDB
* Full-stack application deployment

---

## 🔮 Future Enhancements

* Real-time notifications (Socket.IO)
* In-app chat between customer & worker
* Admin dashboard
* Worker availability scheduling

---

## 👨‍💻 Author

**Himanshu Singh**  
* Final Year CSE Student, DTU  
* Full-Stack Web Developer
* 📧 Email: **himanshusingh2087@gmail.com**
* 📬 Feedback or Queries: **karigar.mu.app@gmail.com**
 
---

⭐ *If you like this project, don’t forget to star the repository!*

> ⚡ Note: The platform has been validated through real-world usage of complete service lifecycles, ensuring robustness across request handling, tracking, and completion flows.
