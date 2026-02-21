// import React, { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import "./Register.css";

// const Register = () => {
//   const navigate = useNavigate();

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     rollNumber: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();

//     const users = JSON.parse(localStorage.getItem("users")) || [];

//     // check existing email
//     const alreadyExists = users.some(
//       (u) => u.email === form.email
//     );

//     if (alreadyExists) {
//       alert("User already registered!");
//       return;
//     }

//     const newUser = {
//       ...form,
//       role: "Student", // 🔥 FIXED
//       joined: new Date().toLocaleString(),
//     };

//     users.push(newUser);
//     localStorage.setItem("users", JSON.stringify(users));

//     alert("Registration successful! Please login.");
//     navigate("/");
//   };

//   return (
//     <div className="register-container">
//       <div className="register-box">
//         <div className="logo">📊</div>
//         <h2>Campus Poll Hub</h2>
//         <p>Create your student account</p>

//         <form onSubmit={handleSubmit}>
//           <input
//             type="text"
//             name="name"
//             placeholder="Full Name"
//             value={form.name}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type="email"
//             name="email"
//             placeholder="Email"
//             value={form.email}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type="password"
//             name="password"
//             placeholder="Password"
//             value={form.password}
//             onChange={handleChange}
//             required
//           />

//           <input
//             type="text"
//             name="rollNumber"
//             placeholder="Roll Number"
//             value={form.rollNumber}
//             onChange={handleChange}
//             required
//           />

//           <button type="submit">Create Account</button>
//         </form>

//         <div className="register-footer">
//           Already have an account?{" "}
//           <Link to="/">Go to Login</Link>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Register;
