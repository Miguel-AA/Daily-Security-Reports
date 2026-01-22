import { useEffect, useState } from 'react'
import './App.css'
import EmployeeWeeklyReportPage from './features/reports/employee/EmployeeWeeklyReportPage'

function App() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      // Shrink header after scrolling 50px
      setIsScrolled(currentScrollY > 50)
      
      // Hide header when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false)
      } else {
        // Scrolling up
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <div className="app">
      <div className={`app-topbar ${isScrolled ? 'scrolled' : ''} ${!isVisible ? 'hidden' : ''}`}>
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
