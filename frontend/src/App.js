import React from 'react';
import PropertyList from './components/PropertyList';
import './styles/App.css'; // Import the new CSS for navbar and layout

function App() {
  return (
    <div>
      {/* Navbar */}
      <header className="navbar">
        <div className="navbar-container">
          <h1 className="logo">🏠 RentNest</h1>
          <nav>
            <ul className="nav-links">
              <li><a href="/">Home</a></li>
              <li><a href="/">Properties</a></li>
              <li><a href="/">Contact</a></li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <PropertyList />
      </main>
    </div>
  );
}

export default App;
