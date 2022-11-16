# Tablator

Webapp that converts a midi file into a guitar tab.

When playing a passage, for every note, a guitarist must choose which finger to use to fret the string and/or which string to play the note on. This choice greatly impacts the playability of the passage: a better fingering means an easier time playing. This program uses a dynamic programming algorithm to find the three best possible fingering sequences for a sequence of notes. 

Frontend served at http://tablator.herokuapp.com

Right now, only monophonic midi parts should be used for this program. For polyphonic beats (when two notes have the exact same note-on time), only one of the notes will be used.

The cost function for the transition between two notes is calculated using the difference between the displacement in frets and the displacement in finger used (assuming all four fingers can comfortably cover exactly one fret). Lower frets are also preferred over higher ones.

Todo:

- [ ] time representation between notes can be improved
- [ ] get chords working
- [ ] double-digit frets being cut in half at wrap
- [ ] display note fingerings alongside note
- [x] download buttons for tabs
- [x] display cost for tab
- [x] notes after a long pause being cut off
- [x] have tab length change based on screen width
- [x] all three buttons showing with fewer than three versions available
- [x] remainder notes not showing
