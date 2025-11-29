import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)
  const [message, setMessage] = useState("") // 追加：APIからのメッセージ

  // 🔥 バックエンドAPIを呼ぶ関数
  const callBackend = async () => {
    const res = await fetch("http://localhost:5174/api/hello")
    const text = await res.text()
    setMessage(text)
  }

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>

      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>

      {/* 🔥 バックエンド呼び出しボタン追加 */}
      <div className="card">
        <button onClick={callBackend}>Call Backend API</button>
        <p>Response: {message}</p>
      </div>

      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
