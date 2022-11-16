# Tablator
App that converts a midi file into a guitar tab. Uses a DP algorithm to get the three best fingering paths, also displaying time differences between notes.
Frontend served at http://tablator.herokuapp.com
Right now, monophonic midi parts should be used for this program. If there are any polyphonic parts (i.e. two notes have the exact same note-on time), only one of the notes will be counted for.