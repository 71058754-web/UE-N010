function CardIndicador({ titulo, valor, icono, descripcion }) {
  return (
    <div className="col-md-6 col-xl-3 mb-4">
      <div className="card tarjeta-indicador h-100 shadow-sm">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <p className="titulo-indicador mb-2">{titulo}</p>
              <h2 className="valor-indicador">{valor}</h2>
              <small className="text-muted">{descripcion}</small>
            </div>

            <div className="icono-indicador">
              <i className={`bi ${icono}`}></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardIndicador;