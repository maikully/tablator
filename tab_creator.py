import sys
import numpy as np
from mido import MidiFile, Message, MetaMessage
from collections import defaultdict

STRINGS = [40, 45, 50, 55, 59, 64]
FINGERS = [0, 1, 2, 3]
RANGES = [12, 12, 12, 14, 18, 18] 
TOTAL_RANGE = STRINGS[-1] - STRINGS[0] + RANGES[-1]

"""
measure similarity of two paths
return: percentage of notes that are the same
"""
def measure_similarity(path1, path2):
    arr1 = np.array(path1)
    arr2 = np.array(path2)
    return np.sum(arr1 == arr2)/len(path1)

"""
compute cost of transition between two positions
"""
def compute_cost(position1, position2, settings):
    # cost for note itself (open string favored)
    string1, fret1, finger1 = position1
    string2, fret2, finger2 = position2
    opensetting,highersetting = settings
    # avoid open strings
    if opensetting == 1:
        if int(fret1) == 0 or int(fret2) == 0:
            return 8
    # prioritize open strings
    if opensetting == 2:
        if int(fret1) == 0 or int(fret2) == 0:
            return 0
    openfactor = 1
    # ignore cost of higher frets
    if highersetting == 1:
        cost1 = 0
    # prioritize higher frets
    elif highersetting == 2:
        cost1 = -np.sqrt(fret1 + fret2) * .1
    else:
        # weigh the fret values themselves
        cost1 = np.sqrt(fret1 + fret2) * .1

    expected_fret = fret1 + (finger2 - finger1)

    
    return (fret2 - expected_fret)**2 * openfactor + cost1

"""
convert list of costs to difficulty values
"""
def normalize_costs(costs, length):
    normalized = []
    if min(costs) < 0:
        costs = [x - min(costs) for x in costs]
    for cost in costs:
        max_cost_for_length = length * 9
        normalized.append(cost/max_cost_for_length * 100)
    return normalized

"""
get all possible tabnotes for a given pitch
"""
def get_all_possible_notes(curr_note):
    possible_notes = []
    unused_strings = []
    for i, string in enumerate(reversed(STRINGS)):
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
            #print(x)
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
def correct_note(note, starts, total_range):
    lower_bound = starts[0]
    upper_bound = starts[0] + total_range
    if note < lower_bound:
        #print("too low")
        #print((note - lower_bound) % 12 + lower_bound)
        return (note - lower_bound) % 12 + lower_bound
    elif note > upper_bound:
        #print("too high")
        #print(upper_bound - (upper_bound - note) % 12)
        return upper_bound - (upper_bound - note) % 12
    return note

"""
get all (polyphonic) notes from a file
"""
def extract_notes(file, starts, total_range):
    notes = []
    prev = None
    for i, x in enumerate(file):
        if isinstance(x, MetaMessage):
            #print(x)
            pass
        else:
            if x.type == "note_on":
                if prev and prev.type == "note_on" and x.time == 0:
                    notes[-1].append(correct_note(x.note, starts, total_range))
                else:
                    notes.append([correct_note(x.note, starts, total_range)])
        prev = x
    return notes

"""
find the costs and paths in the sequence
"""
def get_paths(sequence, settings):
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
                curr_cost = prev_cost + compute_cost(prev_position, position, settings)
                if curr_cost < min:
                    min, path = curr_cost, prev_sequence + [position]
            final_paths[i+1][position] = (min, path)
    return final_paths[i+1]

"""
generate a tab_arr from a file and a given path
"""
def generate_tab_arr(file, best_path, num_strings):
    prev = None
    note_counter = 0
    output = [[] for x in range(num_strings)]
    for i, x in enumerate(file):
        if isinstance(x, MetaMessage):
            # print(x)
            pass
        else:
            for y in output:
                y += "-"
            if x.time > .5:
                for y in output:
                    y += "-"
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
    num_strings = len(starts)
    string_d = defaultdict(list)
    for i, start in enumerate(starts):
        for j in range(ranges[i] + 1):
            string_d[start+j] += [((num_strings - 1) - i, j)]
    sequence = []
    # build all possible (string,fret,finger) fingerings of each note in order
    for i, note in enumerate(notes):
        note_fingering = string_d[note[0]]
        sequence += [[(string, fret, finger)
                      for string, fret in note_fingering for finger in FINGERS]]
    return sequence
"""
get arr of strs representing output paths and arr of their costs
"""
def create_output_strs(file, sorted_paths, strings, screen_width):
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
                max_similarity = 0
                for x in seen:
                    if measure_similarity(to_check, x) > max_similarity:
                        max_similarity = measure_similarity(to_check, x)
                if max_similarity > .95:
                    continue
                seen.add(to_check)
                costs.append(cost)
                # get tab arr from path
                tab_arr = generate_tab_arr(file, path, len(strings))
                strs.append([])
                length = len(tab_arr[0])
                line_length = screen_width // 12
                lines = length // line_length + 1
                remainder = length % line_length - 1
                if length < line_length:
                    for i,y in enumerate(tab_arr):
                        # if string name has accidental
                        if len(strings[i]) > 2:
                            flag = ""
                        else:
                            flag = "|"
                        strs[-1].append(strings[i] + flag + "".join(y) + "|")
                else:
                    # flag represents which string should have its first digit removed
                    flag = None
                    # flag represents when a string name has an accidental and the first char after should be omitted
                    flag2 = "|"
                    for n in range(lines - 1):
                        for i,string in enumerate(tab_arr):
                            # if string tuning has an accidental
                            if len(strings[i]) > 2:
                                flag2 = ""
                            else:
                                flag2 = "|"
                            # if a two-digit fret is being cut off
                            if len("".join(string)) >= (n + 1) * line_length - 1 and "".join(string)[(n + 1) * line_length - 1] != "-" and "".join(string)[(n + 1) * line_length] != "-":
                                if flag == i:
                                    strs[-1].append(strings[i] + flag2 + "-" + "".join(string)[n * line_length + 1: (n + 1) * line_length + 1])
                                else:
                                    strs[-1].append(strings[i] + flag2 + "".join(string)[n * line_length: (n + 1) * line_length + 1])
                                flag = i
                            else:
                                if flag == i:
                                    strs[-1].append(strings[i] + flag2 + "-" + "".join(string)[n * line_length + 1: (n + 1) * line_length] + "|")
                                    flag = None
                                else:
                                    strs[-1].append(strings[i] + flag2 + "".join(string)[n * line_length: (n + 1) * line_length] +"|")
                        strs[-1].append("\n")
                    if remainder > 0:
                        for i,z in enumerate(tab_arr):
                            if len(strings[i]) > 2:
                                flag2 = ""
                            else:
                                flag2 = "|"
                            strs[-1].append(strings[i] + flag2 + "".join(z)[(n + 1) * line_length:(n + 1) * line_length + remainder + 2]  +"|")
                
            counter += 1
    return (strs, costs)

def main():
    file_path = sys.argv[1]
    file = MidiFile(file_path, clip=True)
    """
    output = [[], [], [], [], [], []]
    #output, num_notes, notes = get_all_tab_monophonic(file)
    notes = extract_notes(file)
    sequence = generate_fingerings(notes, STRINGS, RANGES)
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
    """


if __name__ == "__main__":
    main()
