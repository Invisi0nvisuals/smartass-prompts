import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Smartass Prompts - AI Prompt Sharing Platform',
  description: 'Share, evaluate, and discover AI prompts with automated scoring and intelligent categorization.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-6">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Smartass Prompts
                  </h1>
                  <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                    v1.1
                  </span>
                </div>
                <nav className="hidden md:flex space-x-8">
                  <a href="#" className="text-gray-500 hover:text-gray-900">Browse</a>
                  <a href="#" className="text-gray-500 hover:text-gray-900">Upload</a>
                  <a href="#" className="text-gray-500 hover:text-gray-900">About</a>
                </nav>
              </div>
            </div>
          </header>
          
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {children}
          </main>
          
          <footer className="bg-white border-t mt-12">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <div className="text-center text-gray-500 text-sm">
                <p>&copy; 2025 Smartass Prompts. Built with ❤️ for the AI community.</p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}

