const keys = document.querySelectorAll('.key');

// Map for note to audio file
const notes = {
    'C4': 'sounds/C4.mp3',
    'C#4': 'sounds/Cs4.mp3',
    'D4': 'sounds/D4.mp3',
    'D#4': 'sounds/Ds4.mp3',
    'E4': 'sounds/E4.mp3',
    'F4': 'sounds/F4.mp3',
    'F#4': 'sounds/Fs4.mp3',
    'G4': 'sounds/G4.mp3',
    'G#4': 'sounds/Gs4.mp3',
    'A4': 'sounds/A4.mp3',
    'A#4': 'sounds/As4.mp3',
    'B4': 'sounds/B4.mp3',
    'C5': 'sounds/C5.mp3',
    'C#5': 'sounds/Cs5.mp3',
    'D5': 'sounds/D5.mp3',
    'D#5': 'sounds/Ds5.mp3',
    'E5': 'sounds/E5.mp3',
    'F5': 'sounds/F5.mp3',
    'F#5': 'sounds/Fs5.mp3',
    'G5': 'sounds/G5.mp3',
    'G#5': 'sounds/Gs5.mp3',
    'A5': 'sounds/A5.mp3',
    'A#5': 'sounds/As5.mp3',
    'B5': 'sounds/B5.mp3',
    'C6': 'sounds/C6.mp3'
};

// Function to play the audio
function playNote(note) {
    if (notes[note]) {
        const audio = new Audio(notes[note]);
        audio.currentTime = 0;
        audio.play();
    }
}

// Add event listeners to keys
keys.forEach(key => {
    key.addEventListener('click', () => {
        const note = key.dataset.note;
        playNote(note);
        activateKey(key);
    });
});

// Activate key effect
function activateKey(keyElement) {
    keyElement.classList.add('active');
    setTimeout(() => keyElement.classList.remove('active'), 200);
}

// Keyboard support
window.addEventListener('keydown', (e) => {
    const keyMap = {
        'a': 'C4',
        'w': 'C#4',
        's': 'D4',
        'e': 'D#4',
        'd': 'E4',
        'f': 'F4',
        't': 'F#4',
        'g': 'G4',
        'y': 'G#4',
        'h': 'A4',
        'u': 'A#4',
        'j': 'B4',
        'k': 'C5',
        'o': 'C#5',
        'z': 'D5',
        "3": 'D#5',
        'x': 'E5',
        'c': 'F5',
        '5': 'F#5',
        'v': 'G5',
        '6': 'G#5',
        'b': 'A5',
        '7': 'A#5',
        'n': 'B5',
        'm': 'C6'
    };

    const note = keyMap[e.key];
    if (note) {
        playNote(note);
        const keyElement = document.querySelector(`.key[data-note="${note}"]`);
        if (keyElement) {
            activateKey(keyElement);
        }
    }
});

// Show/Hide Notes based on checkbox
const toggleMode = document.getElementById('toggle-mode');
toggleMode.addEventListener('change', () => {
    keys.forEach(key => {
        const label = key.querySelector('.label');
        if (toggleMode.checked) {
            label.style.display = 'inline';  // Show note
        } else {
            label.style.display = 'none';   // Hide note
        }
    });
});
