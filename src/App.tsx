import { useEffect, useState } from 'react'
import './App.css'
import EmployeeWeeklyReportPage from './features/reports/employee/EmployeeWeeklyReportPage'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="app">
      <div className={`app-topbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="topbar-content">
          <img src="/logo.png" alt="A&A Logo" className="app-logo" />
          <h1 className="app-title">Security Daily Production Report</h1>
          <div className="topbar-subtitle">A&A Internal Application</div>
        </div>
      </div>
      <div className="app-main">
        <EmployeeWeeklyReportPage />
      </div>
    </div>
  )
}

export default App
