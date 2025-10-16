class ErrorBase extends Error {
  constructor(mensaje, codigo, codigoEstado = 500) {
    super(mensaje);
    this.name = this.constructor.name;
    this.codigoEstado = codigoEstado;
    this.codigo = codigo; // Para un switch/log más limpio
    Error.captureStackTrace(this, this.constructor);
    
    console.log(`${this.name} - ${this.message} (Código: ${this.codigo}, Estado: ${this.codigoEstado})`);
  }
}
module.exports = ErrorBase;