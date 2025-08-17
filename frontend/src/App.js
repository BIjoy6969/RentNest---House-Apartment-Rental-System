import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import PropertyList from "./components/PropertyList";
import PropertyDetails from './pages/PropertyDetails';
import AddProperty from './pages/AddProperty';
import EditProperty from './pages/EditProperty';
import Register from './pages/Register';
import Login from './pages/Login';

function App() {
  return (
    <Router>
      <nav className="navbar">
        <Link to="/">RentNest</Link>
        <div className="nav-right">
          <Link to="/add">Add Property</Link>
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<PropertyList />} />
        <Route path="/property/:id" element={<PropertyDetails />} />
        <Route path="/add" element={<AddProperty />} />
        <Route path="/edit/:id" element={<EditProperty />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
