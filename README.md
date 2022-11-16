# Tablator
App that converts a midi file into a guitar tab. Uses a DP algorithm to get the three best fingering paths, also representing time differences between notes.

Frontend served at http://tablator.herokuapp.com

Right now, monophonic midi parts should be used for this program. If there are any polyphonic parts (i.e. two notes have the exact same note-on time), only one of the notes will be counted for.

The cost function for the transition between two notes is calculated using the difference between the displacement in frets and the displacement in finger used (assuming all four fingers can comfortably cover exactly one fret). Lower frets are also preferred over higher ones.

issues:

chords not working

time representation between notes can be improved

~~notes too far in time being cut off~~

~~all three buttons showing with fewer than three versions available~~