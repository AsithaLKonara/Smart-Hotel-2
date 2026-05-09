import React from 'react'

export interface HousekeepingTask {
  id: string
  roomNumber: string
  status: 'DIRTY' | 'CLEANING' | 'CLEANED'
  priority: 'HIGH' | 'NORMAL'
  slaBreachTimeMs: number
}

export interface OfflineAction {
  id: string
  actionType: 'COMPLETE_TASK'
  payload: any
  timestamp: string
}

export const FieldWorkforceOps: React.FC<{
  initialTasks: HousekeepingTask[]
  isNetworkConnected: boolean
  onSyncComplete?: (replayedCount: number) => void
}> = ({ initialTasks, isNetworkConnected, onSyncComplete }) => {
  const [tasks, setTasks] = React.useState<HousekeepingTask[]>(initialTasks)
  const [offlineQueue, setOfflineQueue] = React.useState<OfflineAction[]>([])
  const [syncedCount, setSyncedCount] = React.useState<number>(0)

  // Submits checklist accomplishments, applying optimistic local state changes and buffering actions when offline
  const handleCompleteTask = (taskId: string, gps: { lat: number; lng: number }, photoUrl: string) => {
    // 1. Optimistic UI update
    setTasks(prev =>
      prev.map(t => (t.id === taskId ? { ...t, status: 'CLEANED' } : t))
    )

    const payload = { taskId, gps, photoUrl, completedAt: new Date().toISOString() }

    // 2. If disconnected, buffer transaction in local offline queue
    if (!isNetworkConnected) {
      const offlineAction: OfflineAction = {
        id: `off-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        actionType: 'COMPLETE_TASK',
        payload,
        timestamp: new Date().toISOString()
      }
      setOfflineQueue(prev => [...prev, offlineAction])
    } else {
      // Direct live submission
      setSyncedCount(prev => prev + 1)
    }
  }

  // Flushes and synchronizes buffered actions upon reconnect
  const triggerOnlineSync = async () => {
    if (!isNetworkConnected || offlineQueue.length === 0) return

    // Replay queued transactions
    const replayed = offlineQueue.length
    setSyncedCount(prev => prev + replayed)
    setOfflineQueue([])

    if (onSyncComplete) {
      onSyncComplete(replayed)
    }
  }

  return (
    <div style={{ padding: '16px', fontFamily: 'sans-serif', backgroundColor: '#0e0918', color: '#fff' }}>
      <h2>Field Operations Checklist (Expo Mobile)</h2>
      <div style={{ margin: '10px 0', padding: '8px', borderRadius: '4px', backgroundColor: isNetworkConnected ? '#10b981' : '#f59e0b' }}>
        Status: <strong>{isNetworkConnected ? 'Connected (Live)' : 'Offline (Buffering Enabled)'}</strong>
      </div>

      <div style={{ margin: '10px 0' }}>
        <strong>Offline Queue Length:</strong> {offlineQueue.length} items buffered.
        {isNetworkConnected && offlineQueue.length > 0 && (
          <button onClick={triggerOnlineSync} style={{ marginLeft: '12px', padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#8b5cf6', color: '#fff', cursor: 'pointer' }}>
            Sync Queue
          </button>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <h3>Active Dispatches</h3>
        {tasks.map(task => (
          <div key={task.id} style={{ margin: '8px 0', padding: '12px', border: '1px solid #332a4e', borderRadius: '6px', backgroundColor: '#150f24' }}>
            <div>Room {task.roomNumber} - Status: <strong>{task.status}</strong></div>
            <div style={{ fontSize: '12px', color: '#a0aec0' }}>Priority: {task.priority}</div>
            
            {task.status !== 'CLEANED' && (
              <button
                onClick={() => handleCompleteTask(task.id, { lat: 6.9271, lng: 79.8612 }, 'https://s3.aws/evidence-img.png')}
                style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '4px', border: 'none', backgroundColor: '#8b5cf6', color: '#fff', cursor: 'pointer' }}
              >
                Complete Room (GPS & Photo)
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default FieldWorkforceOps
