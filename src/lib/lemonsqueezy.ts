import { lemonSqueezySetup } from '@lemonsqueezy/lemonsqueezy.js';

// Configurar Lemon Squeezy
lemonSqueezySetup({
	apiKey: import.meta.env.LEMON_SQUEEZY_API_KEY,
	onError: (error) => console.error('Lemon Squeezy Error:', error)
});

export { lemonSqueezySetup };
