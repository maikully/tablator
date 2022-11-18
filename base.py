import time
import os
from io import BytesIO
from mido import MidiFile
from tab_creator import extract_notes, generate_fingerings, get_paths, normalize_costs, create_output_strs
from flask import Flask, current_app, jsonify, request, flash, redirect, url_for, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin

RANGES_GUITAR = [18,18,18,18,20,24]  # fret range of each string
RANGES_BASS = [24, 24, 24, 24]  # fret range of each string
# STARTS = [53,58,63,68,72,77] # starts on first fret of each string
STARTS_GUITAR = [40, 45, 50, 55, 59, 64]  # starts on first fret of each string - guitar
STARTS_BASS = [28, 33, 38, 43]  # starts on first fret of each string - bass
TOTAL_GUITAR_RANGE = STARTS_GUITAR[-1] - STARTS_GUITAR[0] + RANGES_GUITAR[-1]
TOTAL_BASS_RANGE = STARTS_BASS[-1] - STARTS_BASS[0] + RANGES_BASS[-1]
STRINGS_GUITAR = ["E", "B", "G", "D", "A", "E"]
STRINGS_BASS = ["G", "D", "A", "E"]
UPLOAD_FOLDER = './midi_files'

app = Flask(__name__ 
    ,static_folder='./frontend/build',static_url_path='/')
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
cors = CORS(app)
ALLOWED_EXTENSIONS = {'mid','midi'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/tablator', methods=["POST"], strict_slashes=False)
@cross_origin()
def process_file():
    screen_width = int(request.form["width"])
    starts = None
    ranges = None
    strings = None
    instrument = request.form["instrument"]
    opensetting = int(request.form["opensetting"])
    highersetting = int(request.form["higher"])
    settings = (opensetting, highersetting)
    if instrument == "guitar":
        starts = STARTS_GUITAR
        ranges = RANGES_GUITAR
        strings = STRINGS_GUITAR
        total_range = TOTAL_GUITAR_RANGE
    elif instrument == "bass":
        starts = STARTS_BASS
        ranges = RANGES_BASS
        strings = STRINGS_BASS
        total_range = TOTAL_BASS_RANGE
    elif instrument == "custom":
        starts = [int(x) for x in request.form["customStrings"].split(',')]
        ranges = RANGES_GUITAR
        total_range = starts[-1] - starts[0] + ranges[-1]
        strings = request.form["stringsNames"].split(',')
        strings.reverse()
    if request.method == 'POST':
        # check if the post request has the file part
        if 'file' not in request.files:
            flash('No file part')
            return redirect(request.url)
        file = request.files['file']
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == '':
            flash('No selected file')
            return redirect(request.url)
        if file and (allowed_file(file.filename) or file.filename == "blob"):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], "temp.mid"))

    file = MidiFile(UPLOAD_FOLDER + "/" + "temp.mid", clip=True)
    notes = extract_notes(file, starts, total_range)
    sequence = generate_fingerings(notes, starts, ranges)
    final_paths = get_paths(sequence, settings)
    sorted_paths = sorted(final_paths.values(), key=lambda x: x[0])
    (strs, costs) = create_output_strs(file, sorted_paths, strings, screen_width)
    # remove file
    os.remove(UPLOAD_FOLDER + "/" + "temp.mid")
    # normalize costs to a percentage
    costs = normalize_costs(costs, len(notes))
    ret = {"data": strs, "costs": costs}
    return ret



@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))