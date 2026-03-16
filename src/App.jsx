import './App.css'
import { Route, Routes, Link, useLocation } from 'react-router-dom';
import RequireAuth from './middleware/RequireAuth';
import RequireRole from './middleware/RequireRole';
import Login from './components/Login';
import Logout from './components/Logout';
import Books from './components/Books';
import { BookDetail } from './components/BookDetail';
import BookBorrow from './components/BookBorrow';
import Profile from './components/Profile';
import SignUp from './components/SignUp';
import { useUser } from './contexts/UserProvider';

function Navigation() {
  const { user } = useUser();
  const location = useLocation();

  if (!user.isLoggedIn) return null;

  return (
    <header className="app-header">
      <div className="app-title">
        📚 Library System
      </div>
      <nav className="app-nav">
        <Link to="/books" className={`app-nav-link ${location.pathname === '/books' ? 'active' : ''}`}>Books</Link>
        <Link to="/borrow" className={`app-nav-link ${location.pathname === '/borrow' ? 'active' : ''}`}>Borrow Requests</Link>
        <Link to="/profile" className={`app-nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>Profile</Link>
        <Link to="/logout" className="app-nav-link">Logout</Link>
      </nav>
    </header>
  );
}

function App() {

  return(
    <>
      <Navigation />
      <main className="main-container">
        <Routes>
          <Route path='/login' element={<Login/>}/>
          <Route path='/signup' element={<SignUp/>}/>
          <Route path='/logout' element={
            <RequireAuth>
              <Logout/>
            </RequireAuth>
          }/>
          <Route path='/' element={
            <RequireAuth>
              <Books/>
            </RequireAuth>
          }/>
          <Route path='/books' element={
            <RequireAuth>
              <Books/>
            </RequireAuth>
          }/>
          <Route path='/books/:id' element={
            <RequireRole allowedRoles={["ADMIN"]}>
              <BookDetail/>
            </RequireRole>
          }/>
          <Route path='/borrow' element={
            <RequireAuth>
              <BookBorrow/>
            </RequireAuth>
          }/>
          <Route path='/profile' element={
            <RequireAuth>
              <Profile/>
            </RequireAuth>
          }/>
        </Routes>
      </main>
    </>
  );
}

export default App
