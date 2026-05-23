import React, { useRef, useEffect } from 'react'

export default function LogPanel({ logs, setLogs, addLog }) {
  const panelRef = useRef(null)

  useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight
    }
  }, [logs])

  const handleClear = () => {
    setLogs([])
    addLog("Logs cleared")
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex justify-between items-center">
        <h3 className="font-mono text-sm">📜 Event Log</h3>
        <button onClick={handleClear} className="text-xs bg-black/30 hover:bg-black/50 px-2 py-1 rounded">
          Clear
        </button>
      </div>
      <div ref={panelRef} className="mt-3 bg-black/40 rounded-lg p-3 h-[560px] overflow-y-auto">
        {logs.length === 0 && (
          <div className="text-gray-500 text-xs text-center">No events yet...</div>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className={`log-line ${log.isError ? "text-red-400" : "text-green-200"}`}>
            [{log.timestamp}] {log.msg}
          </div>
        ))}
      </div>
    </div>
  )
}