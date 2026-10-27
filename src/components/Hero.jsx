function Hero() {
  return (
    <section id="inicio" className="hero-institucional">
      <div className="container hero-contenido">
        <div className="row align-items-center g-5">
          <div className="col-lg-7">
            <span className="hero-etiqueta">
              Sistema Integrado de Gestión Institucional
            </span>

            <h2>
              Información pública de la Unidad Ejecutora N.º 010
            </h2>

            <p>
              Portal institucional de consulta sobre comisarías, presupuesto,
              indicadores, documentos y resultados autorizados para difusión.
            </p>

            <div className="d-flex flex-wrap gap-3">
              <a href="#dashboard" className="btn btn-warning btn-lg">
                Ver indicadores
              </a>

              <a
                href="#transparencia"
                className="btn btn-outline-light btn-lg"
              >
                Consultar documentos
              </a>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="hero-panel">
              <p className="hero-panel-titulo">Ámbito territorial</p>

              <div className="hero-region">
                <i className="bi bi-geo-alt-fill"></i>
                <span>Junín</span>
              </div>

              <div className="hero-region">
                <i className="bi bi-geo-alt-fill"></i>
                <span>Pasco</span>
              </div>

              <div className="hero-region">
                <i className="bi bi-geo-alt-fill"></i>
                <span>Huancavelica</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Hero;