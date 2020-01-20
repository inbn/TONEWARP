import Tuna from 'tunajs';
window.THREE = require('three');
THREE.LegacyJSONLoader = require('./LegacyJSONLoader');

import {
  satieSecondOrderArray,
  mozartSecondOrderArray,
  straussSecondOrderArray,
  griegSecondOrderArray
} from './markovarrays';

// Parcel doesn't really handle audio files well - generate an object of
// <original name>: <dist folder name> pairs
const audioFiles = require('../samples/*.wav');

// TODO get this loading
const shipModel = require('../models/ship.json');

const fontJson = require( "./roboto_slab_regular.typeface.json" );

var context = new AudioContext();

// Arrays to contain oscillators, filters and gain nodes
var oscillators1 = [];
var oscillators2 = [];
var filters = [];
var gainNodes = [];

// LEAD SYNTHESISER
// Initial parameters
var oscOneMultiplier = 1,
  oscTwoMultiplier = 0.5;
var oscOneType = 'sine'; //sine waveform
var oscTwoType = 'sawtooth'; //sawtooth waveform
var filterCutoff = 4000;
var filterQ = 5;
var filterAttack = 0.01,
  filterDecay = 0.2,
  filterSustain = 0.3,
  filterRelease = 0.1; //initial envelope filter parameters
var ampAttack = 0.01,
  ampDecay = 0.1,
  ampSustain = 1.0,
  ampRelease = 0.1; //initial amplitude env parameters
var noteNumber = 0;

// BASS SYNTHESISER
// Initial parameters
var bassOscOneMultiplier = 1,
  bassOscTwoMultiplier = 0.5;
var bassOscOneType = 'square'; //square waveform
var bassOscTwoType = 'sawtooth'; //sawtooth waveform
var bassFilterCutoff = 4000;
var bassFilterQ = 5;
var bassAmpAttack = 0.01,
  bassAmpDecay = 0.3,
  bassAmpSustain = 0.3,
  bassAmpRelease = 0.2; //initial amplitude env parameters
var bassFilterAttack = 0.01,
  bassFilterDecay = 0.1,
  bassFilterSustain = 0.1,
  bassFilterRelease = 0.15; //initial envelope filter parameters

//CHORD SYNTHESISER
// Initial parameters
var chordOscOneMultiplier = 1,
  chordOscTwoMultiplier = 0.5;
var chordOscOneType = 'sawtooth'; //sawtooth waveform
var chordOscTwoType = 'sawtooth'; //sawtooth waveform
var chordFilterCutoff = 4000;
var chordFilterQ = 2;
var chordAmpAttack = 0.2,
  chordAmpDecay = 0.5,
  chordAmpSustain = 0.5,
  chordAmpRelease = 0.2; //initial amplitude env parameters
var chordFilterAttack = 0.2,
  chordFilterDecay = 0.5,
  chordFilterSustain = 0.5,
  chordFilterRelease = 0.15; //initial envelope filter parameters

//initial sequencer parameters
var phraseLength = 64;
var prevPitch = 493.883;
var currentPitch = 440;
var nextPitch;
var bPM = 100;
var noteLength = 0.15;
var noteStartTime;
var noteArray = []; //array to be filled with note sequence
var p = 0; //probability
var rhythmPreset = 'simple kick';
var arraySelect = 0;
var secondOrderArray;
var startTime; //time that the current bar was started
var noteObjectPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1];
var noteDensity = 1;
var noteRandomness = 1;
var bassNoteDensity = 3;
var bassPitches = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var bassDurations = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var drumRandomness = 0;

//create drum buffers
var source = null;
var samplesLoaded = 0;

var drumNames = ['kick', 'snare', 'hihat', 'clap', 'rimshot', 'cowbell'];

var drumBuffers = {
  kick: null,
  snare: null,
  hihat: null,
  clap: null,
  rimshot: null,
  cowbell: null
};

var drumGainNodes = {
  kick: null,
  snare: null,
  hihat: null,
  clap: null,
  rimshot: null,
  cowbell: null
};

//create tuna effects
var tuna = new Tuna(context);
var chorus, compressor;

var bassPatterns = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

var notePatterns = [
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], //1
  [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], //2
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0], //3
  [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], //4
  [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0], //5
  [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0], //6
  [0, 0, 1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0], //7
  [1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0], //8
  [1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], //9
  [1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0], //10
  [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1], //11
  [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1], //12
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0], //13
  [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1], //14
  [1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], //15
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] //16
];

