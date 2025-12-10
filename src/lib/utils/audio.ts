/**
 * Utilidad para reproducir sonidos y feedback háptico
 * Optimizado para experiencia de usuario en escaneo QR
 */

/**
 * Reproducir sonido de éxito (beep agudo)
 * Usado cuando QR se detecta exitosamente
 */
export function playSuccessSound() {
	// Crear contexto de audio
	const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
	
	// Crear oscilador para beep agudo
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();
	
	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);
	
	// Configuración: beep agudo corto
	oscillator.frequency.value = 1000; // Hz
	oscillator.type = 'sine';
	
	// Volumen
	gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
	
	oscillator.start(audioContext.currentTime);
	oscillator.stop(audioContext.currentTime + 0.1);
}

/**
 * Reproducir sonido de error (beep bajo)
 */
export function playErrorSound() {
	const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
	
	const oscillator = audioContext.createOscillator();
	const gainNode = audioContext.createGain();
	
	oscillator.connect(gainNode);
	gainNode.connect(audioContext.destination);
	
	// Configuración: beep bajo
	oscillator.frequency.value = 400; // Hz más bajo
	oscillator.type = 'sine';
	
	gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
	gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
	
	oscillator.start(audioContext.currentTime);
	oscillator.stop(audioContext.currentTime + 0.15);
}

/**
 * Vibración háptica para éxito
 * Patrón: vibración corta
 */
export function vibrateSuccess() {
	if (navigator.vibrate) {
		navigator.vibrate([20, 10, 20]); // Patrón: 20ms on, 10ms off, 20ms on
	}
}

/**
 * Vibración háptica para error
 * Patrón: vibración prolongada
 */
export function vibrateError() {
	if (navigator.vibrate) {
		navigator.vibrate([50, 30, 50, 30, 50]); // Patrón: múltiples pulsos
	}
}

/**
 * Vibración háptica para procesando
 * Patrón: vibración suave
 */
export function vibrateProcessing() {
	if (navigator.vibrate) {
		navigator.vibrate(15); // Vibración corta y suave
	}
}

/**
 * Combo: sonido + vibración para éxito
 */
export function triggerSuccessFeedback() {
	try {
		playSuccessSound();
	} catch (err) {
		console.log('Audio context no disponible:', err);
	}
	vibrateSuccess();
}

/**
 * Combo: sonido + vibración para error
 */
export function triggerErrorFeedback() {
	try {
		playErrorSound();
	} catch (err) {
		console.log('Audio context no disponible:', err);
	}
	vibrateError();
}

/**
 * Combo: vibración para procesando
 */
export function triggerProcessingFeedback() {
	vibrateProcessing();
}
