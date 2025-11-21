import { openDB, type IDBPDatabase } from 'idb';

// Nombre de la base de datos
const DB_NAME = 'vtickets-offline';
const DB_VERSION = 1;

// Nombres de object stores
const STORES = {
  EVENTS: 'events',
  TICKETS: 'tickets',
  VERIFICATION_QUEUE: 'verification_queue'
};

// Interfaz de datos
interface CachedEvent {
  id: string;
  title: string;
  event_date: string;
  location: string;
  venue?: string;
  cached_at: number;
}

interface CachedTicket {
  id: string;
  event_id: string;
  ticket_code: string;
  holder_name?: string;
  holder_email?: string;
  verified: boolean;
  status: string;
  ticket_type?: {
    name: string;
    price: number;
  };
}

interface VerificationQueueItem {
  id?: number;
  ticket_id: string;
  event_id: string;
  verified_by: string;
  verified_at: string;
  entry_gate?: string;
  device_info?: any;
  sync_status: 'pending' | 'syncing' | 'synced' | 'failed';
  created_at: number;
  error?: string;
}

// Inicializar la base de datos
async function initDB(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store de eventos
      if (!db.objectStoreNames.contains(STORES.EVENTS)) {
        const eventStore = db.createObjectStore(STORES.EVENTS, { keyPath: 'id' });
        eventStore.createIndex('cached_at', 'cached_at');
      }

      // Store de tickets
      if (!db.objectStoreNames.contains(STORES.TICKETS)) {
        const ticketStore = db.createObjectStore(STORES.TICKETS, { keyPath: 'id' });
        ticketStore.createIndex('event_id', 'event_id');
        ticketStore.createIndex('ticket_code', 'ticket_code', { unique: true });
      }

      // Store de cola de verificaciones
      if (!db.objectStoreNames.contains(STORES.VERIFICATION_QUEUE)) {
        const queueStore = db.createObjectStore(STORES.VERIFICATION_QUEUE, { 
          keyPath: 'id', 
          autoIncrement: true 
        });
        queueStore.createIndex('sync_status', 'sync_status');
        queueStore.createIndex('event_id', 'event_id');
        queueStore.createIndex('created_at', 'created_at');
      }
    },
  });
}

// ==================== EVENTOS ====================

/**
 * Guardar evento en caché
 */
export async function cacheEvent(event: any): Promise<void> {
  const db = await initDB();
  
  const cachedEvent: CachedEvent = {
    id: event.id,
    title: event.title,
    event_date: event.event_date,
    location: event.location,
    venue: event.venue,
    cached_at: Date.now()
  };

  await db.put(STORES.EVENTS, cachedEvent);
}

/**
 * Obtener evento desde caché
 */
export async function getCachedEvent(eventId: string): Promise<CachedEvent | undefined> {
  const db = await initDB();
  return db.get(STORES.EVENTS, eventId);
}

/**
 * Limpiar eventos cacheados antiguos (más de 7 días)
 */
export async function cleanOldEvents(): Promise<void> {
  const db = await initDB();
  const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const tx = db.transaction(STORES.EVENTS, 'readwrite');
  const store = tx.objectStore(STORES.EVENTS);
  const index = store.index('cached_at');
  
  const oldEvents = await index.getAll(IDBKeyRange.upperBound(weekAgo));
  
  for (const event of oldEvents) {
    await store.delete(event.id);
  }
  
  await tx.done;
}

// ==================== TICKETS ====================

/**
 * Guardar tickets de un evento en caché
 */
export async function cacheTickets(eventId: string, tickets: any[]): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORES.TICKETS, 'readwrite');
  
  // Primero eliminar tickets antiguos de este evento
  const index = tx.store.index('event_id');
  const oldTickets = await index.getAllKeys(eventId);
  for (const key of oldTickets) {
    await tx.store.delete(key);
  }
  
  // Agregar los nuevos tickets
  for (const ticket of tickets) {
    const cachedTicket: CachedTicket = {
      id: ticket.id,
      event_id: eventId,
      ticket_code: ticket.ticket_code,
      holder_name: ticket.holder_name,
      holder_email: ticket.holder_email,
      verified: ticket.verified || false,
      status: ticket.status,
      ticket_type: ticket.ticket_types ? {
        name: ticket.ticket_types.name,
        price: ticket.ticket_types.price
      } : undefined
    };
    
    await tx.store.put(cachedTicket);
  }
  
  await tx.done;
}

/**
 * Obtener todos los tickets de un evento desde caché
 */
