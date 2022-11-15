import logo from './logo.svg'
import './App.css'
import { useFilePicker } from 'use-file-picker'
import { useState } from 'react'

export default function App () {
  const [openFileSelector, { filesContent, loading }] = useFilePicker({
    accept: '.mid'
  })
  const [tab1, setTab1] = useState([])
  const [tab2, setTab2] = useState([])
  const [tab3, setTab3] = useState([])
  const [view1, setView1] = useState(false)
  const [view2, setView2] = useState(false)
  const [view3, setView3] = useState(false)
  const url = 'http://127.0.0.1:5000/tablator'
  // the react post request sender
  const uploadFile = async e => {
    const file = e.target.files[0]
    console.log(file)
    if (file != null) {
      const data = new FormData()
      data.append('file', file)

      let response = await fetch(url, {
        method: 'post',
        body: data
      })
      let res = await response.json()
      setTab1(res.data[0])
      setTab2(res.data[1])
      setTab3(res.data[2])
    }
  }
  const handleChange = (i) => {
    switch (i) {
      case 1:
        setView1(true)
        break
      case 2:
        setView2(true)
        break
      case 3:
        setView3(true)
        break
      default:
        break
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className='App'>
      <header className='App-header'>
        <form>
          <input type='file' onChange={uploadFile}></input>
        </form>
        {tab1.length > 0 && 
        <div>
        <button onClick={() => handleChange(1)}>View tab 1</button>
        <button onClick={() => handleChange(2)}>View tab 2</button>
        <button onClick={() => handleChange(3)}>View tab 3</button></div>
        }
      </header>
      <div>
        {view1 && (
          <div>
            <h2>Tab 1</h2>
            <p className='tab'>{tab1.map(x => x + '\n')}</p>
          </div>
        )}
        {view2 && (
          <div>
            <h2>Tab 2</h2>
            <p className='tab'>{tab2.map(x => x + '\n')}</p>
          </div>
        )}

        {view3 && (
          <div>
            <h2>Tab 3</h2>
            <p className='tab'>{tab3.map(x => x + '\n')}</p>
            <br />
          </div>
        )}
      </div>
    </div>
  )
}
