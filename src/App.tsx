import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
          CollabCanvas Setup
        </h1>
        <div className="space-y-4">
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p className="font-semibold">✓ Tailwind CSS is working!</p>
          </div>
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
          >
            Count is {count}
          </button>
          <p className="text-sm text-gray-600 text-center">
            Tasks 1.1, 1.2, and 1.3 completed! 🎉
          </p>
        </div>
      </div>
    </div>
  )
}

export default App
