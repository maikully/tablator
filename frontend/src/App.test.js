import { fireEvent, render, screen } from '@testing-library/react'
import App from './App'

jest.mock('react-ga4', () => ({ initialize: jest.fn(), send: jest.fn() }))
jest.mock('react-midi-player', () => ({ data }) => data ? <span>midi ready</span> : null)
jest.mock('react-piano', () => ({ ...jest.requireActual('react-piano'), Piano: () => null }))
jest.mock('react-fade-in', () => ({ children }) => children)
jest.mock('jquery', () => () => ({ width: () => 1000 }))

beforeEach(() => {
  global.fetch = jest.fn()
})

afterEach(() => {
  delete global.fetch
})

test('requires a file before uploading', () => {
  render(<App />)
  fireEvent.click(screen.getByText('Create tab from midi file'))
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  expect(screen.getByText('select a midi file first')).toBeInTheDocument()
  expect(fetch).not.toHaveBeenCalled()
})

test('clears loading and shows errors when a request fails', async () => {
  fetch.mockRejectedValue(new Error('request failed'))
  render(<App />)
  fireEvent.click(screen.getByText('Create tab from note sequence'))
  fireEvent.change(document.querySelector('textarea'), { target: { value: 'E2 A2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  expect(await screen.findByText('request failed')).toBeInTheDocument()
  expect(document.querySelector('.spinner-border')).toBeNull()
})

test('shows backend validation errors', async () => {
  fetch.mockResolvedValue({ ok: false, json: async () => ({ error: 'invalid tab settings' }) })
  render(<App />)
  fireEvent.click(screen.getByText('Create tab from note sequence'))
  fireEvent.change(document.querySelector('textarea'), { target: { value: 'E2 A2' } })
  fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  expect(await screen.findByText('invalid tab settings')).toBeInTheDocument()
  expect(document.querySelector('.spinner-border')).toBeNull()
})

test.each(['file', 'notes'])('uses the same custom tuning fields for %s input', async mode => {
  fetch.mockResolvedValue({ ok: true, json: async () => ({ data: [['E|--0|']], costs: [1.234] }) })
  const { container } = render(<App />)
  fireEvent.click(screen.getByText(mode === 'file' ? 'Create tab from midi file' : 'Create tab from note sequence'))
  fireEvent.click(screen.getByRole('button', { name: 'Settings' }))
  fireEvent.click(screen.getByLabelText('custom'))
  fireEvent.click(screen.getByRole('button', { name: 'Save' }))
  if (mode === 'file') {
    const file = new File(['midi'], 'sample.mid', { type: 'audio/midi' })
    fireEvent.change(container.querySelector('input[type="file"]'), { target: { files: [file] } })
    await screen.findByText('midi ready')
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  } else {
    fireEvent.change(document.querySelector('textarea'), { target: { value: 'E2 A2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
  }
  expect(await screen.findByRole('button', { name: 'View tab 1' })).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'View tab 2' })).toBeNull()
  const data = fetch.mock.calls[0][1].body
  expect(data.get('instrument')).toBe('custom')
  expect(data.get('customStrings')).toBe('40,45,50,55,59,64')
  expect(data.get('stringsNames')).toBe('E,A,D,G,B,E')
})
