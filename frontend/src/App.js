import 'bootstrap/dist/css/bootstrap.min.css'
import './App.css'
import { useFilePicker } from 'use-file-picker'
import { useState, useEffect } from 'react'
import { Button, ToggleButton, Form, Modal, Fade } from 'react-bootstrap'
import Alert from 'react-bootstrap/Alert'
import MidiPlayer from 'react-midi-player'
import $ from 'jquery'
import TabDisplay from './TabDisplay'
import Spinner from 'react-bootstrap/Spinner'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import { BsDownload } from 'react-icons/bs'
import { Piano, KeyboardShortcuts, MidiNumbers } from 'react-piano'
import { Interval, Note, Scale, Midi } from '@tonaljs/tonal'
import 'react-piano/dist/styles.css'
import FadeIn from 'react-fade-in'

export default function App () {
  //const url = 'http://127.0.0.1/tablator'
  const url = 'https://tablator.herokuapp.com/tablator'
  const truncateDecimals = function (number, digits) {
    var multiplier = Math.pow(10, digits),
      adjustedNum = number * multiplier,
      truncatedNum = Math[adjustedNum < 0 ? 'ceil' : 'floor'](adjustedNum)

    return truncatedNum / multiplier
  }
  const [firstNote, setFirstNote] = useState(40)
  const [lastNote, setLastNote] = useState(88)
  const MidiWriter = require('midi-writer-js')
  const keyboardShortcuts = KeyboardShortcuts.create({
    firstNote: firstNote,
    lastNote: lastNote,
    keyboardConfig: KeyboardShortcuts.HOME_ROW
  })
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
    switch (x) {
      case 0:
        setFirstNote(MidiNumbers.fromNote('e2'))
        setLastNote(MidiNumbers.fromNote('e6'))
        break
      case 1:
        setFirstNote(MidiNumbers.fromNote('e1'))
        setLastNote(MidiNumbers.fromNote('g4'))
        break
      default:
        break
    }
    setRadioValue(x)
    if (x === 2) setCustom(true)
    else setCustom(false)
  }
  const goBack = () => {
    setMenu(0)
    setTab1([])
    setTab2([])
    setTab3([])
    setView1(false)
    setView2(false)
    setView3(false)
    setFile(null)
    setOpen(0)
    setRadio(0)
    setAlert(false)
    setInput('')
  }
  const map1 = new Map()
  map1.set(0, 'guitar')
  map1.set(1, 'bass')
  map1.set(2, 'custom')
  const mapAccidental = new Map()
  mapAccidental.set(0, 'sharps')
  mapAccidental.set(1, 'flats')
  const [alertmessage, setAlertmessage] = useState("")
  const [accidentals, setAccidentals] = useState(0)
  const [menu, setMenu] = useState(0)
  const [show, setShow] = useState(false)
  const [settingsShow, setSettingsShow] = useState(false)
  const [custom, setCustom] = useState(false)
  const [open, setOpen] = useState(0)
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
  const [midiTarget, setMidiTarget] = useState(null)
  const [midiFile, setFile] = useState(null)
  const [load, setLoading] = useState(false)
  const [alert, setAlert] = useState(false)
  const [input, setInput] = useState('')
  const [higher, setHigher] = useState(0)
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
  const setMidi = e => {
    const file = e.target.files[0]
    const extension = e.target.files[0].name
      .split('.')
      .pop()
      .toLowerCase()
      .trim()
    if (extension !== 'mid' && extension !== 'midi') {
      setAlertmessage("file type not mid or midi!")
      setAlert(true)
    } else {
      setAlert(false)
      setMidiTarget(file)
      fileToArrayBuffer(file).then(data => {
        setFile(data)
      })
      console.log(midiFile)
    }
  }
  const uploadFile = async e => {
    const file = midiTarget
    const extension = file.name
      .split('.')
      .pop()
      .toLowerCase()
      .trim()
    if (extension !== 'mid' && extension !== 'midi') {
      setAlertmessage("file type not mid or midi!")
      setAlert(true)
    } else {
      setAlert(false)
      fileToArrayBuffer(file).then(data => {
        setFile(data)
        //=> ArrayBuffer {byteLength: ...}
      })
      if (file !== null) {
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
        data.append('opensetting', open)
        data.append('higher', higher)
        setLoading(true)
        let response = await fetch(url, {
          method: 'post',
          body: data
        })
        let res = await response.json()
        setLoading(false)
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
  function dataURItoBlob (dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that does this
    var byteString = atob(dataURI.split(',')[1])

    // separate out the mime component
    var mimeString = dataURI
      .split(',')[0]
      .split(':')[1]
      .split(';')[0]

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length)

    // create a view into the buffer
    var ia = new Uint8Array(ab)

    // set the bytes of the buffer to the correct values
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], { type: mimeString })
    return blob
  }
  const uploadNotesData = async e => {
    var data = input.trim().split(' ')
    if (data.length === 1) {
      setAlertmessage("input must contain at least 2 notes!")
      setAlert(true)
      return
    } else{
      setAlert(false)
    }
    const track = new MidiWriter.Track()
    track.addEvent(new MidiWriter.ProgramChangeEvent({ instrument: 1 }))

    // Add notes
    data.map(note => {
      const n = new MidiWriter.NoteEvent({
        pitch: note,
        duration: '8'
      })
      track.addEvent(n)
    })

    // Generate a data URI
    const write = new MidiWriter.Writer(track)
    setFile(write.dataUri().replace(/^data:audio\/midi;base64,/, ''))
    fileToArrayBuffer(dataURItoBlob(write.dataUri())).then(data => {
      setFile(data)
      //=> ArrayBuffer {byteLength: ...}
    })
    var file = dataURItoBlob(write.dataUri())
    if (file !== null) {
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
      data.append('opensetting', open)
      data.append('higher', higher)
      setLoading(true)
      let response = await fetch(url, {
        method: 'post',
        body: data
      })
      let res = await response.json()
      setLoading(false)
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
  return (
    <div className='App'>
      <header className='Upper-header'>
        <Button
          variant='secondary'
          onClick={handleShow}
          size="sm"
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
          sequence of notes. 
          To start, type in the notes with the virtual keyboard or upload a midi file!
          <br></br>
          <br></br>
          Currently, the program will only work on monophonic parts. For
          any polyphonic parts (if two consecutive notes have the exact same
          note-on time), the program only uses one of the notes. Any notes
          outside the range of the chosen instrument will be octave-shifted in.
          <br></br>
          <br></br>
          If fewer than three tabs are visible, it's because the algorithm
          didn't find three tabs dissimilar enough. The algorithm won't choose a
          very bad path in lieu of a dissimlar good path because of the
          "filtering" done while calculating the best paths during the dynamic
          programming step.
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <header className='App-header'>
        <h1 className="title" onClick={goBack}>tablator</h1>
        {menu === 0 && (
          <FadeIn>
            <br></br>
            <Button
              variant='primary'
              onClick={() => setMenu(2)}
              style={{ width: '300px' }}
            >
              Create tab from note sequence
            </Button>
            <br></br> 
            <Button
              variant='primary'
              onClick={() => setMenu(1)}
              style={{ width: '300px' }}
            >
              Create tab from midi file
            </Button>
          </FadeIn>
        )}
        {menu === 1 && (
          <FadeIn>
            <Form>
              <Form.Group controlId='formFile' className='mb-3'>
                <Form.Label>
                  <p style={{ fontSize: 'medium' }}>
                    choose an instrument and upload a midi file to generate its
                    best possible tabs!
                  </p>
                </Form.Label>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 'auto'
                  }}
                >
                  <Form.Control
                    type='file'
                    onChange={e => setMidi(e)}
                    style={{ marginRight: '.5vw' }}
                  />
                  <Button variant='success' onClick={uploadFile}>
                    Submit
                  </Button>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: 'auto'
                  }}
                >
                  <Button
                    variant='secondary'
                    onClick={() => handleSettingsShow(true)}
                  >
                    Settings
                  </Button>
                  <a
                    target='_blank'
                    href='sample_monophonic_pentatonic.mid'
                    download
                  >
                    <Button variant='primary'>
                      <BsDownload></BsDownload> sample midi
                    </Button>
                  </a>
                </div>
                <p
                  style={{
                    marginTop: '1vh',
                    fontSize: 'large',
                    fontFamily: 'monospace',
                    textAlign: 'left'
                  }}
                >
                  instrument setting: {map1.get(radioValue)}
                </p>
              </Form.Group>
            </Form>
          </FadeIn>
        )}
        {menu === 2 && (
          <>
            <Form style={{ width: '30vw' }}>
              <FadeIn>
                <Form.Group
                  onChange={uploadFile}
                  controlId='formFile'
                  className='mb-3'
                >
                  <Form.Label>
                    <p style={{ fontSize: 'medium' }}>
                      type in a series of notes to generate its best possible
                      tabs!
                    </p>
                  </Form.Label>
                  <div>
                    <Form.Control
                      as='textarea'
                      rows={3}
                      value={input}
                      onChange={e => setInput(e.target.value)}
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}
                    >
                      <Button
                        variant='secondary'
                        onClick={() => handleSettingsShow(true)}
                      >
                        Settings
                      </Button>
                      <Button
                        variant='success'
                        onClick={() => uploadNotesData()}
                      >
                        Submit
                      </Button>
                    </div>
                  </div>
                  {menu === 2 && (
                    <p
                      style={{
                        marginTop: '1vh',
                        fontSize: 'large',
                        fontFamily: 'monospace',
                        textAlign: 'left'
                      }}
                    >
                      input setting: {mapAccidental.get(accidentals)}
                    </p>
                  )}
                  <p
                    style={{
                      marginTop: '1vh',
                      fontSize: 'large',
                      fontFamily: 'monospace',
                      textAlign: 'left'
                    }}
                  >
                    instrument setting: {map1.get(radioValue)}
                  </p>
                </Form.Group>
              </FadeIn>
            </Form>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <FadeIn>
                <Piano
                  noteRange={{ first: firstNote, last: lastNote }}
                  playNote={midiNumber => {
                    var note = require('midi-note')
                    if (accidentals === 0) {
                      var sharps = true
                    } else {
                      var sharps = false
                    }
                    var noteName = Midi.midiToNoteName(midiNumber, {
                      sharps: sharps
                    })
                    setInput(input + ' ' + noteName)
                  }}
                  stopNote={midiNumber => {
                    //console.log(note(midiNumber))
                  }}
                  width={600}
                  style={{ align: 'center' }}
                />
                <br></br>
              </FadeIn>
            </div>
          </>
        )}
        <Modal
          show={settingsShow}
          backdrop='static'
          onHide={() => handleSettingsShow(false)}
        >
          <Modal.Header>
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
                Custom (coming soon!)
              </ToggleButton>
            </ButtonGroup>{' '}
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
            <ButtonGroup className='mb-2'>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='buttondefault'
                key={'buttondefault'}
                id={'buttondefault'}
                value={'buttondefault'}
                checked={open === 0}
                onChange={() => setOpen(0)}
              >
                default
              </ToggleButton>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='buttonavoid'
                key={'buttonavoid'}
                id={'buttonavoid'}
                value={'buttonavoid'}
                checked={open === 2}
                onChange={() => setOpen(2)}
              >
                avoid open strings
              </ToggleButton>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='buttonprioritize'
                key={'buttonprioritize'}
                id={'buttonprioritize'}
                value={'buttonprioritize'}
                checked={open === 1}
                onChange={() => setOpen(1)}
              >
                prioritize open strings
              </ToggleButton>
            </ButtonGroup>
            <ButtonGroup className='mb-2'>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='defaulthigher'
                key={'defaulthigher'}
                id={'defaulthigher'}
                value={'defaulthigher'}
                checked={higher === 0}
                onChange={() => setHigher(0)}
              >
                default
              </ToggleButton>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='ignorehigher'
                key={'ignorehigher'}
                id={'ignorehigher'}
                value={'ignorehigher'}
                checked={higher === 1}
                onChange={() => setHigher(1)}
              >
                ignore cost of higher frets
              </ToggleButton>
              <ToggleButton
                type='radio'
                variant='secondary'
                name='prioritizehigher'
                key={'prioritizehigher'}
                id={'prioritizehigher'}
                value={'prioritizehigher'}
                checked={higher === 2}
                onChange={() => setHigher(2)}
              >
                prioritize higher frets
              </ToggleButton>
            </ButtonGroup>
            {menu === 2 && (
              <ButtonGroup className='mb-2'>
                <ToggleButton
                  type='radio'
                  variant='secondary'
                  name='acc1'
                  key='acc1'
                  id='acc1'
                  value={0}
                  checked={accidentals === 0}
                  onChange={() => setAccidentals(0)}
                >
                  sharps
                </ToggleButton>
                <ToggleButton
                  type='radio'
                  variant='secondary'
                  name='acc2'
                  key='acc2'
                  id='acc2'
                  value={1}
                  checked={accidentals === 1}
                  onChange={() => setAccidentals(1)}
                >
                  flats
                </ToggleButton>
              </ButtonGroup>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant='primary' onClick={() => handleSettingsShow(false)}>
              Save
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
            {alertmessage}
          </Alert>
        )}
        {load && <Spinner animation='border' variant='primary' />}
        <div>
          {tab1.length > 0 && !load && menu !== 0 && (
            <>
              <Button onClick={() => handleChange(1)} variant='primary'>
                View tab 1
              </Button>{' '}
            </>
          )}
          {tab2.length > 0 && !load && menu !== 0 && (
            <>
              <Button onClick={() => handleChange(2)} variant='primary'>
                View tab 2
              </Button>{' '}
            </>
          )}
          {tab3.length > 0 && !load && menu !== 0 && (
            <>
              <Button onClick={() => handleChange(3)} variant='primary'>
                View tab 3
              </Button>{' '}
            </>
          )}
        </div>
        <br></br>
        {menu !== 0 && (
          <FadeIn>
            <Button variant='secondary' onClick={() => goBack()}>
              Go back
            </Button>
          </FadeIn>
        )}
        <br></br>
      </header>
      <br></br>
      {menu !== 0 && (
        <div style={{ marginBottom: '3vh' }}>
          <FadeIn>
            <MidiPlayer data={midiFile}></MidiPlayer>
          </FadeIn>
        </div>
      )}
      {view1 && menu !== 0 && (
        <TabDisplay cost={cost1} tab={tab1} filename={filename} num={1} />
      )}
      {view2 && menu !== 0 && (
        <TabDisplay cost={cost2} tab={tab2} filename={filename} num={2} />
      )}
      {view3 && menu !== 0 && (
        <TabDisplay cost={cost3} tab={tab3} filename={filename} num={3} />
      )}
    </div>
  )
}
