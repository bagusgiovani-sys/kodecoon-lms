function openVideoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('kodehub-mock-videos', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('videos')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}
export async function saveMockVideo(id: string, file: File) {
  const db = await openVideoDatabase()
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('videos', 'readwrite')
      transaction.objectStore('videos').put(file, id)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
      transaction.onabort = () => reject(transaction.error)
    })
  } finally { db.close() }
}
export async function readMockVideo(id: string): Promise<Blob | undefined> {
  const db = await openVideoDatabase()
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction('videos').objectStore('videos').get(id)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } finally { db.close() }
}
