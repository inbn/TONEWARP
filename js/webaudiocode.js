var context = new AudioContext();

var pageLoadTime = context.currentTime;

//arays to contain oscillators, filters and gain nodes
var oscillators1 = [];
var oscillators2 = [];
var filters = [];
var gainNodes = [];

// LEAD SYNTHESISER
//initial parameters
var oscOneMultiplier = 1, oscTwoMultiplier = 0.5;
var oscOneType = "sine"; //sine waveform
var oscTwoType = "sawtooth"; //sawtooth waveform
var filterCutoff = 4000;
var filterQ = 5;
var filterAttack = 0.01, filterDecay = 0.2, filterSustain = 0.3, filterRelease = 0.1; //initial envelope filter parameters
var ampAttack = 0.01, ampDecay = 0.1, ampSustain = 1.0, ampRelease = 0.1; //initial amplitude env parameters
var noteNumber = 0;

//BASS SYNTHESISER
//inital parameters
var bassOscOneMultiplier = 1, bassOscTwoMultiplier = 0.5;
var bassOscOneType = "square"; //square waveform
var bassOscTwoType = "sawtooth"; //sawtooth waveform
var bassFilterCutoff = 4000;
var bassFilterQ = 5;
var bassAmpAttack = 0.01, bassAmpDecay = 0.3, bassAmpSustain = 0.3, bassAmpRelease = 0.2; //initial amplitude env parameters
var bassFilterAttack = 0.01, bassFilterDecay = 0.1, bassFilterSustain = 0.1, bassFilterRelease = 0.15; //initial envelope filter parameters

//CHORD SYNTHESISER
//inital parameters
var chordOscOneMultiplier = 1, chordOscTwoMultiplier = 0.5;
var chordOscOneType = "sawtooth"; //sawtooth waveform
var chordOscTwoType = "sawtooth"; //sawtooth waveform
var chordFilterCutoff = 4000;
var chordFilterQ = 2;
var chordAmpAttack = 0.2, chordAmpDecay = 0.5, chordAmpSustain = 0.5, chordAmpRelease = 0.2; //initial amplitude env parameters
var chordFilterAttack = 0.2, chordFilterDecay = 0.5, chordFilterSustain = 0.5, chordFilterRelease = 0.15; //initial envelope filter parameters

//initial sequencer parameters
var phraseLength = 64;
var prevPitch = 493.883;
var currentPitch = 440;
var nextPitch;
var currentNote = 0;
var bPM = 100;
var noteLength = 0.15;
var noteArray = []; //array to be filled with note sequence
var p = 0; //probability
var rhythmPreset = 'simple kick';
var arraySelect = 0;
var secondOrderArray;
var startTime; //time that the current bar was started
var noteObjectPattern = [1,0,0,0,1,0,0,0,1,0,1,0,1,1,1,1];
var noteDensity = 1;
var noteRandomness = 1;
var bassNoteDensity = 3;
var bassPitches = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
var bassDurations = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
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
}

var drumGainNodes = {
	kick: null,
	snare: null,
	hihat: null,
	clap: null,
	rimshot: null,
	cowbell: null
}

//create tuna effects
var tuna = new Tuna(context);
var chorus, compressor;

