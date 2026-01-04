# 🧓 ElderCare Support Portal

A full-stack web application designed to connect elderly users with volunteers and caregivers for timely assistance. The platform focuses on accessibility, security, and ease of use, ensuring that elders can request help and volunteers can respond efficiently.

## 🌟 Key Features

### 👴 Elder (User) Side

- User registration with **Email / Phone OTP verification**
- Secure login & logout
- Create support requests (medical help, daily assistance, emergency needs, etc.)
- View request status (Pending / Accepted / Completed)
- Simple and senior-friendly UI

### 🤝 Volunteer Side

- Volunteer registration with verification
- Login and dashboard access
- View nearby elder requests
- Accept or decline requests
- Track assigned tasks
- Update request status
- Earn badges based on completed tasks


## 🧑‍💻 Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript

### Backend
- Node.js
- Express.js

### Database
- MongoDB Atlas

### Authentication & Communication
- OTP verification using **Gmail SMTP**
- Secure password handling

### Deployment
- Frontend & Backend deployed on **Render**

## 🔐 Authentication Flow

1. User registers with email/phone number
2. OTP is sent for verification
3. Account is created **only after successful OTP verification**
4. User can log in using verified credentials

This ensures **security and authenticity** of users and volunteers.

## 🚀 Getting Started (Local Setup)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/irfanmohiddin/eldercareportal.git
```

### 2️⃣ Navigate to the project

```bash
cd eldercareportal
```

### 3️⃣ Install dependencies

```bash
npm install
```

### 4️⃣ Create .env file

Create a `.env` file in the root directory and add the following:

```env
MONGO_URI=your_mongodb_connection_string
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
```

### 5️⃣ Run the server

```bash
npm start
```

The application should now be running on your local machine!


## 🎯 Project Goals

- Improve accessibility to care for elderly individuals
- Enable faster help through volunteer engagement
- Provide a secure, scalable, and user-friendly platform
- Gain hands-on experience in full-stack development

## 📌 Future Enhancements

- [ ] Real-time notifications
- [ ] Location-based request filtering
- [ ] Chat between elder and volunteer
- [ ] Mobile-responsive optimizations
- [ ] AI-based request prioritization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🐛 Issues

If you encounter any problems or have suggestions, please open an issue on the [GitHub Issues](https://github.com/irfanmohiddin/eldercareportal/issues) page.


## 👤 Author

**Shaik Irfan Mohiddin**  
Computer Science Student

🔗 [LinkedIn](https://www.linkedin.com/in/shaik-irfan-mohiddin-537589323/)  
💻 [GitHub](https://github.com/irfanmohiddin)

Made with ❤️ to improve elderly care services