var drumPatterns = {
  'simple kick': {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    rimshot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  rock: {
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    rimshot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  'funky drummer': {
    kick: [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 0, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    rimshot: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  'bossa nova': {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    rimshot: [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    cowbell: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  }
};

var drumPatternNames = ['simple kick', 'rock', 'funky drummer', 'bossa nova'];

function createAudioComponents() {
  //create new chorus effect node
  chorus = new tuna.Chorus({
    rate: 2,
    feedback: 0.5,
    delay: 0.0045,
    bypass: 0
  });
  chorus.connect(context.destination);

  //create new compressor effect node
  compressor = new tuna.Compressor({
    threshold: -20, //-100 to 0
    makeupGain: 0, //0 and up
    attack: 1, //0 to 1000
    release: 50, //0 to 3000
    ratio: 3, //1 to 20
    knee: 5, //0 to 40
    automakeup: false, //true/false
    bypass: 0
  });
  compressor.connect(context.destination);

  //create synthesiser modules
  for (var i = 0; i < 64; i++) {
    //create Gain Nodes
    gainNodes[i] = context.createGain();
    gainNodes[i].gain.value = 0;
    //create Low Pass Filter
    filters[i] = context.createBiquadFilter();
    filters[i].type = 'lowpass';
    //connect everything together
    filters[i].connect(gainNodes[i]);
    gainNodes[i].connect(chorus.input);
  }

  // create gain nodes
  for (var key in drumGainNodes) {
    if (drumGainNodes.hasOwnProperty(key)) {
      var gainNode = context.createGain();
      gainNode.gain.value = 0.7;
      gainNode.connect(compressor.input);

      drumGainNodes[key] = gainNode;
    }
  }
}

// play single note for purposes of testing sound
function playNote(pitch, duration) {
  now = context.currentTime;
  playSynth(
    pitch,
    now,
    duration,
    0.3,
    oscOneType,
    oscTwoType,
    oscOneMultiplier,
    oscTwoMultiplier,
    filterCutoff,
    filterQ,
    filterAttack,
    filterDecay,
    filterSustain,
    filterRelease,
    ampAttack,
    ampDecay,
    ampSustain,
    ampRelease
  );
}

// play drum sample at specified time
function playDrum(drum, time) {
  source = context.createBufferSource();
  source.buffer = drumBuffers[drum];
  source.loop = false;
  source.connect(drumGainNodes[drum]);
  source.start(time);
}

function generateNoteObjectPattern() {
  noteObjectPattern = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

  for (var i = 0; i < 16; i++) {
    var rand = Math.floor(Math.random() * 10);
    if (noteRandomness > rand) {
      noteObjectPattern[i] = notePatterns[rand + 6][i];
    } else {
      noteObjectPattern = notePatterns[noteDensity];
    }
  }

  //extend note durations
  for (var k = 0; k < 16; k++) {
    //If there's a note
    if (noteObjectPattern[k] == 1) {
      for (var j = 1; j < 16; j++) {
        //check the next item in the array to see if there's a note. If not, extend
        if (noteObjectPattern[k + j] === 0 && k + j < 16) {
          noteObjectPattern[k]++;
        } else {
          break;
        }
      }
    }
  }
  console.log(noteObjectPattern);
}

function initSound(arrayBuffer, sampleType) {
  context.decodeAudioData(
    arrayBuffer,
    function(buffer) {
      //audioBuffer is global to reuse the decoded audio later
      drumBuffers[sampleType] = buffer;
      samplesLoaded++;
      return;
    },
    function(e) {
      console.log('Error decoding file', e);
    }
  );
}

// Load file from a URL as an ArrayBuffer.
function loadSoundFile(url, sampleType) {
  var request = new XMLHttpRequest();
  request.open('GET', url, true);
  request.responseType = 'arraybuffer';
  request.onload = function(e) {
    initSound(this.response, sampleType); // this.response is an ArrayBuffer.
  };
  request.send();
}

/*
SYNTHESISER
The general purpose synthesiser is used for all synthesised sounds and takes 18 parameters
pitch is the fundamental pitch for the synth, time the start time and duration: the combined length of Attack, Decay and Sustain portions of the envelopes
ampGain is the gain for the gain node. osc1wf and osc2wf set the waveforms for each oscillator. osc1m and osc2m set the octave of each oscillator
cutoff and q are used to shape the filter response
fA, fD, fS, fR, aA, aD, aS, aR are the Attack, Decay, Sustain and Release values for each envelope
*/
function playSynth(
  pitch,
  time,
  duration,
  ampGain,
  osc1wf,
  osc2wf,
  osc1m,
  osc2m,
  cutoff,
  q,
  fA,
  fD,
  fS,
  fR,
  aA,
  aD,
  aS,
  aR
) {
  var filterDone = false;
  var ampDone = false;

  oscillators1[noteNumber] = context.createOscillator();
  oscillators2[noteNumber] = context.createOscillator();

  //assign oscillator parameters
  oscillators1[noteNumber].type = osc1wf;
  oscillators1[noteNumber].frequency.value = pitch * osc1m;
  oscillators2[noteNumber].type = osc2wf;
  oscillators2[noteNumber].frequency.value = pitch * osc2m;

  oscillators1[noteNumber].connect(filters[noteNumber]);
  oscillators2[noteNumber].connect(filters[noteNumber]);

  oscillators1[noteNumber].start(time);
  oscillators2[noteNumber].start(time);

  filters[noteNumber].Q.value = q;

  //FILTER ENVELOPE
  filters[noteNumber].frequency.setValueAtTime(
    filters[noteNumber].frequency.value,
    time
  );
  //Attack
  if (duration < fA) {
    var attackF = duration / fA;
    filters[noteNumber].frequency.linearRampToValueAtTime(
      cutoff * attackF,
      time + duration
    );
    filters[noteNumber].frequency.linearRampToValueAtTime(
      0,
      time + duration + 0.01
    ); //drop to 0 in 0.01 seconds to prevent click
    filterDone = 1;
  } else {
    filters[noteNumber].frequency.linearRampToValueAtTime(cutoff, time + fA);
  }
  //Decay
  if (duration < fA + fD && filterDone === false) {
    var decayF = (duration - fA) / fD;
    filters[noteNumber].frequency.linearRampToValueAtTime(
      cutoff * decayF,
      time + duration
    );
  } else if (filterDone === false) {
    filters[noteNumber].frequency.linearRampToValueAtTime(
      cutoff * fS,
      time + (fA + fD)
    );
  }
  //Sustain
  if (duration > fA + fD) {
    filters[noteNumber].frequency.linearRampToValueAtTime(
      cutoff * fS,
      time + duration
    );
  }
  //Release
  if (filterDone === false) {
    filters[noteNumber].frequency.linearRampToValueAtTime(
      0,
      time + (duration + fR)
    );
  }

  //AMPLITUDE ENVELOPE
  gainNodes[noteNumber].gain.setValueAtTime(
    gainNodes[noteNumber].gain.value,
    time
  );
  //Attack
  if (duration < aA) {
    var attackA = duration / aA;
    gainNodes[noteNumber].gain.linearRampToValueAtTime(
      ampGain * attackA,
      time + duration
    );
    gainNodes[noteNumber].gain.linearRampToValueAtTime(
      0.0,
      time + duration + 0.01
    ); //drop to 0 in 0.01 seconds to prevent click
    ampDone = true;
  } else {
    gainNodes[noteNumber].gain.linearRampToValueAtTime(ampGain, time + aA);
  }
  //Decay
  if (duration < aA + aD && ampDone === false) {
    var decayA = (duration - aA) / aD;
    gainNodes[noteNumber].gain.linearRampToValueAtTime(
      ampGain * aS,
      time + (time + duration)
    );
  } else if (ampDone === false) {
    gainNodes[noteNumber].gain.linearRampToValueAtTime(
      ampGain * aS,
      time + (aA + aD)
    );
  }
  //Sustain
  if (duration > aA + aD) {
    gainNodes[noteNumber].gain.linearRampToValueAtTime(
      ampGain * aS,
      time + duration
    );
  }
  //Release
  if (ampDone === false) {
    gainNodes[noteNumber].gain.linearRampToValueAtTime(
      ampGain,
      time + (duration + aR)
    );
  }

  //stop oscillators when note is over. Choose whether to stop when amplitude envelope or filter envelope is finished based on which has the longer duration
  if (aA + aD + aR > fA + fD + fR) {
    oscillators1[noteNumber].stop(time + duration + aR);
    oscillators2[noteNumber].stop(time + duration + aR);
  } else {
    oscillators1[noteNumber].stop(time + duration + fR);
    oscillators2[noteNumber].stop(time + duration + fR);
  }
  if (noteNumber < 63) {
    noteNumber++;
  } else {
    noteNumber = 0;
  }
}

function setNotesArray() {
  arraySelect = parseInt(document.getElementById('markovChain').value);

  switch (arraySelect) {
    case 0:
      secondOrderArray = satieSecondOrderArray;
      break;
    case 1:
      secondOrderArray = mozartSecondOrderArray;
      break;
    case 2:
      secondOrderArray = straussSecondOrderArray;
      break;
    case 3:
      secondOrderArray = griegSecondOrderArray;
      break;
  }

  //pick a row randomly from the chosen array
  var rand = parseInt(Math.random() * (secondOrderArray.length - 1)) + 1;

  //pick starting notes from the array
  prevPitch = secondOrderArray[rand][0];
  currentPitch = secondOrderArray[rand][1];

  //clear noteArray contents
  noteArray.length = 0;
}

//fill noteArray with generated notes
function generateMelody() {
  for (var y = 0; y < phraseLength; y++) {
    //generate a note
    makeNotesSecondOrder();
    //add to end of noteArray
    noteArray.push(nextPitch);
    //move current pitch and next pitch to previous pitch and current pitch respectively
    prevPitch = currentPitch;
    currentPitch = nextPitch;
  }
  console.log('Notes generated');
}

function generateBassLine() {
  for (var i = 0; i < 16; i++) {
    //pick random pitches from the markov array
    bassPitches[i] =
      secondOrderArray[
        Math.floor(Math.random() * (secondOrderArray.length - 1))
      ][0];
    //choose rhythm based on bassNoteDensity
    if (bassNoteDensity > 0 && bassNoteDensity < 5) {
      var randomNumber = bassNoteDensity + Math.floor(Math.random() * 3) - 1;
      bassDurations[i] = bassPatterns[randomNumber][i];
    } else {
      bassDurations[i] = bassPatterns[bassNoteDensity][i];
    }
  }
}

//function to quantise note start times to semiquaver grid
function playNextNote(duration, pitch, type) {
  console.log('duration = ' + duration + '. pitch = ' + pitch);
  var collisionTime = context.currentTime;
  for (var x = 0; x < 16; x++) {
    var semiquaverStart = x * noteLength + startTime;
    if (
      semiquaverStart - 0.5 * noteLength < collisionTime &&
      collisionTime < semiquaverStart
    ) {
      noteStartTime = semiquaverStart;
      break;
    } else if (
      semiquaverStart < collisionTime &&
      collisionTime < semiquaverStart + 0.1 * noteLength
    ) {
      noteStartTime = context.currentTime;
    } else {
      noteStartTime = context.currentTime;
    }
  }

  //type 0 is the lead synthesiser
  if (type === 0) {
    playSynth(
      pitch,
      noteStartTime,
      noteLength * duration,
      0.25,
      oscOneType,
      oscTwoType,
      oscOneMultiplier,
      oscTwoMultiplier,
      filterCutoff,
      filterQ,
      filterAttack,
      filterDecay,
      filterSustain,
      filterRelease,
      ampAttack,
      ampDecay,
      ampSustain,
      ampRelease
    );
  }
  //type 1 is the chord synthesiser (synth pad)
  else if (type == 1) {
    playSynth(
      pitch,
      noteStartTime,
      noteLength * duration,
      0.06,
      chordOscOneType,
      chordOscTwoType,
      chordOscOneMultiplier,
      chordOscTwoMultiplier,
      chordFilterCutoff,
      chordFilterQ,
      chordFilterAttack,
      chordFilterDecay,
      chordFilterSustain,
      chordFilterRelease,
      chordAmpAttack,
      chordAmpDecay,
      chordAmpSustain,
      chordAmpRelease
    );
  }
}

//play drums and bass line
function playRhythm(startTime) {
  for (var i = 0; i < 16; i++) {
    var r = Math.random() * 10;
    var rhythmChoice;

    if (drumRandomness > r) {
      // Pick from a random pattern
      rhythmChoice =
        drumPatternNames[Math.floor(Math.random() * drumPatternNames.length)];
    } else {
      // Pick from the rhythm preset
      rhythmChoice = rhythmPreset;
    }

    // For each drum, schedule a note if that item contains a note
    for (var j = 0; j < drumNames.length; j++) {
      if (drumPatterns[rhythmChoice][drumNames[j]][i] == 1) {
        playDrum(drumNames[j], startTime + i * noteLength);
      }
    }

    if (bassDurations[i] > 0) {
      playSynth(
        bassPitches[i] * 0.25,
        startTime + i * noteLength,
        noteLength,
        0.25,
        bassOscOneType,
        bassOscTwoType,
        bassOscOneMultiplier,
        bassOscTwoMultiplier,
        bassFilterCutoff,
        bassFilterQ,
        bassFilterAttack,
        bassFilterDecay,
        bassFilterSustain,
        bassFilterRelease,
        bassAmpAttack,
        bassAmpDecay,
        bassAmpSustain,
        bassAmpRelease
      );
    }
  }
}

//generate new note from markov chain
function makeNotesSecondOrder() {
  //generate a random float between 0 and 1
  var rand = Math.random();
  for (var x = 0; x < secondOrderArray.length - 1; x++) {
    if (
      prevPitch == secondOrderArray[x + 1][0] &&
      currentPitch == secondOrderArray[x + 1][1]
    ) {
      for (var y = 0; y < 100; y++) {
        p += secondOrderArray[x + 1][y + 2];
        if (p >= rand) {
          nextPitch = secondOrderArray[0][y + 2];
          p = 0;
          break;
        }
      }
    }
  }
}

/* ---- OPTIONS ---- */

//connect NexusUI Elements
// nx.onload = function() {
// 	nx.sendsTo("js");
// 	nx.colorize("#4400FF"); // sets accent

// 	//assign variables
// 	var singleNotePitchControl = dial1;
// 	var singleNoteDurationControl = dial2;
// 	var filterCutoffControl = dial3;
// 	var filterQControl = dial4;
// 	var filterAttackControl = dial5;
// 	var filterDecayControl = dial6;
// 	var filterSustainControl = dial7;
// 	var filterReleaseControl = dial8;
// 	var ampAttackControl = dial9;
// 	var ampDecayControl = dial10;
// 	var ampSustainControl = dial11;
// 	var ampReleaseControl = dial12;

// 	//get values
// 	button1.mode = "impulse";
// 	filterCutoffControl.val = filterCutoff / 5000;
// 	filterCutoffControl.draw();
// 	filterQControl.val = filterQ / 50;
// 	filterQControl.draw();

// 	filterAttackControl.val = filterAttack;
// 	filterAttackControl.draw();
// 	filterDecayControl.val = filterDecay;
// 	filterDecayControl.draw();
// 	filterSustainControl.val = filterSustain;
// 	filterSustainControl.draw();
// 	filterReleaseControl.val = filterRelease;
// 	filterReleaseControl.draw();

// 	ampAttackControl.val = ampAttack;
// 	ampAttackControl.draw();
// 	ampDecayControl.val = ampDecay;
// 	ampDecayControl.draw();
// 	ampSustainControl.val = ampSustain;
// 	ampSustainControl.draw();
// 	ampReleaseControl.val = ampRelease;
// 	ampReleaseControl.draw();

//   	// set individual receivers
//   	button1.response = function() {
//   		playNote(singleNotePitchControl.val * 5000, singleNoteDurationControl.val * 5);
//   	};
//   	filterCutoffControl.response = function(data) {
//     	filterCutoff = data * 5000;
//  	};
//  	filterQControl.response = function(data) {
//     	filterQ = data * 50;
//  	};
//   	filterAttackControl.response = function(data) {
//     	filterAttack = data;
//  	};
//  	filterDecayControl.response = function(data) {
//     	filterDecay = data;
//  	};
//  	filterSustainControl.response = function(data) {
//     	filterSustain = data;
//  	};
//  	filterReleaseControl.response = function(data) {
//     	filterRelease = data;
//  	};
//  	ampAttackControl.response = function(data) {
//     	ampAttack = data;
//  	};
//  	ampDecayControl.response = function(data) {
//     	ampDecay = data;
//  	};
//  	ampSustainControl.response = function(data) {
//     	ampSustain = data;
//  	};
//  	ampReleaseControl.response = function(data) {
//     	ampRelease = data;
//  	};

//  	//hide options div after NexusUI objects loaded
//  	document.getElementById('gameoptions').style.display="none";
// };

//update values when parameters are changed by the user
function updateParameters() {
  antialiasing = document.getElementById('antialiasing').value;
  showText = document.getElementById('showtext').value;
  numberOfZones = document.getElementById('zonesnum').value;
  statsDisplay = document.getElementById('stats').value;

  rhythmPreset = parseInt(document.getElementById('drumRhythm').value);
  bPM = parseFloat(document.getElementById('BPM').value);
  noteLength = 15 / bPM;

  oscOneMultiplier = parseFloat(
    document.getElementById('oscillator1Transpose').value
  );
  oscTwoMultiplier = parseFloat(
    document.getElementById('oscillator2Transpose').value
  );

  oscOneType = document.getElementById('oscOneWaveform').value;
  oscTwoType = document.getElementById('oscTwoWaveform').value;
}

//set up camera, scene, renderer
var thirdPersonCamera, scene, renderer;
var geometry, material, mesh, light;
//geometry variables
var drumGeometry, cutoffGeometry, envelopeGeometry, noteDensityGeometry;
var planeGeometry1, planeGeometry2, planeGeometry3;
// lights
var directionalLight;
var ambientLight;
//stats object
var render_stats;
var chunksRendered = 0;
var lane = 0;
var delta;
var clock = new THREE.Clock();
var score = 0;
var scoreThisLevel = 0;
var maxScoreThisLevel = 0;
var scorePercentage;
var parametersVisible = false;
var antialiasing = false;
var showText = true;
var noteArrayPosition = 0;
var shipColour = [0xe80c76, 0x4400ff, 0x00a8e8, 0x00ff3d, 0xff6700];
var backgroundColour = [0x331400, 0x1c010f, 0x0d0033, 0x00141c, 0x00330c];
var zoneNo = 0;
var numberOfZones = 10;
var statsDisplay = 0;

//text materials
var materialFront = new THREE.MeshBasicMaterial({ color: 0x00a8e8 });
var materialSide = new THREE.MeshBasicMaterial({ color: 0xe80c76 });
var materialArray = [materialFront, materialSide];
var textMaterial = new THREE.MeshFaceMaterial(materialArray);

//meshes
var ship;
var textMesh;
var pitchMesh;
var drumMesh;
var cutoffMesh;
var attackMesh;
var envelopeMesh;
var noteDensityMesh;
var chordMesh = [];
var leftPlaneMesh = [];
var rightPlaneMesh = [];
var groundMesh = [];

var leftPressed = false,
  upPressed = false,
  rightPressed = false,
  downPressed = false;

var movementPerFrame;
var shapes = []; //new array to be filled with Icosahedrons
var shapesArrayPosition = 0,
  chordsArrayPosition = 0;

var font;

//check for key down events
document.onkeydown = function() {
  switch (window.event.keyCode) {
    case 37: //left arrow
      leftPressed = true;
      break;
    case 38: //up arrow
      upPressed = true;
      break;
    case 39: //right arrow
      rightPressed = true;
      break;
    case 40: //down arrow
      downPressed = true;
      break;
    case 65: //A
      if (noteDensity < 15) {
        noteDensity++;
      } else {
        noteDensity = 0;
      }
  }
};

//check for key up events
document.onkeyup = function() {
  switch (window.event.keyCode) {
    case 37:
      leftPressed = false;
      break;
    case 38:
      upPressed = false;
      break;
    case 39:
      rightPressed = false;
      break;
    case 40:
      downPressed = false;
      break;
  }
};

//called when screen is pressed
function screenPressed(direction) {
  console.log('press detected');
  switch (direction) {
    case 'Left': //left arrow
      leftPressed = true;
      break;
    case 'Up': //up arrow
      upPressed = true;
      break;
    case 'Right': //right arrow
      rightPressed = true;
      break;
    case 'Down': //down arrow
      downPressed = true;
      break;
  }
}

function screenReleased(direction) {
  console.log('release detected');
  switch (direction) {
    case 'Left': //left arrow
      leftPressed = false;
      break;
    case 'Up': //up arrow
      upPressed = false;
      break;
    case 'Right': //right arrow
      rightPressed = false;
      break;
    case 'Down': //down arrow
      downPressed = false;
      break;
  }
}

//initialise the scene. Add the cameras, lights and import ship model
function init() {
  //hide menu, display game
  document.getElementById('container').style.display = 'none';
  document.getElementById('full-width-image').style.display = 'none';
  document.getElementById('viewport').style.display = 'inline';
  document.getElementById('score').style.display = 'inline';
  document.getElementById('status').style.display = 'inline';
  document.getElementById('touchup').style.display = 'inline';
  document.getElementById('touchleft').style.display = 'inline';
  document.getElementById('touchright').style.display = 'inline';
  document.getElementById('touchdown').style.display = 'inline';
  document.getElementById('status').innerHTML = 'Tempo: ' + bPM;

  document.getElementById('tonewarp-html').style.background = 'black';

  //create new WebGl renderer
  renderer = new THREE.WebGLRenderer({ antialias: antialiasing });
  renderer.setSize(window.innerWidth, window.innerHeight - 40);
  document.getElementById('viewport').appendChild(renderer.domElement);

  font = new THREE.Font( fontJson );

  //display stats
  if (statsDisplay) {
    render_stats = new Stats();
    render_stats.setMode(0);
    render_stats.domElement.style.position = 'absolute';
    render_stats.domElement.style.top = '1px';
    render_stats.domElement.style.right = '1px';
    render_stats.domElement.style.zIndex = 100;
    document.getElementById('viewport').appendChild(render_stats.domElement);
  }

  //create the camera, move slightly up and backward from origin. Rotate downwards
  thirdPersonCamera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / (window.innerHeight - 40),
    1,
    10000
  );
  thirdPersonCamera.position.y = 150;
  thirdPersonCamera.position.z = 100;
  thirdPersonCamera.rotation.x = -0.03 * Math.PI;

  scene = new THREE.Scene();

  //create the materials
  var material = new THREE.MeshLambertMaterial({
    color: 0x00a8e8,
    wireframe: false,
    vertexColors: THREE.FaceColors,
    ambient: 0x00a8e8,
    emissive: 0x00a8e8,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.4
  });
  var planeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true
  });
  var groundMaterial = new THREE.MeshBasicMaterial({
    color: 0xe80c76,
    wireframe: true
  });
  var shipMaterial = new THREE.MeshLambertMaterial({
    color: 0xff6700,
    wireframe: false,
    emissive: 0xff6700,
    shading: THREE.FlatShading
  });
  var chordMaterial = new THREE.MeshLambertMaterial({
    color: 0xff0000,
    wireframe: false,
    emissive: 0xff6700,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.3
  });
  var drumMaterial = new THREE.MeshLambertMaterial({
    color: 0x4400ff,
    wireframe: false,
    emissive: 0x4400ff,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.8
  });
  var cutoffMaterial = new THREE.MeshLambertMaterial({
    color: 0x4400ff,
    wireframe: false,
    emissive: 0x00ff3d,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.6
  });
  var envelopeMaterial = new THREE.MeshLambertMaterial({
    color: 0xe80c76,
    wireframe: false,
    emissive: 0xe80c76,
    shading: THREE.FlatShading,
    transparent: true,
    opacity: 0.6
  });

  //add lights to the scene

  directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(0, 150, 0);
  scene.add(directionalLight);

  ambientLight = new THREE.AmbientLight(shipColour[4]);
  scene.add(ambientLight);

  //ADD DRUM CHANGE OBJECT TO SCENE
  //as only one will ever be visible a time we only need to create one
  drumGeometry = new THREE.SphereGeometry(150);
  drumMesh = new THREE.Mesh(drumGeometry, drumMaterial);
  //move out of the way
  drumMesh.position.x = 10000;
  scene.add(drumMesh);

  //ADD CUTOFF CHANGE OBJECT TO SCENE
  cutoffGeometry = new THREE.SphereGeometry(150);
  cutoffMesh = new THREE.Mesh(cutoffGeometry, cutoffMaterial);
  //move out of the way
  cutoffMesh.position.x = 10000;
  scene.add(cutoffMesh);

  //ADD ENVELOPE CHANGE OBJECT TO SCENE
  envelopeGeometry = new THREE.SphereGeometry(150);
  envelopeMesh = new THREE.Mesh(envelopeGeometry, envelopeMaterial);
  //move out of the way
  envelopeMesh.position.x = 10000;
  scene.add(envelopeMesh);

  //ADD NOTE DENSITY CHANGE OBJECT TO SCENE
  noteDensityGeometry = new THREE.SphereGeometry(150);
  noteDensityMesh = new THREE.Mesh(noteDensityGeometry, material);
  //move out of the way
  noteDensityMesh.position.x = 10000;
  scene.add(noteDensityMesh);

  //CREATE NOTE OBJECTS
  for (var i = 0; i < 32; i++) {
    geometry = new THREE.IcosahedronGeometry(100, 0);
    mesh = new THREE.Mesh(geometry, material);
    shapes[i] = mesh;
    scene.add(shapes[i]);
    shapes[i].position.x = 10000;
  }

  //CREATE CHORD OBJECTS
  for (var j = 0; j < 6; j++) {
    geometry = new THREE.IcosahedronGeometry(50, 0);
    mesh = new THREE.Mesh(geometry, chordMaterial);
    chordMesh[j] = mesh;
    scene.add(chordMesh[j]);
    shapes[j].position.x = 10000;
  }

  //CREATE PLANES
  for (var k = 0; k < 2; k++) {
    planeGeometry1 = new THREE.PlaneGeometry(8000, 10000, 8, 8);
    leftPlaneMesh[k] = new THREE.Mesh(planeGeometry1, planeMaterial);
    scene.add(leftPlaneMesh[k]);
    leftPlaneMesh[k].rotation.y = 0.5 * Math.PI; //90 degrees
    leftPlaneMesh[k].position.x = -2000;

    planeGeometry2 = new THREE.PlaneGeometry(8000, 10000, 8, 8);
    rightPlaneMesh[k] = new THREE.Mesh(planeGeometry2, planeMaterial);
    scene.add(rightPlaneMesh[k]);
    rightPlaneMesh[k].rotation.y = 0.5 * Math.PI; //90 degrees
    rightPlaneMesh[k].position.x = 2000;

    planeGeometry3 = new THREE.PlaneGeometry(8000, 4000, 16, 16);
    groundMesh[k] = new THREE.Mesh(planeGeometry3, groundMaterial);
    groundMesh[k].rotation.z = 0.5 * Math.PI;
    groundMesh[k].rotation.x = 0.5 * Math.PI;
    groundMesh[k].position.y = -1000;
  }

  //generate the first chunk
  newChunk(0);

  //create fog
  scene.fog = new THREE.FogExp2(0x000000, 0.00025);

  //Load in the ship mesh and add it to the scene.
  var loader = new THREE.LegacyJSONLoader();
  // console.log(shipModel);
  let { geometry } = loader.parse(shipModel)
  ship = new THREE.Mesh(geometry, shipMaterial);
  ship.position.z = 0;
  ship.position.y = 75;
  ship.scale.set(2, 2, 2);
  scene.add(ship);
  // This used to be wrapped in an onLoadComplete() but that no longer exists
  alert('Game loaded. Press OK to play.');
  animate();
}

function newChunk(chunkNo) {
  if (chunkNo > 1) {
    playRhythm(context.currentTime);
  }

  //calculate movement per frame based on tempo
  movementPerFrame = 8000 / (noteLength * 16);

  //move planes
  leftPlaneMesh[chunkNo % 2].position.z = -8000 * chunkNo - 4000;
  rightPlaneMesh[chunkNo % 2].position.z = -8000 * chunkNo - 4000;
  groundMesh[chunkNo % 2].position.z = -8000 * chunkNo - 4000;

  //randomise the location of the vertices for the groundMesh
  for (var i = 0; i < groundMesh[chunkNo % 2].geometry.vertices.length; i++) {
    if (
      groundMesh[chunkNo % 2].geometry.vertices[i].y < 2000 &&
      groundMesh[chunkNo % 2].geometry.vertices[i].y > -2000
    ) {
      groundMesh[chunkNo % 2].geometry.vertices[i].z += Math.floor(
        Math.random() * 400 - 200
      );
    }
  }

  scene.add(groundMesh[chunkNo % 2]);

  //called when generating the first chunk in a zone
  if (chunkNo % 10 == 2 && chunkNo < numberOfZones * 10 + 2) {
    setNotesArray();
    generateMelody();
    zoneNo++;
    //add text displaying zone number
    if (showText === true) {
      var textGeom = new THREE.TextGeometry(
        'ZONE ' + zoneNo + '/ ' + numberOfZones,
        {
          size: 300,
          height: 4,
          curveSegments: 3,
          font: font,
          weight: 'normal',
          style: 'normal',
          material: 0,
          extrudeMaterial: 1
        }
      );
      //use bounding box to find width
      textGeom.computeBoundingBox();
      var textWidth = textGeom.boundingBox.max.x - textGeom.boundingBox.min.x;

      textMesh = new THREE.Mesh(textGeom, textMaterial);
      //centre the text
      textMesh.position.set(-0.5 * textWidth, 0, chunkNo * -8000);
      scene.add(textMesh);
    }
    setTimeout(function() {
      generateBassLine();
    }, 200);
  }

  //when entering new zone, change colours of ship, ambient lighting, renderer background and fog
  if (chunkNo % 10 == 3 && numberOfZones * 10 + 4) {
    ship.material.emissive.setHex(shipColour[zoneNo % 5]);
    ambientLight.color.setHex(shipColour[zoneNo % 5]);
    renderer.setClearColor(backgroundColour[zoneNo % 5], 1);
    scene.fog.color.setHex(backgroundColour[zoneNo % 5]);
  }

  //reset to the beginning of the note array every 4 bars
  if (chunkNo % 10 == 2 || chunkNo % 10 == 6) {
    noteArrayPosition = 0;
    console.log('array reset');
  }

  generateNoteObjectPattern();

  //create note and chord objects only in the first 8 bars of the level
  if (chunkNo % 10 > 1 && chunkNo < numberOfZones * 10 + 2) {
    //CREATE CHORD OBJECTS
    var chordRoot = noteArray[noteArrayPosition];
    var major = 0;
    var minor = 0;
    if (chordRoot > 1000) {
      chordRoot = chordRoot * 0.5;
    }

    for (var i = 0; i < 3; i++) {
      chordMesh[chordsArrayPosition + i].scale.x = 5;
      chordMesh[chordsArrayPosition + i].scale.y = 5;
      chordMesh[chordsArrayPosition + i].scale.z = 5;
      chordMesh[chordsArrayPosition + i].position.z = -8000 * chunkNo - 50;
    }
    chordMesh[chordsArrayPosition].position.y = 0.5 * chordRoot;
    chordMesh[chordsArrayPosition].position.x = -800;

    for (i = 0; i < secondOrderArray.length - 1; i++) {
      //count if major third is in secondOrderArray
      if (
        secondOrderArray[i][0] < chordRoot * 1.2599 + 1 &&
        secondOrderArray[i][0] > chordRoot * 1.2599 - 1
      ) {
        major++;
      }
      //count if minor third is in secondOrderArray
      else if (
        secondOrderArray[i][0] < chordRoot * 1.189 + 1 &&
        secondOrderArray[i][0] > chordRoot * 1.189 - 1
      ) {
        minor++;
      }
    }
    if (major > minor) {
      chordMesh[chordsArrayPosition + 1].position.y =
        0.5 * (chordRoot * 1.2599);
    } else if (minor > major) {
      chordMesh[chordsArrayPosition + 1].position.y = 0.5 * (chordRoot * 1.189);
    }

    chordMesh[chordsArrayPosition + 1].position.x = 0;
    chordMesh[chordsArrayPosition + 2].position.y = 0.5 * (chordRoot * 1.5);
    chordMesh[chordsArrayPosition + 2].position.x = 800;

    if (chordsArrayPosition == 3) {
      chordsArrayPosition = 0;
    } else {
      chordsArrayPosition = 3;
    }
    //CREATE NOTE OBJECTS
    var randomLane = Math.floor(Math.random() * 3 - 1);
    for (var i = 0; i < 16; ++i) {
      if (noteObjectPattern[i] > 0 && chunkNo > 1) {
        shapes[shapesArrayPosition].scale.x = 1 + 0.25 * noteObjectPattern[i];
        shapes[shapesArrayPosition].scale.y = 1 + 0.25 * noteObjectPattern[i];
        shapes[shapesArrayPosition].scale.z = 1 + 0.25 * noteObjectPattern[i];
        shapes[shapesArrayPosition].position.z =
          -500 * i - 8000 * chunkNo - 100;

        shapes[shapesArrayPosition].position.y =
          0.5 * noteArray[noteArrayPosition];
        shapes[shapesArrayPosition].position.x = randomLane * 800;
        noteArrayPosition++;
        maxScoreThisLevel += noteObjectPattern[i] * 100;

        if (shapesArrayPosition < 31) {
          shapesArrayPosition++;
        } else {
          shapesArrayPosition = 0;
        }
      }
    }
  }

  //CALCULATE SCORE, SET LOCATIONS OF PARAMETER CHANGE OBJECTS
  if (chunkNo % 10 == 1 && chunkNo > 1) {
    scorePercentage = (scoreThisLevel / maxScoreThisLevel) * 100;
    console.log('score percentage=' + scorePercentage);
    scoreThisLevel = 0;
    maxScoreThisLevel = 0;
    //place drumMesh
    drumMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
    drumMesh.position.y = Math.random() * 1000 - 500;
    drumMesh.position.z = chunkNo * -8000 + Math.random() * 8000 - 8000;
    //place cutoffMesh
    cutoffMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
    cutoffMesh.position.y = Math.random() * 1000 + 200;
    cutoffMesh.position.z = chunkNo * -8000 + Math.random() * 8000 - 8000;
    //place envelopeMesh
    envelopeMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
    envelopeMesh.position.y = Math.random() * 1000 + 200;
    envelopeMesh.position.z = chunkNo * -8000 + Math.random() * 8000 - 8000;
    //place noteDensityMesh
    noteDensityMesh.position.x = Math.floor(Math.random() * 3) * 800 - 800;
    noteDensityMesh.position.y = Math.random() * 1000 + 200;
    noteDensityMesh.position.z = chunkNo * -8000 + Math.random() * 8000 - 8000;
    //change tempo based on score this zone
    if (scorePercentage > 85 && bPM < 130) {
      bPM += 2;
      noteLength = 15 / bPM;
      document.getElementById('status').innerHTML = 'Boosting Tempo';
      document.getElementById('status').style.color = '#00FF3D';
      setTimeout(function() {
        document.getElementById('status').innerHTML = 'Tempo: ' + bPM;
        document.getElementById('status').style.color = 'white';
      }, 3000);
    } else if (scorePercentage < 40 && bPM > 70) {
      bPM -= 2;
      noteLength = 15 / bPM;
      document.getElementById('status').innerHTML = 'Tempo Dropping';
      document.getElementById('status').style.color = '#4400FF';
      setTimeout(function() {
        document.getElementById('status').innerHTML = 'Tempo: ' + bPM;
        document.getElementById('status').style.color = 'white';
      }, 3000);
    }
  }

  chunksRendered++;
  console.log('chunks rendered: ' + chunksRendered);
}

var animate = function() {
  delta = clock.getDelta();

  requestAnimationFrame(animate);

  //move camera and ship
  thirdPersonCamera.position.z -= movementPerFrame * delta;
  ship.position.z -= movementPerFrame * delta;

  //check for collision with drum objects
  if (
    drumMesh.position.x - 150 < ship.position.x &&
    ship.position.x < drumMesh.position.x + 150 &&
    drumMesh.position.y - 150 < ship.position.y &&
    ship.position.y < drumMesh.position.y + 150 &&
    drumMesh.position.z - 150 < ship.position.z &&
    ship.position.z < drumMesh.position.z + 150
  ) {
    rhythmPreset =
      drumPatternNames[Math.floor(Math.random() * drumPatternNames.length)];
    //change drumRandomness
    drumRandomness += Math.floor(Math.random() * 5) - 1;
    drumMesh.position.x = 10000;
  }

  drumMesh.rotation.x = Date.now() * 0.001;
  drumMesh.rotation.y = Date.now() * 0.001;

  //check for collision with cutoff objects
  if (
    cutoffMesh.position.x - 150 < ship.position.x &&
    ship.position.x < cutoffMesh.position.x + 150 &&
    cutoffMesh.position.y - 150 < ship.position.y &&
    ship.position.y < cutoffMesh.position.y + 150 &&
    cutoffMesh.position.z - 150 < ship.position.z &&
    ship.position.z < cutoffMesh.position.z + 150
  ) {
    filterCutoff = cutoffMesh.position.y * 5;
    filterQ = Math.random() * 10;
    cutoffMesh.position.x = 10000;
  }

  cutoffMesh.rotation.x = Date.now() * 0.001;
  cutoffMesh.rotation.y = Date.now() * 0.001;

  //check for collision with note density objects
  if (
    noteDensityMesh.position.x - 150 < ship.position.x &&
    ship.position.x < noteDensityMesh.position.x + 150 &&
    noteDensityMesh.position.y - 150 < ship.position.y &&
    ship.position.y < noteDensityMesh.position.y + 150 &&
    noteDensityMesh.position.z - 150 < ship.position.z &&
    ship.position.z < noteDensityMesh.position.z + 150
  ) {
    noteDensityMesh.position.x = 10000;
    noteDensity++;
    //change noteRandomness
    noteRandomness += Math.floor(Math.random() * 5) - 1;
  }

  noteDensityMesh.rotation.x = Date.now() * 0.001;
  noteDensityMesh.rotation.y = Date.now() * 0.001;

  //check for collision with envelope objects
  if (
    envelopeMesh.position.x - 150 < ship.position.x &&
    ship.position.x < envelopeMesh.position.x + 150 &&
    envelopeMesh.position.y - 150 < ship.position.y &&
    ship.position.y < envelopeMesh.position.y + 150 &&
    envelopeMesh.position.z - 150 < ship.position.z &&
    ship.position.z < envelopeMesh.position.z + 150
  ) {
    //randomise values for filters
    filterAttack = Math.random() * 0.3;
    filterDecay = Math.random();
    filterSustain = Math.random();
    filterRelease = Math.random();
    ampAttack = Math.random() * 0.3;
    ampDecay = Math.random();
    ampSustain = Math.random();
    ampRelease = Math.random() * 0.3;
    chordFilterAttack = Math.random();
    chordFilterRelease = Math.random();
    chordFilterSustain = Math.random();
    chordFilterRelease = Math.random();
    chordAmpAttack = Math.random();
    chordAmpDecay = Math.random();
    chordAmpSustain = Math.random();
    chordAmpRelease = Math.random() * 0.5;
    envelopeMesh.position.x = 10000;
  }

  envelopeMesh.rotation.x = Date.now() * 0.001;
  envelopeMesh.rotation.y = Date.now() * 0.001;

  // Check for collision with note objects
  for (var i = 0; i < 32; i++) {
    shapes[i].rotation.z = Date.now() * 0.0008;
    shapes[i].rotation.x = Date.now() * 0.0005;

    if (
      shapes[i].position.x - 100 * shapes[i].scale.x < ship.position.x &&
      ship.position.x < shapes[i].position.x + 100 * shapes[i].scale.x &&
      shapes[i].position.y - 100 * shapes[i].scale.y < ship.position.y &&
      ship.position.y < shapes[i].position.y + 100 * shapes[i].scale.y &&
      shapes[i].position.z - 100 < ship.position.z &&
      ship.position.z < shapes[i].position.z + 100
    ) {
      // Play next note. Get duration from scale of object. Get pitch from y position
      playNextNote((shapes[i].scale.x - 1) * 4, shapes[i].position.y * 2, 0);
      // Move shape out of the way to prevent further collisions
      shapes[i].position.x = 10000;
      // Set wall colour to random hex colour
      rightPlaneMesh[0].material.color.setHex(
        '0x' + Math.floor(Math.random() * 16777215).toString(16)
      );
      // Increment score based on note scale
      score += 100 * (shapes[i].scale.x - 1) * 4;
      scoreThisLevel += 100 * (shapes[i].scale.x - 1) * 4;
      // Update score display
      document.getElementById('score').innerHTML = 'score:' + score;

      break;
    }
  }

  // Check for collision with chord objects
  for (var i = 0; i < 6; i++) {
    chordMesh[i].rotation.z = Date.now() * -0.0008;
    chordMesh[i].rotation.x = Date.now() * -0.0005;

    if (
      chordMesh[i].position.x - 50 * chordMesh[i].scale.x < ship.position.x &&
      ship.position.x < chordMesh[i].position.x + 50 * chordMesh[i].scale.x &&
      chordMesh[i].position.y - 50 * chordMesh[i].scale.y < ship.position.y &&
      ship.position.y < chordMesh[i].position.y + 50 * chordMesh[i].scale.y &&
      chordMesh[i].position.z - 50 < ship.position.z &&
      ship.position.z < chordMesh[i].position.z + 50
    ) {
      // Play next note. Get duration from scale of object. Get pitch from y position
      // move shape out of the way to prevent further collisions
      if (i < 3) {
        chordMesh[0].position.x = 10000;
        chordMesh[2].position.x = 10000;
        chordMesh[1].position.x = 10000;
        playNextNote(
          (chordMesh[0].scale.x - 1) * 4,
          chordMesh[0].position.y * 2,
          1
        );
        playNextNote(
          (chordMesh[1].scale.x - 1) * 4,
          chordMesh[1].position.y * 2,
          1
        );
        playNextNote(
          (chordMesh[2].scale.x - 1) * 4,
          chordMesh[2].position.y * 2,
          1
        );
      } else if (i > 2) {
        chordMesh[3].position.x = 10000;
        chordMesh[4].position.x = 10000;
        chordMesh[5].position.x = 10000;
        playNextNote(
          (chordMesh[3].scale.x - 1) * 4,
          chordMesh[3].position.y * 2,
          1
        );
        playNextNote(
          (chordMesh[4].scale.x - 1) * 4,
          chordMesh[4].position.y * 2,
          1
        );
        playNextNote(
          (chordMesh[5].scale.x - 1) * 4,
          chordMesh[5].position.y * 2,
          1
        );
      }

      break;
    }
  }

  if (ship.position.z < 8000 - 8000 * chunksRendered) {
    newChunk(chunksRendered);
  } else if (chunksRendered == numberOfZones * 10 + 3) {
    document.getElementById('completion').style.display = 'block';
    document.getElementById('finalscore').innerHTML = 'Final Score: ' + score;
    document.getElementById('finaltempo').innerHTML = 'Final Tempo: ' + bPM;
  }

  // Switch lanes when left and right are pressed
  if (leftPressed === true && ship.position.x > -800) {
    leftPressed = false;
    if (lane > -1) {
      lane -= 1;
    }
  }
  if (rightPressed === true && ship.position.x < 800) {
    rightPressed = false;
    if (lane < 1) {
      lane += 1;
    }
  }

  //move on y axis when up and down are pressed
  if (upPressed === true && ship.position.y < 1200) {
    thirdPersonCamera.position.y += 1800 * delta;
    ship.position.y += 1800 * delta;
    if (ship.rotation.x < 0.05) {
      ship.rotation.x += 0.002 * Math.PI;
    }
  }
  if (downPressed === true && ship.position.y > -500) {
    thirdPersonCamera.position.y -= 1800 * delta;
    ship.position.y -= 1800 * delta;
    if (ship.rotation.x > -0.05) {
      ship.rotation.x -= 0.002 * Math.PI;
    }
  }

  //move to lane -1 (left)
  if (lane == -1 && ship.position.x > -800) {
    thirdPersonCamera.position.x -= 8000 * delta;
    ship.position.x -= 8000 * delta;
    if (ship.position.x < -800) {
      thirdPersonCamera.position.x = -800;
      ship.position.x = -800;
    }
    if (ship.rotation.z < 0.05 * Math.PI) {
      ship.rotation.z += 0.002 * Math.PI;
    }
  }

  //move to lane 1 (right)
  if (lane == 1 && ship.position.x < 800) {
    thirdPersonCamera.position.x += 8000 * delta;
    ship.position.x += 8000 * delta;
    if (ship.position.x > 800) {
      thirdPersonCamera.position.x = 800;
      ship.position.x = 800;
    }
    if (ship.rotation.z > -0.05) {
      ship.rotation.z -= 0.002 * Math.PI;
    }
  }

  // Move to lane 0 (centre)
  if (lane === 0) {
    if (ship.position.x > 0) {
      thirdPersonCamera.position.x -= 8000 * delta;
      ship.position.x -= 8000 * delta;
      if (ship.position.x < 0) {
        thirdPersonCamera.position.x = 0;
        ship.position.x = 0;
      }
      if (ship.rotation.z < 0.05 * Math.PI) {
        ship.rotation.z += 0.002 * Math.PI;
      }
    } else if (ship.position.x < 0) {
      thirdPersonCamera.position.x += 8000 * delta;
      ship.position.x += 8000 * delta;
      if (ship.position.x > 0) {
        thirdPersonCamera.position.x = 0;
        ship.position.x = 0;
      }
      if (ship.rotation.z > -0.05) {
        ship.rotation.z -= 0.002 * Math.PI;
      }
    }
  }

  if (statsDisplay == 1) {
    render_stats.update();
  }

  renderer.render(scene, thirdPersonCamera);
};

window.onload = function pageLoad() {
  //load drum samples
  loadSoundFile(audioFiles['808_KICK'], 'kick');
  loadSoundFile(audioFiles['808_SNARE'], 'snare');
  loadSoundFile(audioFiles['808_HIHAT_C'], 'hihat');
  loadSoundFile(audioFiles['808_CLAP'], 'clap');
  loadSoundFile(audioFiles['808_RIMSHOT'], 'rimshot');
  loadSoundFile(audioFiles['808_COWBELL'], 'cowbell');

  setNotesArray();
  createAudioComponents();

  document.getElementById('playthegame').addEventListener('click', init);
  document.getElementById('showmore').addEventListener('click', showParameters);
};

function showParameters() {
  if (parametersVisible === false) {
    document.getElementById('gameoptions').style.display = 'block';
    document.getElementById('showmore').innerHTML = '<span>Hide Options</span>';
    parametersVisible = true;
  } else {
    document.getElementById('gameoptions').style.display = 'none';
    document.getElementById('showmore').innerHTML = '<span>Show Options</span>';
    parametersVisible = false;
  }
}
