import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppLayout } from './routes/AppLayout'
import { Home } from './routes/Home'
import { About } from './routes/About'
import { NotFound } from './routes/NotFound'
import { Login } from './routes/auth/Login'
import { Signup } from './routes/auth/Signup'
import { Playground } from './routes/playground/Playground'
import { Challenges } from './routes/challenges/Challenges'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'about', element: <About /> },
      { path: 'playground', element: <Playground /> },
      { path: 'challenges', element: <Challenges /> },
      { path: 'login', element: <Login /> },
      { path: 'signup', element: <Signup /> },
      { path: '*', element: <NotFound /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


