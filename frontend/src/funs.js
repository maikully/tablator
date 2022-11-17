function _slicedToArray(arr, i) {
  return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest();
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

var SORTED_PITCHES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
var ACCIDENTAL_PITCHES = ['Db', 'Eb', 'Gb', 'Ab', 'Bb'];
var PITCH_INDEXES = {
  C: 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11
};
var MIDI_NUMBER_C0 = 12;
var MIN_MIDI_NUMBER = MIDI_NUMBER_C0;
var MAX_MIDI_NUMBER = 127;
var NOTE_REGEX = /([a-g])([#b]?)(\d+)/;
var NOTES_IN_OCTAVE = 12; // Converts string notes in scientific pitch notation to a MIDI number, or null.

export default function midiNumToNote(note) {
    if (!note) {
      throw Error('Invalid note argument');
    }
  
    var match = NOTE_REGEX.exec(note.toLowerCase());
  
    if (!match) {
      throw Error('Invalid note argument');
    }
  
    var _match = _slicedToArray(match, 4),
        letter = _match[1],
        accidental = _match[2],
        octave = _match[3];
  
    var pitchName = "".concat(letter.toUpperCase()).concat(accidental);
    var pitchIndex = PITCH_INDEXES[pitchName];
  
    if (pitchIndex == null) {
      throw Error('Invalid note argument');
    }
  
    return MIDI_NUMBER_C0 + pitchIndex + NOTES_IN_OCTAVE * parseInt(octave, 10);
  }
