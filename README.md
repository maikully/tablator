# Tablator
App that converts a midi file into a guitar tab. Uses a DP algorithm to get the three best fingering paths, where each fingering is represented by a string, fret, and finger. Also represents time differences between notes with additional dashes.

Frontend served at http://tablator.herokuapp.com

Right now, only monophonic midi parts should be used for this program. For polyphonic beats (when two notes have the exact same note-on time), only one of the notes will be used.

The cost function for the transition between two notes is calculated using the difference between the displacement in frets and the displacement in finger used (assuming all four fingers can comfortably cover exactly one fret). Lower frets are also preferred over higher ones.

Todo:
- [ ] time representation between notes can be improved
- [ ] get chords working
- [ ] double-digit frets being cut in half at wrap
- [x] notes after a long pause being cut off
- [x] have tab length change based on screen width
- [x] all three buttons showing with fewer than three versions available