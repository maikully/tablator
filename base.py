import os
from io import BytesIO
from mido import MidiFile
from tab_creator import extract_notes, generate_fingerings, get_paths, normalize_costs, create_output_strs
from flask import Flask, request
from flask_cors import CORS, cross_origin

RANGES_GUITAR = [18,18,18,18,20,24]  # fret range of each string
RANGES_BASS = [24, 24, 24, 24]  # fret range of each string
STARTS_GUITAR = [40, 45, 50, 55, 59, 64]  # starts on first fret of each string - guitar
STARTS_BASS = [28, 33, 38, 43]  # starts on first fret of each string - bass
STRINGS_GUITAR = ["E", "B", "G", "D", "A", "E"]
STRINGS_BASS = ["G", "D", "A", "E"]

app = Flask(__name__ 
    ,static_folder='./frontend/build',static_url_path='/')
app.config['CORS_HEADERS'] = 'Content-Type'
cors = CORS(app)
ALLOWED_EXTENSIONS = {'mid','midi'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/tablator', methods=["POST"], strict_slashes=False)
@cross_origin()
def process_file():
    file = request.files.get('file')
    if file is None or not file.filename:
        return {"error": "select a midi file"}, 400
    if not allowed_file(file.filename) and file.filename != "blob":
        return {"error": "file type must be mid or midi"}, 400

    try:
        screen_width = int(request.form["width"])
        opensetting = int(request.form["opensetting"])
        highersetting = int(request.form["higher"])
        capo = int(request.form["capo"])
        instrument = request.form["instrument"]
        if instrument == "guitar":
            starts, ranges, strings = STARTS_GUITAR, RANGES_GUITAR, STRINGS_GUITAR
        elif instrument == "bass":
            starts, ranges, strings = STARTS_BASS, RANGES_BASS, STRINGS_BASS
        elif instrument == "custom":
            starts = [int(note) for note in request.form["customStrings"].split(',')]
            strings = list(reversed(request.form["stringsNames"].split(',')))
            ranges = RANGES_GUITAR[:len(starts)]
            if not starts or len(starts) != len(ranges) or len(starts) != len(strings):
                return {"error": "custom strings and names must match (1 to 6 strings)"}, 400
        else:
            return {"error": "unknown instrument"}, 400
        if screen_width <= 0 or capo < 0 or opensetting not in (0, 1, 2) or highersetting not in (0, 1, 2):
            return {"error": "invalid tab settings"}, 400
    except (KeyError, ValueError):
        return {"error": "missing or invalid tab settings"}, 400

    starts = [note + capo for note in starts]
    total_range = max(start + fret_range for start, fret_range in zip(starts, ranges)) - min(starts)
    try:
        midi = MidiFile(file=BytesIO(file.read()), clip=True)
    except (EOFError, OSError, ValueError):
        return {"error": "invalid midi file"}, 400
    notes = extract_notes(midi, starts, total_range)
    sequence = generate_fingerings(notes, starts, ranges)
    paths = get_paths(sequence, (opensetting, highersetting))
    sorted_paths = sorted(paths.values(), key=lambda path: path[0])
    tabs, costs = create_output_strs(midi, sorted_paths, strings, screen_width)
    return {"data": tabs, "costs": normalize_costs(costs, len(notes))}



@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))