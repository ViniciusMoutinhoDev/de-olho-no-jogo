import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import Diary from './pages/Diary'
import LeagueView from './pages/LeagueView'
import Navbar from './components/Navbar'

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token')
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const auth = useAuth()

  return (
    <BrowserRouter>
      {auth.user && <Navbar user={auth.user} onLogout={auth.logout} />}
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute><Home auth={auth} /></PrivateRoute>
        } />
        <Route path="/diary" element={
          <PrivateRoute><Diary /></PrivateRoute>
        } />
        <Route path="/league/:tournamentId" element={
          <PrivateRoute><LeagueView /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}
