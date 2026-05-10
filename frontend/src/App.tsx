import { useEffect, useState } from 'react'

function App() {
  const [input1, setInput1] = useState('39.015025')
  const [input2, setInput2] = useState('-77.014889')
  const [input3, setInput3] = useState('100')
  const [logMessage, setLogMessage] = useState('Execute the process to see results')
  const [imageSrc, setImageSrc] = useState('')


  const [socket, setSocket] = useState<WebSocket | null>(null)


  useEffect(() => {

    const ws = new WebSocket('ws://127.0.0.1:8000/ws')

    ws.onopen = () => {
      console.log('WebSocket connected')
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'image') {
        setImageSrc(`data:image/png;base64,${data.data}`)
      }

      if (data.type === 'message') {
        setLogMessage(data.data)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    ws.onclose = () => {
      console.log('WebSocket disconnected')
    }

    setSocket(ws)

    return () => {
      ws.close()
    }

  }, [])


  const handleExecute = async () => {
    console.log('Executing...')

    if (!socket || socket.readyState !== WebSocket.OPEN) return

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
          justifyContent: 'center',
          overflow: 'auto'
        }}
      >
        <img
          src={imageSrc}
          style={{ maxWidth: '75%', maxHeight: '75%'}}
        />

        <pre style={{ color: 'white' , padding: '0'}}>
          {logMessage}
        </pre>

      
      </div>
    </div>
    </div>
  )
}

export default App