import logo from './logo.svg'
import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { useFilePicker } from 'use-file-picker'
import { useState } from 'react'
import { Button, Form } from 'react-bootstrap'
import MidiPlayer from 'react-midi-player';

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
  //const url = 'http://127.0.0.1/tablator'
  const url = 'http://tablator.herokuapp.com/tablator'
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
  const handleChange = i => {
    switch (i) {
      case 1:
        setView1(true)
        setView2(false)
        setView3(false)
        break
      case 2:
        setView1(false)
        setView2(true)
        setView3(false)
        break
      case 3:
        setView1(false)
        setView2(false)
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
        <br></br>
        <h1>tablator</h1>
        <br></br>
      <Form.Group  onChange={uploadFile} controlId="formFile" className="mb-3">
        <Form.Label>
        <p style={{fontSize:"medium"}}>choose a .mid or .midi file</p></Form.Label>
        <Form.Control type="file" />
      </Form.Group>
        {tab1.length > 0 && (
          <div style={{marginBottom: "5vh"}}>
            <Button onClick={() => handleChange(1)} variant='primary'>
              View tab 1
            </Button>{' '}
            <Button onClick={() => handleChange(2)} variant='primary'>
              View tab 2
            </Button>{' '}
            <Button onClick={() => handleChange(3)} variant='primary'>
              View tab 3
            </Button>{' '}
          </div>
        )}
      </header>
      <div>
        <br></br>
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
