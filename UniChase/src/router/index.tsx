import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import Home from '../pages/Home'
import UniversityList from '../pages/University/UniversityList'
import UniversityDetail from '../pages/University/UniversityDetail'
import ReviewList from '../pages/Reviews/ReviewList'
import ReviewDetail from '../pages/Reviews/ReviewDetail'
import NewsList from '../pages/News/NewsList'
import NewsDetail from '../pages/News/NewsDetail'
import Careers from '../pages/Careers/Careers'
import CareerDetail from '../pages/Careers/CareerDetail'
import Forum from '../pages/Community/Forum'
import PostDetail from '../pages/Community/PostDetail'
import Login from '../pages/auth/Login'
import SignUp from '../pages/auth/SignUp'
import Compare from '../pages/Compare'
import Match from '../pages/Match'
import Dashboard from '../pages/Dashboard'
import Contact from '../pages/Contact'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/',                element: <Home /> },
      { path: '/university',      element: <UniversityList /> },
      { path: '/university/:id',  element: <UniversityDetail /> },
      { path: '/universities/:idOrSlug', element: <UniversityDetail /> },
      { path: '/compare',         element: <Compare /> },
      { path: '/match',           element: <Match /> },
      { path: '/dashboard',       element: <Dashboard /> },
      { path: '/contact',         element: <Contact /> },
      { path: '/reviews',         element: <ReviewList /> },
      { path: '/reviews/:id',     element: <ReviewDetail /> },
      { path: '/news',            element: <NewsList /> },
      { path: '/news/:id',        element: <NewsDetail /> },
      { path: '/careers',         element: <Careers /> },
      { path: '/careers/:id', element: <CareerDetail /> },
      { path: '/community',       element: <Forum /> },
      { path: '/community/:id',   element: <PostDetail /> },
      { path: '/login',           element: <Login /> },
      { path: '/signup',          element: <SignUp /> },
    ]
  }
])

export default router
