import time
import os
from io import BytesIO
from mido import MidiFile
from tab_creator import extract_notes, generate_fingerings, compute_cost, get_paths, tab_to_string, generate_tab_arr
from flask import Flask, current_app, jsonify, request, flash, redirect, url_for, send_from_directory
from werkzeug.utils import secure_filename
from flask_cors import CORS, cross_origin

RANGES_GUITAR = [12, 12, 12, 14, 18, 18]  # fret range of each string
RANGES_BASS = [18, 18, 18, 18]  # fret range of each string
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
    num_strings = len(strings)
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
            file.save(os.path.join(app.config['UPLOAD_FOLDER'], "temp.mid"))

    #return jsonify(d)
    file = MidiFile(UPLOAD_FOLDER + "/" + "temp.mid", clip=True)
    notes = extract_notes(file, starts, total_range)
    sequence = generate_fingerings(notes, starts, ranges)
    final_paths = get_paths(sequence)
    sorted_paths = sorted(final_paths.values(), key=lambda x: x[0])
    # take top three paths
    counter = 0
    seen = set()
    strs = []
    costs = []
    for i, (cost, path) in enumerate(sorted_paths):
        if counter < 3:
            to_check = tuple([x[0] for x in path])
            if to_check in seen:
                continue
            else:
                seen.add(to_check)
                costs.append(cost)
                # get tab arr from path
                tab_arr = generate_tab_arr(file, path, num_strings)
                strs.append([])
                length = len(tab_arr[0])
                line_length = screen_width // 12
                lines = length // line_length + 1
                remainder = length % line_length - 1
                if length < line_length:
                    for i,y in enumerate(tab_arr):
                        strs[-1].append(strings[i] + "|" + "".join(y) + "|")
                else:
                    # flag represents which string should have its first digit removed
                    flag = None
                    for n in range(lines - 1):
                        for i,string in enumerate(tab_arr):
                            # if a two-digit fret is being cut off
                            if len("".join(string)) >= (n + 1) * line_length - 1 and "".join(string)[(n + 1) * line_length - 1] != "-" and "".join(string)[(n + 1) * line_length] != "-":
                                if flag == i:
                                    strs[-1].append(strings[i] + "|-" + "".join(string)[n * line_length + 1: (n + 1) * line_length + 1])
                                else:
                                    strs[-1].append(strings[i] + "|" + "".join(string)[n * line_length: (n + 1) * line_length + 1])
                                flag = i
                            else:
                                if flag == i:
                                    strs[-1].append(strings[i] + "|-" + "".join(string)[n * line_length + 1: (n + 1) * line_length] + "|")
                                    flag = None
                                else:
                                    strs[-1].append(strings[i] + "|" + "".join(string)[n * line_length: (n + 1) * line_length] +"|")
                        strs[-1].append("\n")
                    print((n + 1) * line_length)
                    print(length)
                    print(line_length)
                    print(remainder)
                    if remainder > 0:
                        for i,z in enumerate(tab_arr):
                            strs[-1].append(strings[i] + "|" + "".join(z)[(n + 1) * line_length:(n + 1) * line_length + remainder + 2]  +"|")
                
            counter += 1
    os.remove(UPLOAD_FOLDER + "/" + "temp.mid")
    ret = {"data": strs, "costs": costs}
    return ret

@app.route('/')
def index():
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False, port=os.environ.get('PORT', 80))