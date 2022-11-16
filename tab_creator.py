import sys
import numpy as np
from mido import MidiFile, Message, MetaMessage
from collections import defaultdict

STRINGS = [64, 59, 55, 50, 45, 40]
FINGERS = [0, 1, 2, 3]
RANGES = [12, 12, 12, 14, 18, 18] 
STARTS = [40, 45, 50, 55, 59, 64]
TOTAL_RANGE = STARTS[-1] - STARTS[0] + RANGES[-1]

"""
computer cost of transition between two positions
"""
def compute_cost(position1, position2):
    # cost for note itself (open string favored)
    string1, fret1, finger1 = position1
    string2, fret2, finger2 = position2
    expected_fret = fret1 + (finger2 - finger1)

    # weigh the fret values themselves
    cost1 = np.sqrt(fret1 + fret2) * .1
    
    return (fret2 - expected_fret)**2 + cost1


"""
get all possible tabnotes for a given pitch
"""
def get_all_possible_notes(curr_note):
    possible_notes = []
    unused_strings = []
    for i, string in enumerate(STRINGS):
        if curr_note >= string and curr_note - string < 25:
            possible_notes.append((curr_note - string, i, 0))
        else:
            unused_strings.append(i)
    return (possible_notes, unused_strings)

"""
write a tab_arr to file
"""
def write_tab(tab_arr, filepath):
    f = open(filepath, "w")
    length = len(tab_arr[0])
    line_length = 200
    lines = length // line_length + 1
    for n in range(lines):
        for y in tab_arr:
            f.write("".join(y)[n * line_length: (n + 1) * line_length])
            f.write("\n")
        f.write("\n")

    f.close()

"""
convert a tab_arr to a string
"""
def tab_to_string(tab_arr):
    str = ""
    for y in tab_arr:
        str += "".join(y)
        str += "\n"
    return str


"""
create tab_arr that includes frettings on every possible string for every note in a monophonic file
"""
def get_all_tab_monophonic(file):
    output = [[], [], [], [], [], []]
    num_notes = 0
    prev_note = None
    notes = []
    for i, x in enumerate(file):
        if isinstance(x, MetaMessage):
            print(x)
            pass
        else:
            # if i < 100:
            for y in output:
                y += "-"
            if x.time > .5:
                for x in output:
                    x += "-"
            else:
                if x.type == "note_on":
                    corrected = correct_note(x.note)
                    notes.append(corrected)
                    num_notes += 1
                    (possible_notes, unused_strings) = get_all_possible_notes(corrected)
                    # add to output
                    max_fret = possible_notes[-1].getFret()
                    for note in possible_notes:
                        output[note.getString()].append(
                            str(note.getFret()))
                        if max_fret > 9 and note.getFret() < 10:
                            output[note.getString()].append("-")

                    for string in unused_strings:
                        output[string].append("-")

                        if max_fret > 9:
                            output[string].append("-")
                    #prev_note = curr_note
    return (output, num_notes, notes)

""" 
shift a note into fuitar range
"""
def correct_note(note):
    lower_bound = STARTS[0]
    upper_bound = STARTS[0] + TOTAL_RANGE
    if note < lower_bound:
        return (note - lower_bound) % 12 + lower_bound
    elif note > upper_bound:
        return upper_bound - (upper_bound - note) % 12
    return note

"""
get all (polyphonic) notes from a file
"""
def extract_notes(file):
    notes = []
    prev = None
    for i, x in enumerate(file):
        if isinstance(x, MetaMessage):
            print(x)
            pass
        else:
            if x.type == "note_on":
                if prev.type == "note_on" and x.time == 0:
                    notes[-1].append(correct_note(x.note))
                else:
                    notes.append([correct_note(x.note)])
        prev = x
    return notes

"""
find the costs and paths in the sequence
"""
def get_paths(sequence):
    final_paths = defaultdict(dict)
    # set one-note paths to zero cost
    final_paths[0] = dict(zip(sequence[0], [(0, [seq])
                          for seq in sequence[0]]))
    # for the rest of the notes, construct list of paths for every current possible position
    for i, possible_positions in enumerate(sequence[1:]):
        # checking every possible position
        for position in possible_positions:
            min = sys.maxsize
            # checking every position for the previous note
            for prev_position, (prev_cost, prev_sequence) in final_paths[i].items():
                curr_cost = prev_cost + compute_cost(prev_position, position)
                if curr_cost < min:
                    min, path = curr_cost, prev_sequence + [position]
            final_paths[i+1][position] = (min, path)
    return final_paths[i+1]

"""
generate a tab_arr from a file and a given path
"""
def generate_tab_arr(file, best_path):
    prev = None
    note_counter = 0
    output = [[], [], [], [], [], []]
    for i, x in enumerate(file):
        if isinstance(x, MetaMessage):
            # print(x)
            pass
        else:
            for y in output:
                y += "-"
            if x.time > .5:
                for x in output:
                    x += "-"
            else:
                if x.type == "note_on":
                    if prev and prev.type == "note_on" and x.time == 0:
                        pass
                    else:
                        ideal_note = best_path[note_counter]
                        (string, fret, finger) = ideal_note
                        # add to output
                        for i, arr in enumerate(output):
                            if string == i:
                                output[i].append(str(fret))
                            else:
                                output[i].append("-")
                                if fret > 9:
                                    output[i].append("-")
                        note_counter += 1
                prev = x
    return (output)


"""
generates sequences of possible fingerings for each note
"""
def generate_fingerings(notes, starts, ranges):
    string_d = defaultdict(list)
    for i, start in enumerate(starts):
        for j in range(ranges[i] + 1):
            string_d[start+j] += [(5 - i, j)]
    sequence = []
    # build all possible (string,fret,finger) fingerings of each note in order
    for i, note in enumerate(notes):
        note_fingering = string_d[note[0]]
        sequence += [[(string, fret, finger)
                      for string, fret in note_fingering for finger in FINGERS]]
    return sequence


def main():
    file_path = sys.argv[1]
    file = MidiFile(file_path, clip=True)
    output = [[], [], [], [], [], []]
    #output, num_notes, notes = get_all_tab_monophonic(file)
    notes = extract_notes(file)
    sequence = generate_fingerings(notes, STARTS, RANGES)
    final_paths = get_paths(sequence)
    sorted_paths = sorted(final_paths.values(), key=lambda x: x[0])
    # take top three paths
    counter = 0
    seen = set()
    for i, (cost, path) in enumerate(sorted_paths):
        if counter < 3:
            to_check = tuple([x[0] for x in path])
            if to_check in seen:
                continue
            else:
                seen.add(to_check)
                tab_arr = generate_tab_arr(file, path)
                write_tab(tab_arr, str(i) + " cost " + str(cost))
            counter += 1



if __name__ == "__main__":
    main()
