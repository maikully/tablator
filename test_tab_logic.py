import unittest
from io import BytesIO
from itertools import product

from mido import Message, MidiFile, MidiTrack

from base import app
from tab_creator import compute_cost, format_tab, get_paths, normalize_costs


def midi_bytes(notes):
    midi = MidiFile()
    track = MidiTrack()
    midi.tracks.append(track)
    for note in notes:
        track.append(Message('note_on', note=note, velocity=64, time=120))
        track.append(Message('note_off', note=note, time=120))
    output = BytesIO()
    midi.save(file=output)
    return output.getvalue()


class PathTests(unittest.TestCase):
    def test_empty_and_single_note(self):
        self.assertEqual(get_paths([], (0, 0)), {})
        position = (0, 3, 1)
        self.assertEqual(get_paths([[position]], (0, 0)), {position: (0, [position])})
        self.assertEqual(get_paths([[position], []], (0, 0)), {})

    def test_costs_match_exhaustive_search(self):
        sequence = [[(0, 0, 0), (1, 4, 2)], [(0, 2, 1), (1, 6, 3)], [(0, 5, 3), (1, 9, 1)]]
        for settings in product(range(3), repeat=2):
            paths = get_paths(sequence, settings)
            for end, (cost, path) in paths.items():
                candidates = [candidate for candidate in product(*sequence) if candidate[-1] == end]
                best_cost = min(sum(compute_cost(a, b, settings) for a, b in zip(candidate, candidate[1:]))
                                for candidate in candidates)
                self.assertAlmostEqual(cost, best_cost)
                self.assertEqual(len(path), len(sequence))

    def test_normalization(self):
        self.assertEqual(normalize_costs([], 0), [])
        self.assertEqual(normalize_costs([0], 0), [0])
        self.assertEqual(normalize_costs([-9, 0, 9], 2), [0, 50, 100])
        self.assertEqual(normalize_costs([9, 18], 2), [50, 100])


class FormattingTests(unittest.TestCase):
    def test_wrap_preserves_every_column_and_whole_frets(self):
        rows = ['-10--2--24-7-', '----12------3']
        for width in (1, 12, 24, 36, 48, 60, 144, 156, 1000):
            with self.subTest(width=width):
                output = format_tab(rows, ['E', 'B'], width)
                chunks = [[], []]
                lines = [line for line in output if line != '\n']
                for index, line in enumerate(lines):
                    chunks[index % 2].append(line[2:-1])
                self.assertEqual([''.join(parts) for parts in chunks], rows)
                self.assertEqual([len(part) for part in chunks[0]], [len(part) for part in chunks[1]])
                for parts in chunks:
                    for left, right in zip(parts, parts[1:]):
                        self.assertFalse(left[-1].isdigit() and right[0].isdigit())


class UploadTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def upload(self, notes, filename='test.mid', **settings):
        data = dict(width='1000', instrument='guitar', opensetting='0', higher='0', capo='0')
        data.update(settings)
        data['file'] = (BytesIO(midi_bytes(notes)), filename)
        return self.client.post('/tablator', data=data)

    def test_samples_and_instruments(self):
        for instrument in ('guitar', 'bass', 'custom'):
            settings = dict(instrument=instrument)
            if instrument == 'custom':
                settings.update(customStrings='64,45,50,55,59,40', stringsNames='E,A,D,G,B,E')
            response = self.upload([40, 45, 52, 64], capo='2', **settings)
            self.assertEqual(response.status_code, 200)
            result = response.get_json()
            self.assertTrue(result['data'])
            self.assertEqual(len(result['data']), len(result['costs']))
            self.assertLessEqual(len(result['data']), 3)

    def test_empty_single_note_and_blob_uploads(self):
        self.assertEqual(self.upload([]).get_json(), {'data': [], 'costs': []})
        for filename in ('test.MIDI', 'blob'):
            response = self.upload([64], filename=filename, width='1')
            self.assertEqual(response.status_code, 200)
            self.assertTrue(response.get_json()['data'])

    def test_invalid_requests_return_json_errors(self):
        responses = [self.client.post('/tablator'), self.upload([64], filename='test.txt'),
                     self.upload([64], instrument='unknown'), self.upload([64], width='bad'),
                     self.upload([64], width='0'), self.upload([64], instrument='custom',
                     customStrings='40,45', stringsNames='E')]
        responses.append(self.client.post('/tablator', data={
            'width': '1000', 'instrument': 'guitar', 'opensetting': '0', 'higher': '0', 'capo': '0',
            'file': (BytesIO(b'not midi'), 'test.mid')}))
        for response in responses:
            self.assertEqual(response.status_code, 400)
            self.assertIn('error', response.get_json())


if __name__ == '__main__':
    unittest.main()
