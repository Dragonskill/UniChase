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
import Moderator from '../pages/Moderator'

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
      { path: '/moderator',       element: <Moderator /> },
      { path: '/programs',        lazy: async () => ({ Component: (await import('../pages/StudentTools/ProgramsList')).default }) },
      { path: '/programs/:slug',   lazy: async () => ({ Component: (await import('../pages/StudentTools/ProgramDetail')).default }) },
      { path: '/roadmap',         lazy: async () => ({ Component: (await import('../pages/StudentTools/RoadmapBuilder')).default }) },
      { path: '/documents',       lazy: async () => ({ Component: (await import('../pages/StudentTools/DocumentChecklistPage')).default }) },
      { path: '/essay-helper',    lazy: async () => ({ Component: (await import('../pages/StudentTools/EssayHelper')).default }) },
      { path: '/visa-guide',      lazy: async () => ({ Component: (await import('../pages/StudentTools/VisaGuide')).default }) },
      { path: '/cost-calculator', lazy: async () => ({ Component: (await import('../pages/StudentTools/CostCalculator')).default }) },
      { path: '/eligibility',     lazy: async () => ({ Component: (await import('../pages/StudentTools/EligibilityChecker')).default }) },
      { path: '/faq',             lazy: async () => ({ Component: (await import('../pages/StudentTools/FaqCenter')).default }) },
      { path: '/reminders',       lazy: async () => ({ Component: (await import('../pages/StudentTools/ReminderSettings')).default }) },
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
