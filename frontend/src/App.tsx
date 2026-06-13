import { useEffect, useState, useRef } from 'react'

function App() {
  const [input1, setInput1] = useState('-12.680635')
  const [input2, setInput2] = useState('-69.365719')
  const [input3, setInput3] = useState('40')
  const socketRef = useRef<WebSocket | null>(null)
  const [logMessage, setLogMessage] = useState('Execute the process to see results')
  const [events, setEvents] = useState<any[]>([])



  useEffect(() => {
    // Websocket setup
    if (socketRef.current) return

    const ws = new WebSocket('ws://127.0.0.1:8000/ws')
    socketRef.current = ws

    ws.onopen = () => console.log('WebSocket connected')

    // Websocket message handling
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type == 'status') setLogMessage(msg.data);
      else setEvents(prev => [...prev, msg]);
    }

    ws.onerror = (error) => console.error('WebSocket error:', error)
    ws.onclose = () => console.log('WebSocket disconnected')

    return () => {
      ws.close()
      socketRef.current = null
    }
  }, [])




  const handleExecute = async () => {
    const socket = socketRef.current
    console.log('Executing...')

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      setLogMessage('Error setting up the websocket')
      return
    }

    socket.send(
      JSON.stringify({
        "lat": input1,
        "lon": input2,
        "sqkm": input3
      })
    )
  }

  return (
    <div
    style={{
      padding: '10px',
      minHeight: '70vh',
      display: 'flex'
    }}
    >
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.67)',
        width: '25vw',
        height: '100vh'
      }}
      >
        <div style={{
          padding:'10px',
          marginTop: '20px'
          }}
        >
          <h1>Planetary Image Grab</h1>
        

          <div>
            <input
              type="text"
              placeholder="Latitude"
              value={input1}
              onChange={(e) => setInput1(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '10px'}}>
            <input
              type="text"
              placeholder="Longitude"
              value={input2}
              onChange={(e) => setInput2(e.target.value)}
            />
          </div>

          <div style={{ marginTop: '10px'}}>
            <input
              type="text"
              placeholder="Square Kilometers"
              value={input3}
              onChange={(e) => setInput3(e.target.value)}
            />
          </div>

          <button
            style={{ marginTop: '20px' }}
            onClick={handleExecute}
          >
            Execute
          </button>
        </div>
      </div>
    
    
    {/* RIGHT PANEL */}
    <div
      style={{
        flex: 1,
        padding: '10px',
      }}
    >
      <h2>Visualization</h2>



      <div
        style={{
          width: '100%',
          height: '95vh',
          backgroundColor: '#111',
          border: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {/* Status Window at the top */}
        <div style = {{
          border: '1px solid #333',
          backgroundColor: '#333',
          width: '100%'
        }}
        >
          <pre style={{ color: 'white', padding: '0', fontSize: '0.7rem',}}> {logMessage} </pre>
        </div>

        {/* Dynamic window with logger updates */}
        <div
          style = {{
          justifyContent: 'flex-start',
          overflowY: 'auto',
          overflowX: 'hidden'
          }}>
          {events.map((item, idx) => (
            <div
              key={idx}
              style={{
                marginBottom: '3px',
                padding: '0'
              }}
            >
              {item.type === "text" && (
                <pre style ={{
                  color: 'white' ,
                  padding: '0',
                  fontSize: '0.7rem',
                  whiteSpace: 'pre-wrap',
                  overflowWrap: 'break-word'
                }}>{item.data}</pre>
              )}

              {item.type === "image" && (
                <img
                  src={`data:image/png;base64,${item.data}`}
                  style={{ maxWidth: '100%' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}

export default App