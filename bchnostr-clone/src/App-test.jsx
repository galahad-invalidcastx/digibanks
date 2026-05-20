import React from 'react'

function AppTest() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-2xl mx-auto p-8">
        <div className="bg-x-blue text-white p-4 rounded-xl mb-4">
          <h1 className="text-2xl font-bold">Tailwind is Working!</h1>
          <p>If you see blue background and white text, CSS is applied.</p>
        </div>
        
        <div className="bg-x-gray p-4 rounded-xl">
          <p className="text-white">This should be dark gray with white text.</p>
          <button className="mt-4 bg-x-green px-4 py-2 rounded-full text-white font-bold hover:bg-green-600">
            Test Button
          </button>
        </div>

        <div className="mt-8 space-y-2">
          <div className="border border-x-gray p-4 rounded-lg">
            <div className="font-bold text-white">Post Card</div>
            <p className="text-x-light-gray">This should have light gray text</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppTest