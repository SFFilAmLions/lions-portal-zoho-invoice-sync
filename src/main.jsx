import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MantineProvider } from '@mantine/core'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import App from './App.jsx'
import { ZohoAuthProvider } from './hooks/useZohoAuth.js'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider>
      <HashRouter>
        <QueryClientProvider client={queryClient}>
          <ZohoAuthProvider>
            <App />
          </ZohoAuthProvider>
        </QueryClientProvider>
      </HashRouter>
    </MantineProvider>
  </React.StrictMode>
)
