# Tablator


Tablator is a webapp that converts a sequence of notes or midi file into a guitar tab.

App link: http://tablator.herokuapp.com

When playing a passage, for every note, a guitarist must choose which finger to use to fret the string and, unless the note only can be played on one string, which string to play the note on. This choice greatly impacts the playability of the passage: a better fingering means an easier time playing.  This program uses a dynamic programming algorithm to find the three best possible fingering sequences for a sequence of notes. 

The cost function for the transition between two notes is calculated using the difference between the displacement in frets and the displacement in finger used (assuming all four fingers can comfortably cover exactly one fret). Higher frets also produce higher cost.

Currently, the program will only work on monophonic data. For any polyphonic parts (if two consecutive notes have the exact same note-on time), the program only uses one of the notes. Any notes outside the range of the chosen instrument will be octave-shifted in.

## Features

- compose a line using a virtual keyboard and view up to three of its best tabs
- import a midi file and view up to three of its best tabs
- play the midi file out loud
- download the tab as a txt file

## Local Installation

Tablator requires [Node.js](https://nodejs.org/) and [Python](https://www.python.org/) to run locally.

Starting the frontend (React) server:

```sh
cd frontend
npm i
npm start
```
Starting the backend (python) server:

```sh
pip3 install -r requirements.txt
python3 base.py
```

### Todo:

- [ ] time representation between notes can be improved
- [ ] get chords working
- [ ] display note fingerings alongside note
- [ ] add option to not prioritize open strings or lower frets  
- [ ] add custom tunings
- [ ] display as score using Lilypond
- [ ] option to download composed midi
- [x] option to ignore fret height
- [x] piano input
- [x] leave out similar tabs
- [x] add bass tabs
- [x] add loading throbber
- [x] double-digit frets being cut in half at wrap
- [x] add sample midi
- [x] download buttons for tabs
- [x] display cost for tab
- [x] notes after a long pause being cut off
- [x] have tab length change based on screen width
- [x] all three buttons showing with fewer than three versions available
- [x] remainder notes not showing