export async function getCachedTickets(eventId: string): Promise<CachedTicket[]> {
  const db = await initDB();
  const tx = db.transaction(STORES.TICKETS, 'readonly');
  const index = tx.store.index('event_id');
  return index.getAll(eventId);
}

/**
 * Buscar ticket por código
 */
export async function findTicketByCode(ticketCode: string): Promise<CachedTicket | undefined> {
  const db = await initDB();
  const tx = db.transaction(STORES.TICKETS, 'readonly');
  const index = tx.store.index('ticket_code');
  return index.get(ticketCode);
}

/**
 * Actualizar estado de verificación de un ticket
 */
export async function updateTicketVerification(ticketId: string, verified: boolean): Promise<void> {
  const db = await initDB();
  const ticket = await db.get(STORES.TICKETS, ticketId);
  
  if (ticket) {
    ticket.verified = verified;
    await db.put(STORES.TICKETS, ticket);
  }
}

// ==================== COLA DE VERIFICACIONES ====================

/**
 * Agregar verificación a la cola (cuando estamos offline)
 */
export async function addToVerificationQueue(
  ticketId: string,
  eventId: string,
  verifiedBy: string,
  entryGate?: string,
  deviceInfo?: any
): Promise<number> {
  const db = await initDB();
  
  const queueItem: VerificationQueueItem = {
    ticket_id: ticketId,
    event_id: eventId,
    verified_by: verifiedBy,
    verified_at: new Date().toISOString(),
    entry_gate: entryGate,
    device_info: deviceInfo,
    sync_status: 'pending',
    created_at: Date.now()
  };
  
  const id = await db.add(STORES.VERIFICATION_QUEUE, queueItem);
  
  // También actualizar el ticket localmente
  await updateTicketVerification(ticketId, true);
  
  return id as number;
}

/**
 * Obtener todas las verificaciones pendientes de sincronizar
 */
export async function getPendingVerifications(): Promise<VerificationQueueItem[]> {
  const db = await initDB();
  const tx = db.transaction(STORES.VERIFICATION_QUEUE, 'readonly');
  const index = tx.store.index('sync_status');
  return index.getAll('pending');
}

/**
 * Actualizar estado de sincronización de una verificación
 */
export async function updateVerificationSyncStatus(
  id: number,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  error?: string
): Promise<void> {
  const db = await initDB();
  const item = await db.get(STORES.VERIFICATION_QUEUE, id);
  
  if (item) {
    item.sync_status = status;
    if (error) {
      item.error = error;
    }
    await db.put(STORES.VERIFICATION_QUEUE, item);
  }
}

/**
 * Eliminar verificaciones ya sincronizadas
 */
export async function cleanSyncedVerifications(): Promise<void> {
  const db = await initDB();
  const tx = db.transaction(STORES.VERIFICATION_QUEUE, 'readwrite');
  const index = tx.store.index('sync_status');
  
  const syncedItems = await index.getAllKeys('synced');
  
  for (const key of syncedItems) {
    await tx.store.delete(key);
  }
  
  await tx.done;
}

/**
 * Contar verificaciones pendientes
 */
export async function countPendingVerifications(): Promise<number> {
  const db = await initDB();
  const tx = db.transaction(STORES.VERIFICATION_QUEUE, 'readonly');
  const index = tx.store.index('sync_status');
  const count = await index.count('pending');
  return count;
}

/**
 * Obtener todas las verificaciones de un evento (para mostrar en UI)
 */
export async function getEventVerifications(eventId: string): Promise<VerificationQueueItem[]> {
  const db = await initDB();
  const tx = db.transaction(STORES.VERIFICATION_QUEUE, 'readonly');
  const index = tx.store.index('event_id');
  return index.getAll(eventId);
}

// ==================== UTILIDADES ====================

/**
 * Verificar si hay conexión a internet
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Limpiar toda la base de datos (útil para desarrollo/debug)
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();
  
  const tx = db.transaction([STORES.EVENTS, STORES.TICKETS, STORES.VERIFICATION_QUEUE], 'readwrite');
  
  await tx.objectStore(STORES.EVENTS).clear();
  await tx.objectStore(STORES.TICKETS).clear();
  await tx.objectStore(STORES.VERIFICATION_QUEUE).clear();
  
  await tx.done;
}

/**
 * Obtener estadísticas de la base de datos
 */
export async function getDBStats(): Promise<{
  events: number;
  tickets: number;
  pendingVerifications: number;
}> {
  const db = await initDB();
  
  const [events, tickets, pendingVerifications] = await Promise.all([
    db.count(STORES.EVENTS),
    db.count(STORES.TICKETS),
    countPendingVerifications()
  ]);
  
  return {
    events,
    tickets,
    pendingVerifications
  };
}
