import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { useFilePicker } from 'use-file-picker'
import { useState } from 'react'
import { Button, Form, Modal } from 'react-bootstrap'
import MidiPlayer from 'react-midi-player'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import Tooltip from 'react-bootstrap/Tooltip'
import $ from 'jquery'
import Popover from 'react-bootstrap/Popover'

export default function App () {
  const [openFileSelector, { filesContent, loading }] = useFilePicker({
    accept: '.mid'
  })
  const truncateDecimals = function (number, digits) {
    var multiplier = Math.pow(10, digits),
      adjustedNum = number * multiplier,
      truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum)

    return truncatedNum / multiplier
  }
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)
  const [show, setShow] = useState(false)
  const [tab1, setTab1] = useState([])
  const [tab2, setTab2] = useState([])
  const [tab3, setTab3] = useState([])
  const [cost1, setCost1] = useState(0)
  const [cost2, setCost2] = useState(0)
  const [cost3, setCost3] = useState(0)
  const [view1, setView1] = useState(false)
  const [view2, setView2] = useState(false)
  const [view3, setView3] = useState(false)
  const [filename, setFilename] = useState('')
  const [midiFile, setFile] = useState(null)
  //const url = 'http://127.0.0.1/tablator'
  const url = 'https://tablator.herokuapp.com/tablator'
  // the react post request sender
  const fileToArrayBuffer = require('file-to-array-buffer')
  const downloadTxtFile = tab => {
    const element = document.createElement('a')
    const file = new Blob(
      tab.map(x => x + '\n'),
      {
        type: 'text/plain'
      }
    )
    element.href = URL.createObjectURL(file)
    element.download = filename + '.txt'
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
  }
  const uploadFile = async e => {
    const file = e.target.files[0]
    setFilename(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
    fileToArrayBuffer(file).then(data => {
      console.log(data)
      setFile(data)
      //=> ArrayBuffer {byteLength: ...}
    })

    if (file != null) {
      const data = new FormData()
      const width = $(window).width()
      data.append('file', file)
      data.append('width', width)
      console.log(width)
      let response = await fetch(url, {
        method: 'post',
        body: data
      })
      let res = await response.json()
      console.log(res.costs[2])
      if (res.data[0]) {
        setTab1(res.data[0])
        setCost1(truncateDecimals(res.costs[0], 2))
      }
      if (res.data[1]) {
        setTab2(res.data[1])
        setCost2(truncateDecimals(res.costs[1], 2))
      }
      if (res.data[2]) {
        setTab3(res.data[2])
        setCost3(truncateDecimals(res.costs[2], 2))
      }
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
      <header className='Upper-header'>
        <Button
          variant='secondary'
          onClick={handleShow}
          style={{ marginTop: '2vh', marginRight: '2vw' }}
        >
          About
        </Button>
      </header>
      <Modal show={show} onHide={handleClose} centered size='lg'>
        <Modal.Header closeButton>
          <Modal.Title>About this project</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          When playing a passage, for every note, a guitarist must choose which
          finger to use to fret the string and/or which string to play the note
          on. This choice greatly impacts the playability of the passage: an
          better fingering means an easier time playing. This program uses a
          dynamic programming algorithm to find the three best possible
          fingering sequences for a sequence of notes. To start, just upload a
          midi file!
          <br></br>
          <br></br>
          Currently, the program will only work on monophonic midi files. For
          any polyphonic parts (if two consecutive notes have the exact same
          note-on time), the program only uses one of the notes.
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <header className='App-header'>
        <h1>tablator</h1>
        <br></br>
        <Form.Group onChange={uploadFile} controlId='formFile' className='mb-3'>
          <Form.Label>
            <p style={{ fontSize: 'medium' }}>
              choose a .mid or .midi file to generate its best possible tabs!
            </p>
          </Form.Label>
          <Form.Control type='file' />
        </Form.Group>
        <div style={{ marginBottom: '2vh' }}>
          {tab1.length > 0 && (
            <>
              <Button onClick={() => handleChange(1)} variant='primary'>
                View tab 1
              </Button>{' '}
            </>
          )}
          {tab2.length > 0 && (
            <>
              <Button onClick={() => handleChange(2)} variant='primary'>
                View tab 2
              </Button>{' '}
            </>
          )}
          {tab3.length > 0 && (
            <>
              <Button onClick={() => handleChange(3)} variant='primary'>
                View tab 3
              </Button>{' '}
            </>
          )}
          <br></br>
        </div>
      </header>
      <br></br>
      {midiFile && (
        <div style={{ marginBottom: '3vh' }}>
          <MidiPlayer data={midiFile}></MidiPlayer>
        </div>
      )}
      {view1 && (
        <>
          <h2>Tab 1</h2>
          <br></br>
          <OverlayTrigger
            placement={'left'}
            overlay={
              <Popover>
                <Popover.Header as='h3'>{'What is Cost?'}</Popover.Header>
                <Popover.Body>
                  This number represents the total cost of the fingering
                  sequence for the current tab. The higher the cost, the harder
                  the tab is to play.
                </Popover.Body>
              </Popover>
            }
          >
            <Button variant='secondary' style={{ marginBottom: '2vh' }}>
              cost: {cost1}
            </Button>
          </OverlayTrigger>
          <div>
            <Button
              variant='primary'
              onClick={() => downloadTxtFile(tab1)}
              style={{ marginBottom: '5vh' }}
            >
              download tab
            </Button>
          </div>
          <div id='container'>
            <p className='tab'>{tab1.map(x => x + '\n')}</p>
          </div>
        </>
      )}
      {view2 && (
        <>
          <h2>Tab 2</h2>
          <br></br>
          <OverlayTrigger
            placement={'left'}
            overlay={
              <Popover>
                <Popover.Header as='h3'>{'What is Cost?'}</Popover.Header>
                <Popover.Body>
                  This number represents the total cost of the fingering
                  sequence for the current tab. The higher the cost, the harder
                  the tab is to play.
                </Popover.Body>
              </Popover>
            }
          >
            <Button variant='secondary' style={{ marginBottom: '2vh' }}>
              cost: {cost2}
            </Button>
          </OverlayTrigger>
          <div>
            <Button
              variant='primary'
              onClick={() => downloadTxtFile(tab2)}
              style={{ marginBottom: '5vh' }}
            >
              download tab
            </Button>
          </div>
          <div id='container'>
            <p className='tab'>{tab2.map(x => x + '\n')}</p>
          </div>
        </>
      )}

      {view3 && (
        <>
          <h2>Tab 3</h2>
          <br></br>
          <OverlayTrigger
            placement={'left'}
            overlay={
              <Popover>
                <Popover.Header as='h3'>{'What is Cost?'}</Popover.Header>
                <Popover.Body>
                  This number represents the total cost of the fingering
                  sequence for the current tab. The higher the cost, the harder
                  the tab is to play.
                </Popover.Body>
              </Popover>
            }
          >
            <Button variant='secondary' style={{ marginBottom: '2vh' }}>
              cost: {cost3}
            </Button>
          </OverlayTrigger>
          <div>
            <Button
              variant='primary'
              onClick={() => downloadTxtFile(tab3)}
              style={{ marginBottom: '5vh' }}
            >
              download tab
            </Button>
          </div>
          <div id='container'>
            <p className='tab'>{tab3.map(x => x + '\n')}</p>
          </div>
        </>
      )}
    </div>
  )
}
