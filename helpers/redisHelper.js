const Redis = require("ioredis");

// ⚡ Conexión a Redis
const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6380,
  password: process.env.REDIS_PASSWORD || undefined,
});

/**
 * Guarda un objeto en una tabla Redis Hash evitando duplicados
 */
async function saveUnique(tabla, id, data) {
  const exists = await redis.hexists(tabla, id);
  if (exists) {
    return { success: false, message: `${tabla.slice(0, -1)} ya existe` };
  }

  await redis.hset(tabla, id, JSON.stringify(data));
  return { success: true, message: `${tabla.slice(0, -1)} agregado correctamente` };
}

/**
 * Actualiza un registro en Redis (sobrescribe si existe)
 */
async function update(tabla, id, data) {
  await redis.hset(tabla, id, JSON.stringify(data));
  return { success: true, message: `${tabla.slice(0, -1)} actualizado correctamente` };
}

/**
 * Obtiene un registro por ID
 */
async function getById(tabla, id) {
  const result = await redis.hget(tabla, id);
  return result ? JSON.parse(result) : null;
}

/**
 * Obtiene todos los registros de una tabla
 */
async function getAll(tabla) {
  const result = await redis.hgetall(tabla);
  return Object.fromEntries(
    Object.entries(result).map(([key, value]) => [key, JSON.parse(value)])
  );
}

/**
 * Elimina un registro
 */
async function remove(tabla, id) {
  const result = await redis.hdel(tabla, id);
  if (result === 0) {
    return { success: false, message: `${tabla.slice(0, -1)} no encontrado` };
  }
  return { success: true, message: `${tabla.slice(0, -1)} eliminado correctamente` };
}

/**
 * ---------------------------
 * Funciones para WorkerManager
 * ---------------------------
 */
const JOB_TABLE = 'jobs';

/**
 * Guarda el estado de un job
 */
async function saveJobRecord(shortId, record) {
  await redis.hset(JOB_TABLE, shortId, JSON.stringify(record));
}

/**
 * Obtiene el estado de un job
 */
async function getJobRecord(shortId) {
  const data = await redis.hget(JOB_TABLE, shortId);
  return data ? JSON.parse(data) : null;
}

module.exports = {
  saveUnique,
  update,
  getById,
  getAll,
  remove,
  saveJobRecord,
  getJobRecord
};
