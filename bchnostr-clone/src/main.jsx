import React from 'react'
import ReactDOM from 'react-dom/client'
// import App from './App.jsx'
import AppTest from './App-test.jsx'  // Use test version
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppTest />
  </React.StrictMode>,
)