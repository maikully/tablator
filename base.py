import time
import os
from io import BytesIO
from mido import MidiFile
from tab_creator import extract_notes, generate_fingerings, compute_cost, compute_path, tab_to_string, generate_tab_arr
from flask import Flask, current_app, jsonify, request, flash, redirect, url_for, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin

RANGES = [12, 12, 12, 14, 18, 18]  # fret range of each string
# STARTS = [53,58,63,68,72,77] # starts on first fret of each string
STARTS = [40, 45, 50, 55, 59, 64]  # starts on first fret of each string
TOTAL_RANGE = STARTS[-1] - STARTS[0] + RANGES[-1]
UPLOAD_FOLDER = 'midi_files'

app = Flask(__name__ 
    ,static_folder='./frontend/build',static_url_path='/')
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
cors = CORS(app)
ALLOWED_EXTENSIONS = {'mid','midi'}


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/time')
def get_current_time():
    return {'time': time.time()}


@app.route('/tablator', methods=["POST"], strict_slashes=False)
@cross_origin()
def process_file():
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
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))

    #return jsonify(d)
    file = MidiFile(UPLOAD_FOLDER + "/" + filename, clip=True)
    notes = extract_notes(file)
    sequence = generate_fingerings(notes, STARTS, RANGES)
    final_paths = compute_path(sequence)
    sorted_paths = sorted(final_paths.values(), key=lambda x: x[0])
    # take top three paths
    counter = 0
    seen = set()
    strs = []
    for i, (cost, path) in enumerate(sorted_paths):
        if counter < 3:
            to_check = tuple([x[0] for x in path])
            if to_check in seen:
                continue
            else:
                seen.add(to_check)
                # get tab arr from path
                tab_arr = generate_tab_arr(file, path)
                strs.append([])
                length = len(tab_arr[0])
                line_length = 175
                lines = length // line_length + 1
                for n in range(lines):
                    for y in tab_arr:
                        strs[-1].append("".join(y)[n * line_length: (n + 1) * line_length] )
                    strs[-1].append("\n")
            counter += 1
    #print(strs)
    os.remove(UPLOAD_FOLDER + "/" + filename)
    return jsonify(data=strs)

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))