var bassPatterns = [
	[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
	[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
	[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
	[1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

var notePatterns = [
	[1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], //1
	[1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0], //2
	[1,0,0,0,0,0,1,0,1,0,0,0,0,0,0,0], //3
	[1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0], //4
	[1,0,0,0,0,0,1,0,1,0,1,0,0,0,1,0], //5
	[1,0,0,1,0,0,1,0,0,0,1,0,1,0,1,0], //6
	[0,0,1,0,1,0,0,1,1,0,1,0,1,0,1,0], //7
	[1,0,0,0,1,0,0,1,1,1,1,0,1,0,1,0], //8
	[1,0,0,1,1,0,1,0,1,0,1,0,1,0,1,0], //9
	[1,1,0,1,0,1,0,1,0,1,0,1,1,1,1,0], //10
	[1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1], //11
	[0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1], //12
	[1,1,1,1,1,1,1,1,0,1,1,1,0,1,1,0], //13
	[1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1], //14
	[1,1,1,1,0,1,1,1,1,1,1,1,1,1,1,1], //15
	[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], //16
];

var drumPatterns = {
	'simple kick': {
		'kick'    : [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0],
		'snare'   : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'clap'    : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'hihat'   : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'rimshot' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'cowbell' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	},
	'rock': {
		'kick'    : [1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
		'snare'   : [0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0],
		'clap'    : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'hihat'   : [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
		'rimshot' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'cowbell' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	},
	'funky drummer': {
		'kick'    : [1,0,1,0,0,0,0,0,1,0,1,0,0,1,0,0],
		'snare'   : [0,0,0,0,1,0,0,1,0,1,0,1,1,0,0,0],
		'clap'    : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'hihat'   : [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
		'rimshot' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'cowbell' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	},
	'bossa nova': {
		'kick'    : [1,0,0,0,0,0,1,0,0,1,0,0,0,0,1,0],
		'snare'   : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'clap'    : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
		'hihat'   : [1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0],
		'rimshot' : [1,0,1,0,0,0,1,0,0,0,0,0,1,0,0,0],
		'cowbell' : [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
	}
}

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
                     threshold: -20,    //-100 to 0
                     makeupGain: 0,     //0 and up
                     attack: 1,         //0 to 1000
                     release: 50,        //0 to 3000
                     ratio: 3,          //1 to 20
                     knee: 5,           //0 to 40
                     automakeup: false,  //true/false
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
		filters[i].type = "lowpass";
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
	playSynth(pitch, now, duration, 0.3, oscOneType, oscTwoType, oscOneMultiplier, oscTwoMultiplier, filterCutoff, filterQ, filterAttack, filterDecay, filterSustain, filterRelease, ampAttack, ampDecay, ampSustain, ampRelease);
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
	noteObjectPattern = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

	for (var i = 0; i < 16; i++) {
		var rand = Math.floor(Math.random() * 10);
		if (noteRandomness > rand) {
			noteObjectPattern[i] = notePatterns[rand + 6][i];
		}
		else {
			noteObjectPattern = notePatterns[noteDensity];
		}
	}

	//extend note durations
	for (var k = 0; k < 16; k++) {
		//If there's a note
		if (noteObjectPattern[k] == 1) {
			for (var j = 1; j < 16; j++) {
				//check the next item in the array to see if there's a note. If not, extend
				if (noteObjectPattern[k+j] === 0 && k + j < 16) {
					noteObjectPattern[k]++;
				}
				else {
					break;
				}
			}
		}
	}
	console.log(noteObjectPattern);
}

function initSound(arrayBuffer, sampleType) {
	context.decodeAudioData(arrayBuffer, function(buffer) {
		//audioBuffer is global to reuse the decoded audio later
		drumBuffers[sampleType] = buffer;
		samplesLoaded++;
		return;
	}, function(e) {
		console.log('Error decoding file', e);
	});
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
function playSynth(pitch, time, duration, ampGain, osc1wf, osc2wf, osc1m, osc2m, cutoff, q, fA, fD, fS, fR, aA, aD, aS, aR) {
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
	filters[noteNumber].frequency.setValueAtTime(filters[noteNumber].frequency.value, time);
	//Attack
	if (duration < fA) {
		var attackF = duration / fA;
		filters[noteNumber].frequency.linearRampToValueAtTime(cutoff * attackF, time + duration);
		filters[noteNumber].frequency.linearRampToValueAtTime(0, time + duration + 0.01); //drop to 0 in 0.01 seconds to prevent click
		filterDone = 1;
	}
	else {
		filters[noteNumber].frequency.linearRampToValueAtTime(cutoff, time + fA);
	}
	//Decay
	if (duration < fA + fD && filterDone === false) {
		var decayF = (duration - fA) / fD;
		filters[noteNumber].frequency.linearRampToValueAtTime(cutoff * decayF, time + duration);
	}
	else if (filterDone === false) {
		filters[noteNumber].frequency.linearRampToValueAtTime((cutoff * fS), time + (fA + fD));
	}
	//Sustain
	if (duration > fA + fD) {
		filters[noteNumber].frequency.linearRampToValueAtTime((cutoff * fS), time + duration);
	}
	//Release
	if (filterDone === false) {
		filters[noteNumber].frequency.linearRampToValueAtTime(0, time + (duration + fR));
	}

	//AMPLITUDE ENVELOPE
	gainNodes[noteNumber].gain.setValueAtTime(gainNodes[noteNumber].gain.value, time);
	//Attack
	if (duration < aA) {
		var attackA = duration / aA;
		gainNodes[noteNumber].gain.linearRampToValueAtTime((ampGain * attackA), time + duration);
		gainNodes[noteNumber].gain.linearRampToValueAtTime(0.0, time + duration + 0.01); //drop to 0 in 0.01 seconds to prevent click
		ampDone = true;
	}
	else {
		gainNodes[noteNumber].gain.linearRampToValueAtTime(ampGain, time + aA);
	}
	//Decay
	if (duration < aA + aD && ampDone === false) {
		var decayA = (duration - aA) / aD;
		gainNodes[noteNumber].gain.linearRampToValueAtTime(ampGain * aS, time + (time + duration));
	}
	else if (ampDone === false) {
		gainNodes[noteNumber].gain.linearRampToValueAtTime(ampGain * aS, time + (aA + aD));
	}
	//Sustain
	if (duration > aA + aD) {
		gainNodes[noteNumber].gain.linearRampToValueAtTime((ampGain * aS), time + duration);
	}
	//Release
	if (ampDone === false) {
		gainNodes[noteNumber].gain.linearRampToValueAtTime(ampGain, time + (duration + aR));
	}

	//stop oscillators when note is over. Choose whether to stop when amplitude envelope or filter envelope is finished based on which has the longer duration
	if ((aA + aD + aR) > (fA + fD + fR)) {
		oscillators1[noteNumber].stop(time + duration + aR);
		oscillators2[noteNumber].stop(time + duration + aR);
	}
	else {
		oscillators1[noteNumber].stop(time + duration + fR);
		oscillators2[noteNumber].stop(time + duration + fR);
	}
	if (noteNumber < 63) {
		noteNumber++;
	}
	else {
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
	console.log("Notes generated");
}

function generateBassLine() {
	for (var i = 0; i < 16; i++) {
		//pick random pitches from the markov array
		bassPitches[i] = secondOrderArray[Math.floor(Math.random() * (secondOrderArray.length - 1))][0];
		//choose rhythm based on bassNoteDensity
		if (bassNoteDensity > 0 && bassNoteDensity < 5) {
			var randomNumber = bassNoteDensity + Math.floor(Math.random()*3) - 1;
			bassDurations[i] = bassPatterns[randomNumber][i];
		}
		else {
			bassDurations[i] = bassPatterns[bassNoteDensity][i];
		}
	}
}

//function to quantise note start times to semiquaver grid
function playNextNote(duration, pitch, type) {
	console.log("duration = " + duration + ". pitch = " + pitch);
	var collisionTime = context.currentTime;
	for (var x = 0; x < 16; x++) {
		var semiquaverStart = (x * noteLength) + startTime;
		if (semiquaverStart - (0.5 * noteLength) < collisionTime && collisionTime < semiquaverStart) {
			noteStartTime = semiquaverStart;
			break;
		}
		else if (semiquaverStart < collisionTime && collisionTime < (semiquaverStart + 0.1 * noteLength)) {
			noteStartTime = context.currentTime;
		}
		else {
			noteStartTime = context.currentTime;
		}
	}

	//type 0 is the lead synthesiser
	if (type === 0) {
		playSynth(pitch, noteStartTime, noteLength * duration, 0.25, oscOneType, oscTwoType, oscOneMultiplier, oscTwoMultiplier, filterCutoff, filterQ, filterAttack, filterDecay, filterSustain, filterRelease, ampAttack, ampDecay, ampSustain, ampRelease);
	}
	//type 1 is the chord synthesiser (synth pad)
	else if (type == 1) {
		playSynth(pitch, noteStartTime, noteLength * duration, 0.06, chordOscOneType, chordOscTwoType, chordOscOneMultiplier, chordOscTwoMultiplier, chordFilterCutoff, chordFilterQ, chordFilterAttack, chordFilterDecay, chordFilterSustain, chordFilterRelease, chordAmpAttack, chordAmpDecay, chordAmpSustain, chordAmpRelease);
	}
}

//play drums and bass line
function playRhythm(startTime) {
	for (var i = 0; i < 16; i++) {
		var r = Math.random() * 10;
		var rhythmChoice;

		if (drumRandomness > r) {
			// Pick from a random pattern
			rhythmChoice = drumPatternNames[Math.floor(Math.random() * drumPatternNames.length)];
		}
		else {
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
			playSynth(bassPitches[i] * 0.25, startTime + i * noteLength , noteLength, 0.25, bassOscOneType, bassOscTwoType, bassOscOneMultiplier, bassOscTwoMultiplier, bassFilterCutoff, bassFilterQ, bassFilterAttack, bassFilterDecay, bassFilterSustain, bassFilterRelease, bassAmpAttack, bassAmpDecay, bassAmpSustain, bassAmpRelease);
		}
	}
}

//generate new note from markov chain
function makeNotesSecondOrder() {
	//generate a random float between 0 and 1
	var rand = Math.random();
	for (var x = 0; x < (secondOrderArray.length - 1); x++) {
		if (prevPitch == secondOrderArray[(x+1)][0] && currentPitch == secondOrderArray[(x+1)][1]) {
			for (var y = 0; y < 100; y++) {
				p += secondOrderArray[(x+1)][(y+2)];
				if (p >= rand) {
					nextPitch = secondOrderArray[0][(y+2)];
					p = 0;
					break;
				}
			}
		}
	}
}

/* ---- OPTIONS ---- */

//connect NexusUI Elements
nx.onload = function() {
	nx.sendsTo("js");
	nx.colorize("#4400FF"); // sets accent

	//assign variables
	var singleNotePitchControl = dial1;
	var singleNoteDurationControl = dial2;
	var filterCutoffControl = dial3;
	var filterQControl = dial4;
	var filterAttackControl = dial5;
	var filterDecayControl = dial6;
	var filterSustainControl = dial7;
	var filterReleaseControl = dial8;
	var ampAttackControl = dial9;
	var ampDecayControl = dial10;
	var ampSustainControl = dial11;
	var ampReleaseControl = dial12;

	//get values
	button1.mode = "impulse";
	filterCutoffControl.val = filterCutoff / 5000;
	filterCutoffControl.draw();
	filterQControl.val = filterQ / 50;
	filterQControl.draw();

	filterAttackControl.val = filterAttack;
	filterAttackControl.draw();
	filterDecayControl.val = filterDecay;
	filterDecayControl.draw();
	filterSustainControl.val = filterSustain;
	filterSustainControl.draw();
	filterReleaseControl.val = filterRelease;
	filterReleaseControl.draw();

	ampAttackControl.val = ampAttack;
	ampAttackControl.draw();
	ampDecayControl.val = ampDecay;
	ampDecayControl.draw();
	ampSustainControl.val = ampSustain;
	ampSustainControl.draw();
	ampReleaseControl.val = ampRelease;
	ampReleaseControl.draw();

  	// set individual receivers
  	button1.response = function() {
  		playNote(singleNotePitchControl.val * 5000, singleNoteDurationControl.val * 5);
  	};
  	filterCutoffControl.response = function(data) {
    	filterCutoff = data * 5000;
 	};
 	filterQControl.response = function(data) {
    	filterQ = data * 50;
 	};
  	filterAttackControl.response = function(data) {
    	filterAttack = data;
 	};
 	filterDecayControl.response = function(data) {
    	filterDecay = data;
 	};
 	filterSustainControl.response = function(data) {
    	filterSustain = data;
 	};
 	filterReleaseControl.response = function(data) {
    	filterRelease = data;
 	};
 	ampAttackControl.response = function(data) {
    	ampAttack = data;
 	};
 	ampDecayControl.response = function(data) {
    	ampDecay = data;
 	};
 	ampSustainControl.response = function(data) {
    	ampSustain = data;
 	};
 	ampReleaseControl.response = function(data) {
    	ampRelease = data;
 	};

 	//hide options div after NexusUI objects loaded
 	document.getElementById('gameoptions').style.display="none";
};

//update values when parameters are changed by the user
function updateParameters() {
	antialiasing= document.getElementById('antialiasing').value;
	showText = document.getElementById('showtext').value;
	numberOfZones = document.getElementById('zonesnum').value;
	statsDisplay = document.getElementById('stats').value;

	rhythmPreset = parseInt(document.getElementById('drumRhythm').value);
	bPM = parseFloat(document.getElementById('BPM').value);
	noteLength = 15/bPM;

	oscOneMultiplier = parseFloat(document.getElementById('oscillator1Transpose').value);
	oscTwoMultiplier = parseFloat(document.getElementById('oscillator2Transpose').value);

	oscOneType = document.getElementById('oscOneWaveform').value;
	oscTwoType = document.getElementById('oscTwoWaveform').value;
}

/*
function questionnaire() {
	var timePlaying = Math.floor(context.currentTime - pageLoadTime);
	var minutes = Math.floor(timePlaying/60);
	var seconds = Math.floor(timePlaying - minutes * 60);
	var r = confirm("You have been playing for: " + minutes + " minutes and " + seconds + " seconds. \nPress OK to continue to the Questionnaire.");
	if (r==true) {
	  window.location.href = 'https://docs.google.com/forms/d/1NTsINyy2KRi5m18mmc95vdXSmGqZBMU038Ujo0ByHEo/viewform?usp=send_form';
	  }
 //   window.confirm("You have been playing for: " + minutes + " minutes and " + seconds + " seconds. \nPress OK to continue to the Questionnaire.");
  //  window.location.href = 'http://www.sussex.ac.uk';
}

window.onbeforeunload = function() {
	questionnaire();
}
*/
