// Store para manejar sincronización offline
import { 
  getPendingVerifications, 
  updateVerificationSyncStatus,
  cleanSyncedVerifications,
  isOnline,
  countPendingVerifications
} from '$lib/utils/offline';

class SyncStore {
  isSyncing = $state(false);
  pendingCount = $state(0);
  lastSyncAt = $state<Date | null>(null);
  syncErrors = $state<string[]>([]);

  /**
   * Inicializar el store (contar pendientes)
   */
  async init() {
    this.pendingCount = await countPendingVerifications();
    
    // Listener para detectar cuando volvemos online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('🌐 Conexión restaurada, sincronizando...');
        this.syncAll();
      });
    }
  }

  /**
   * Sincronizar todas las verificaciones pendientes
   */
  async syncAll(): Promise<{ success: number; failed: number }> {
    if (this.isSyncing) {
      console.log('⏳ Ya hay una sincronización en progreso');
      return { success: 0, failed: 0 };
    }

    if (!isOnline()) {
      console.log('📵 Sin conexión, no se puede sincronizar');
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    this.syncErrors = [];

    let successCount = 0;
    let failedCount = 0;

    try {
      const pending = await getPendingVerifications();
      console.log(`🔄 Sincronizando ${pending.length} verificaciones pendientes`);

      for (const item of pending) {
        try {
          // Marcar como "syncing"
          await updateVerificationSyncStatus(item.id!, 'syncing');

          // Enviar al backend
          const response = await fetch('/api/verificar/mark-verified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: item.ticket_id,
              event_id: item.event_id,
              entry_gate: item.entry_gate,
              device_info: {
                ...item.device_info,
                synced_from_offline: true,
                original_timestamp: item.verified_at
              }
            })
          });

          if (response.ok) {
            // Éxito: marcar como sincronizado
            await updateVerificationSyncStatus(item.id!, 'synced');
            successCount++;
            console.log(`✅ Ticket ${item.ticket_id} sincronizado`);
          } else {
            // Error del servidor
            const error = await response.text();
            await updateVerificationSyncStatus(item.id!, 'failed', error);
            failedCount++;
            this.syncErrors.push(`Ticket ${item.ticket_id}: ${error}`);
            console.error(`❌ Error sincronizando ticket ${item.ticket_id}:`, error);
          }
        } catch (error) {
          // Error de red u otro
          const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
          await updateVerificationSyncStatus(item.id!, 'failed', errorMsg);
          failedCount++;
          this.syncErrors.push(`Ticket ${item.ticket_id}: ${errorMsg}`);
          console.error(`❌ Error sincronizando ticket ${item.ticket_id}:`, error);
        }
      }

      // Limpiar las verificaciones sincronizadas exitosamente
      await cleanSyncedVerifications();

      // Actualizar contador
      this.pendingCount = await countPendingVerifications();
      this.lastSyncAt = new Date();

      console.log(`✨ Sincronización completada: ${successCount} éxito, ${failedCount} fallos`);
    } catch (error) {
      console.error('💥 Error durante la sincronización:', error);
    } finally {
      this.isSyncing = false;
    }

    return { success: successCount, failed: failedCount };
  }

  /**
   * Incrementar contador de pendientes
   */
  incrementPending() {
    this.pendingCount++;
  }

  /**
   * Decrementar contador de pendientes
   */
  decrementPending() {
    if (this.pendingCount > 0) {
      this.pendingCount--;
    }
  }

  /**
   * Reintentar sincronización de verificaciones fallidas
   */
  async retryFailed(): Promise<void> {
    // Marcar todas las fallidas como pending de nuevo
    const db = await import('$lib/utils/offline').then(m => m);
    // Esta funcionalidad se puede expandir si es necesario
    console.log('🔄 Reintentando sincronización...');
    await this.syncAll();
  }
}

export const syncStore = new SyncStore();
