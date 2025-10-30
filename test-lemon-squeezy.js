// Script de prueba para verificar conexión con Lemon Squeezy
import { readFileSync } from 'fs';

// Leer .env.local manualmente
const envFile = readFileSync('.env.local', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
	if (line.trim() && !line.startsWith('#')) {
		const [key, ...values] = line.split('=');
		envVars[key.trim()] = values.join('=').trim();
	}
});

const LEMON_SQUEEZY_API_KEY = envVars.LEMON_SQUEEZY_API_KEY;

async function testLemonSqueezy() {
	console.log('🔍 Probando conexión con Lemon Squeezy...\n');
	
	try {
		// Test 1: Verificar API Key
		const response = await fetch('https://api.lemonsqueezy.com/v1/users/me', {
			headers: {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
			}
		});

		if (!response.ok) {
			console.error('❌ Error de autenticación');
			const error = await response.json();
			console.error(error);
			return;
		}

		const userData = await response.json();
		console.log('✅ API Key válida!');
		console.log('👤 Usuario:', userData.data.attributes.name);
		console.log('📧 Email:', userData.data.attributes.email);
		console.log('\n---\n');

		// Test 2: Listar Stores
		console.log('🏪 Obteniendo tus Stores...\n');
		const storesResponse = await fetch('https://api.lemonsqueezy.com/v1/stores', {
			headers: {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
			}
		});

		if (!storesResponse.ok) {
			console.error('❌ Error al obtener stores');
			return;
		}

		const storesData = await storesResponse.json();
		
		if (storesData.data.length === 0) {
			console.log('⚠️  No tienes stores creadas aún.');
			console.log('📝 Crea una en: https://app.lemonsqueezy.com/settings/stores\n');
			return;
		}

		console.log(`✅ Encontradas ${storesData.data.length} store(s):\n`);
		storesData.data.forEach(store => {
			console.log(`📦 Store: ${store.attributes.name}`);
			console.log(`   ID: ${store.id}`);
			console.log(`   Slug: ${store.attributes.slug}`);
			console.log(`   URL: ${store.attributes.url}`);
			console.log(`   Test Mode: ${store.attributes.test_mode ? '✅ Activado' : '❌ Desactivado'}`);
			console.log('');
		});

		console.log('\n---\n');

		// Test 3: Listar Products (si hay)
		console.log('📦 Obteniendo productos...\n');
		const productsResponse = await fetch('https://api.lemonsqueezy.com/v1/products', {
			headers: {
				'Accept': 'application/vnd.api+json',
				'Content-Type': 'application/vnd.api+json',
				'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
			}
		});

		if (!productsResponse.ok) {
			console.error('❌ Error al obtener productos');
			return;
		}

		const productsData = await productsResponse.json();

		if (productsData.data.length === 0) {
			console.log('⚠️  No tienes productos creados aún.');
			console.log('📝 Crea uno en: https://app.lemonsqueezy.com/products\n');
			return;
		}

		console.log(`✅ Encontrados ${productsData.data.length} producto(s):\n`);
		
		for (const product of productsData.data) {
			console.log(`🎫 Producto: ${product.attributes.name}`);
			console.log(`   ID: ${product.id}`);
			console.log(`   Store ID: ${product.attributes.store_id}`);
			
			// Obtener variants del producto
			const variantsResponse = await fetch(`https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${product.id}`, {
				headers: {
					'Accept': 'application/vnd.api+json',
					'Content-Type': 'application/vnd.api+json',
					'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
				}
			});

			if (variantsResponse.ok) {
				const variantsData = await variantsResponse.json();
				if (variantsData.data.length > 0) {
					console.log(`   Variants:`);
					variantsData.data.forEach(variant => {
						console.log(`     • ${variant.attributes.name} (ID: ${variant.id}) - $${variant.attributes.price / 100}`);
					});
				}
			}
			console.log('');
		}

		console.log('\n✨ Configuración sugerida para tu .env.local:\n');
		if (storesData.data.length > 0) {
			console.log(`LEMON_SQUEEZY_STORE_ID=${storesData.data[0].id}`);
		}
		if (productsData.data.length > 0) {
			// Obtener el primer variant del primer producto
			const firstProduct = productsData.data[0];
			const variantsResponse = await fetch(`https://api.lemonsqueezy.com/v1/variants?filter[product_id]=${firstProduct.id}`, {
				headers: {
					'Accept': 'application/vnd.api+json',
					'Content-Type': 'application/vnd.api+json',
					'Authorization': `Bearer ${LEMON_SQUEEZY_API_KEY}`
				}
			});
			
			if (variantsResponse.ok) {
				const variantsData = await variantsResponse.json();
				if (variantsData.data.length > 0) {
					console.log(`LEMON_SQUEEZY_VARIANT_ID=${variantsData.data[0].id}`);
				}
			}
		}
		console.log('');

	} catch (error) {
		console.error('❌ Error:', error.message);
	}
}

testLemonSqueezy();
