import { SignJWT } from 'jose';
import crypto from 'crypto';
import { nanoid } from 'nanoid';

interface TicketData {
	orderId: string;
	eventId: string;
	eventTitle: string;
	ticketTypeId: string;
	ticketTypeName: string;
	holderEmail: string;
	eventDate: string;
}

interface GeneratedTicket {
	id: string;
	ticket_code: string;
	qr_token: string;
	qr_hash: string;
}

/**
 * Genera un código de ticket alfanumérico único
 * Formato: EVT123-VIP-A7X9K2
 */
function generateTicketCode(eventId: string, ticketType: string): string {
	// Tomar primeros 6 caracteres del event_id
	const eventPrefix = eventId.replace(/-/g, '').substring(0, 6).toUpperCase();
	
	// Tomar primeras 3 letras del tipo de ticket
	const typePrefix = ticketType
		.replace(/[^a-zA-Z]/g, '')
		.substring(0, 3)
		.toUpperCase() || 'TKT';
	
	// Generar 6 caracteres aleatorios
	const random = nanoid(6).toUpperCase();
	
	return `${eventPrefix}-${typePrefix}-${random}`;
}

/**
 * Genera un ticket completo con JWT y hash
 */
export async function generateTicket(data: TicketData): Promise<GeneratedTicket> {
	const ticketId = crypto.randomUUID();
	const ticketCode = generateTicketCode(data.eventId, data.ticketTypeName);
	
	// Crear JWT con los datos del ticket
	const secret = new TextEncoder().encode(
		process.env.JWT_SECRET_KEY || 'your-secret-key-change-in-production'
	);
	
	const jwt = await new SignJWT({
		ticket_id: ticketId,
		event_id: data.eventId,
		event_title: data.eventTitle,
		ticket_type: data.ticketTypeName,
		holder_email: data.holderEmail,
		ticket_code: ticketCode
	})
		.setProtectedHeader({ alg: 'HS256' })
		.setIssuedAt()
		.setExpirationTime(data.eventDate) // Expira en la fecha del evento
		.setJti(nanoid()) // ID único del JWT
		.sign(secret);
	
	// Generar hash SHA256 del JWT para búsqueda rápida
	const hashSalt = process.env.HASH_SALT || 'your-hash-salt-change-in-production';
	const qrHash = crypto
		.createHash('sha256')
		.update(jwt + hashSalt)
		.digest('hex');
	
	return {
		id: ticketId,
		ticket_code: ticketCode,
		qr_token: jwt,
		qr_hash: qrHash
	};
}

/**
 * Genera múltiples tickets para una orden
 */
export async function generateTickets(
	data: TicketData,
	quantity: number
): Promise<GeneratedTicket[]> {
	const tickets: GeneratedTicket[] = [];
	
	for (let i = 0; i < quantity; i++) {
		const ticket = await generateTicket(data);
		tickets.push(ticket);
	}
	
	return tickets;
}
