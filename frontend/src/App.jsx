import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Menu from './pages/Menu';
import CreateRecipe from './pages/CreateRecipe';
import About from './pages/About';
import Contact from './pages/Contact';
import RecipeDetail from './pages/RecipeDetail';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Componente para rutas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-5">Cargando...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar />
        <main className="flex-grow-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/menu" element={<Menu />} />
            <Route path="/recipe/:id" element={<RecipeDetail />} />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-recipe" 
              element={
                <ProtectedRoute>
                  <CreateRecipe />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <footer className="bg-dark text-white py-4 mt-auto">
          <div className="container text-center">
            <p className="mb-0">&copy; 2025 Recetas De Comidas. Todos los derechos reservados.</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
