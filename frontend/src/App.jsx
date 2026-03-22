import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import ClubSearch from './pages/ClubSearch'
import Diary from './pages/Diary'
import Navbar from './components/Navbar'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { user, logout } = useAuth()

  return (
    <BrowserRouter>
      {user && <Navbar user={user} onLogout={logout} />}
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute><ClubSearch /></PrivateRoute>
        } />
        <Route path="/diary" element={
          <PrivateRoute><Diary /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
