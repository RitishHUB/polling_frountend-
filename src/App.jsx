import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";

import AdminDashboard from "./pages/AdminDashboard";
import Student from "./pages/Student";
import Staff from "./pages/staff.jsx";


function App() {
  return (
    <Router>
      <Routes>
        {/* LOGIN ROUTE */}
        <Route path="/" element={<Login />} />


        {/* ADMIN ROUTE */}
        <Route path="/admin" element={<AdminDashboard />} />

        {/* STUDENT ROUTE */}
        <Route path="/student" element={<Student />} />
        {/* STAFF ROUTE */}
        <Route path="/staff" element={<Staff />} />
      </Routes>
    </Router>
  );
}

export default App;
