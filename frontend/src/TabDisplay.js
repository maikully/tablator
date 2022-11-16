import { propTypes } from "react-bootstrap/esm/Image";
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
      element.download = props.filename + '.txt'
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
              cost: {props.cost}
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