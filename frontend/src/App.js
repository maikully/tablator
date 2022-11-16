import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { useFilePicker } from 'use-file-picker'
import { useState } from 'react'
import { Button, ToggleButton, Form, Modal } from 'react-bootstrap'
import Alert from 'react-bootstrap/Alert'
import MidiPlayer from 'react-midi-player'
import $ from 'jquery'
import TabDisplay from './TabDisplay'
import Spinner from 'react-bootstrap/Spinner'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import { BsDownload } from 'react-icons/bs'

export default function App () {
  //const url = 'http://127.0.0.1/tablator'
  const url = 'https://tablator.herokuapp.com/tablator'
  const truncateDecimals = function (number, digits) {
    var multiplier = Math.pow(10, digits),
      adjustedNum = number * multiplier,
      truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum)

    return truncatedNum / multiplier
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
  const handleClose = () => setShow(false)
  const handleShow = () => setShow(true)
  const handleSettingsShow = x => setSettingsShow(x)
  const setRadio = x => {
    setRadioValue(x)
    if (x === 2) setCustom(true)
    else setCustom(false)
  }
  const map1 = new Map()
  map1.set(0, 'guitar')
  map1.set(1, 'bass')
  map1.set(2, 'custom')
  const [show, setShow] = useState(false)
  const [settingsShow, setSettingsShow] = useState(false)
  const [custom, setCustom] = useState(false)
  const [radioValue, setRadioValue] = useState(0)
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
  const [load, setLoading] = useState(false)
  const [alert, setAlert] = useState(false)
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
    const extension = e.target.files[0].name
      .split('.')
      .pop()
      .toLowerCase()
      .trim()
    if (extension !== 'mid' && extension !== 'midi') {
      setAlert(true)
    } else {
      setAlert(false)
      fileToArrayBuffer(file).then(data => {
        setFile(data)
        //=> ArrayBuffer {byteLength: ...}
      })
      if (file != null) {
        var instrument = ''
        switch (radioValue) {
          case 0:
            instrument = 'guitar'
            break
          case 1:
            instrument = 'bass'
            break
          case 2:
            instrument = 'custom'
            break
          default:
            instrument = ''
            break
        }
        const data = new FormData()
        const width = $(window).width()
        data.append('file', file)
        data.append('width', width)
        data.append('instrument', instrument)
        setLoading(true)
        let response = await fetch(url, {
          method: 'post',
          body: data
        })
        let res = await response.json()
        setLoading(false)
        console.log(res.data)
        if (res.data[0]) {
          setTab1(res.data[0])
          setCost1(truncateDecimals(res.costs[0], 2))
        } else {
          setTab1([])
        }
        if (res.data[1]) {
          setTab2(res.data[1])
          setCost2(truncateDecimals(res.costs[1], 2))
        } else {
          setTab2([])
        }
        if (res.data[2]) {
          setTab3(res.data[2])
          setCost3(truncateDecimals(res.costs[2], 2))
        } else {
          setTab3([])
        }
      }
    }
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
          finger to use to fret the string and, unless the note only can be
          played on one string, which string to play the note on. This choice
          greatly impacts the playability of the passage: a better fingering
          means an easier time playing. This program uses a dynamic programming
          algorithm to find the three best possible fingering sequences for a
          sequence of notes. To start, choose an instrument in the settings and
          upload a midi file!
          <br></br>
          <br></br>
          Currently, the program will only work on monophonic midi files. For
          any polyphonic parts (if two consecutive notes have the exact same
          note-on time), the program only uses one of the notes. Any notes
          outside the range of the chosen instrument will be octave-shifted in.
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <header className='App-header'>
        <h1>tablator</h1>
        <Form>
          <Form.Group
            onChange={uploadFile}
            controlId='formFile'
            className='mb-3'
          >
            <Form.Label>
              <p style={{ fontSize: 'medium' }}>
                choose an instrument and upload a midi file to generate its best
                possible tabs!
              </p>
            </Form.Label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                height: 'auto',
                width: '30vw'
              }}
            >
              <Form.Control type='file' style={{ width: '20vw' }} />{' '}
              <Button
                variant='secondary'
                onClick={() => handleSettingsShow(true)}
              >
                Settings
              </Button>
            </div>
            <p style={{ marginTop: '1vh', fontSize: 'large' }}>
              current instrument: {map1.get(radioValue)}
            </p>
          </Form.Group>
        </Form>
        {!midiFile && (
          <a target='_blank' href='sample_monophonic_pentatonic.mid' download>
            <Button variant='primary'>
              <BsDownload></BsDownload> sample midi
            </Button>
          </a>
        )}
        <Modal show={settingsShow} onHide={() => handleSettingsShow(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Settings</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ButtonGroup className='mb-2'>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='radio'
                key={0}
                id={0}
                value={0}
                checked={radioValue === 0}
                onChange={() => setRadio(0)}
              >
                Guitar
              </ToggleButton>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='radio'
                key={1}
                id={1}
                value={1}
                checked={radioValue === 1}
                onChange={() => setRadio(1)}
              >
                Bass
              </ToggleButton>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='radio'
                disabled
                key={2}
                id={2}
                value={2}
                checked={radioValue === 2}
                onChange={() => setRadio(2)}
              >
                Custom
              </ToggleButton>
            </ButtonGroup>
            {custom && (
              <>
                <Form.Label>
                  <p style={{ fontSize: 'medium' }}>
                    enter the six strings (including octave) from low to high
                    <br></br>
                    (e.g. E2 A2 D3 G3 B3 E4)
                  </p>
                </Form.Label>
                <div style={{ display: 'flex' }}>
                  <Form.Control
                    type='text'
                    placeholder='1'
                    maxLength='2'
                    style={{ width: '3em' }}
                  />

                  <Form.Control
                    type='text'
                    placeholder='2'
                    maxLength='2'
                    style={{ width: '3em' }}
                  />

                  <Form.Control
                    type='text'
                    placeholder='3'
                    maxLength='2'
                    style={{ width: '3em' }}
                  />

                  <Form.Control
                    type='text'
                    placeholder='4'
                    maxLength='2'
                    style={{ width: '3em' }}
                  />

                  <Form.Control
                    type='text'
                    placeholder='5'
                    maxLength='2'
                    style={{ width: '3em' }}
                  />

                  <Form.Control
                    type='text'
                    placeholder='6'
                    maxLength='2'
                    style={{ width: '3em' }}
                  />
                </div>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant='secondary'
              onClick={() => handleSettingsShow(false)}
            >
              Close
            </Button>
          </Modal.Footer>
        </Modal>
        {alert && (
          <Alert
            style={{
              display: 'inline-block',
              padding: '5px',
              fontSize: 'small'
            }}
            key={'warning'}
            variant={'warning'}
          >
            File extension not .mid or .midi!
          </Alert>
        )}
        {load && <Spinner animation='border' variant='primary' />}
        <div>
          {tab1.length > 0 && !load && (
            <>
              <Button onClick={() => handleChange(1)} variant='primary'>
                View tab 1
              </Button>{' '}
            </>
          )}
          {tab2.length > 0 && !load && (
            <>
              <Button onClick={() => handleChange(2)} variant='primary'>
                View tab 2
              </Button>{' '}
            </>
          )}
          {tab3.length > 0 && !load && (
            <>
              <Button onClick={() => handleChange(3)} variant='primary'>
                View tab 3
              </Button>{' '}
            </>
          )}
        </div>
        <br></br>
      </header>
      <br></br>
      {midiFile && (
        <div style={{ marginBottom: '3vh' }}>
          <MidiPlayer data={midiFile}></MidiPlayer>
        </div>
      )}
      {view1 && (
        <TabDisplay cost={cost1} tab={tab1} filename={filename} num={1} />
      )}
      {view2 && (
        <TabDisplay cost={cost2} tab={tab2} filename={filename} num={2} />
      )}
      {view3 && (
        <TabDisplay cost={cost3} tab={tab3} filename={filename} num={3} />
      )}
    </div>
  )
}
