import { propTypes } from 'react-bootstrap/esm/Image'
import Popover from 'react-bootstrap/Popover'
import OverlayTrigger from 'react-bootstrap/OverlayTrigger'
import { Button, Form, Modal } from 'react-bootstrap'

function TabDisplay (props) {
  const downloadTxtFile = tab => {
    const element = document.createElement('a')
    const file = new Blob(
      tab.map(x => x + '\n'),
      {
        type: 'text/plain'
      }
    )
    element.href = URL.createObjectURL(file)
    element.download = "tab"+ '.txt'
    document.body.appendChild(element) // Required for this to work in FireFox
    element.click()
  }
  return (
    <>
      <h2>Tab {props.num}</h2>
      <br></br>
      <OverlayTrigger
        placement={'left'}
        overlay={
          <Popover>
            <Popover.Header as='h3'>{'What is difficulty?'}</Popover.Header>
            <Popover.Body>
              The difficulty of a tab is proportional to the average cost per
              note in the tab. A higher difficulty means the fingerings are, on
              average, more awkward to play or higher on the fretboard. Note
              that the cost function varies with some of the settings, so
              comparing difficulties across different settings might not
              work well.
            </Popover.Body>
          </Popover>
        }
      >
        <Button variant='secondary' style={{ marginBottom: '2vh' }}>
          difficulty: {props.cost}%
        </Button>
      </OverlayTrigger>
      <div>
        <Button
          variant='primary'
          onClick={() => downloadTxtFile(props.tab)}
          style={{ marginBottom: '5vh' }}
        >
          download tab
        </Button>
      </div>
      <div id='container'>
        <p className='tab'>{props.tab.map(x => x + '\n')}</p>
      </div>
    </>
  )
}

export default TabDisplay
