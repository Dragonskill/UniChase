import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import { Link } from 'react-router-dom'
import Home from '../pages/Home'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/onboarding', lazy: async () => ({ Component: (await import('../pages/Onboarding')).default }) },
      { path: '/universities', lazy: async () => ({ Component: (await import('../pages/University/UniversityList')).default }) },
      { path: '*', element: <div className="max-w-3xl mx-auto p-8"><h1 className="text-2xl font-bold text-navy">Page not found</h1><Link className="text-teal" to="/">Return to UniChase</Link></div> },
      { path: '/',                element: <Home /> },
      { path: '/university',      lazy: async () => ({ Component: (await import('../pages/University/UniversityList')).default }) },
      { path: '/university/:id',  lazy: async () => ({ Component: (await import('../pages/University/UniversityDetail')).default }) },
      { path: '/universities/:idOrSlug', lazy: async () => ({ Component: (await import('../pages/University/UniversityDetail')).default }) },
      { path: '/compare',         lazy: async () => ({ Component: (await import('../pages/Compare')).default }) },
      { path: '/match',           lazy: async () => ({ Component: (await import('../pages/Match')).default }) },
      { path: '/dashboard',       lazy: async () => ({ Component: (await import('../pages/Dashboard')).default }) },
      { path: '/notifications',    lazy: async () => ({ Component: (await import('../pages/Notifications')).default }) },
      { path: '/calendar',         lazy: async () => ({ Component: (await import('../pages/Calendar')).default }) },
      { path: '/contact',         lazy: async () => ({ Component: (await import('../pages/Contact')).default }) },
      { path: '/moderator',       lazy: async () => ({ Component: (await import('../pages/Moderator')).default }) },
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
      { path: '/reviews',         lazy: async () => ({ Component: (await import('../pages/Reviews/ReviewList')).default }) },
      { path: '/reviews/:id',     lazy: async () => ({ Component: (await import('../pages/Reviews/ReviewDetail')).default }) },
      { path: '/news',            lazy: async () => ({ Component: (await import('../pages/News/NewsList')).default }) },
      { path: '/news/:id',        lazy: async () => ({ Component: (await import('../pages/News/NewsDetail')).default }) },
      { path: '/careers',         lazy: async () => ({ Component: (await import('../pages/Careers/Careers')).default }) },
      { path: '/careers/:id', lazy: async () => ({ Component: (await import('../pages/Careers/CareerDetail')).default }) },
      { path: '/community',       lazy: async () => ({ Component: (await import('../pages/Community/Forum')).default }) },
      { path: '/community/:id',   lazy: async () => ({ Component: (await import('../pages/Community/PostDetail')).default }) },
      { path: '/login',           lazy: async () => ({ Component: (await import('../pages/auth/Login')).default }) },
      { path: '/signup',          lazy: async () => ({ Component: (await import('../pages/auth/SignUp')).default }) },
    ]
  }
])

export default router
