import './App.css'
import Header from './components/layout/Header'
import Sidebar from './components/layout/Sidebar'
import Footer from './components/layout/Footer'
import DashboardPage from './pages/Dashboard/DashboardPage'

function App() {
  return (
    <div className="app">
      <Header />
      <div className="app-body">
        <Sidebar />
        <main className="app-main">
          <DashboardPage />
        </main>
      </div>
      <Footer />
    </div>
  )
}

export default App
