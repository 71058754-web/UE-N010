function Header() {
  return (
    <header className="header-institucional">
      <div className="container header-contenido">
        <div className="header-identidad">
          <div className="header-logo">
            <span>PNP</span>
          </div>

          <div>
            <p className="header-superior">Policía Nacional del Perú</p>
            <h1>Unidad Ejecutora N.º 010</h1>
            <p>VIII DIRTEPOL Huancayo</p>
          </div>
        </div>

        <div className="header-acceso">
          <button type="button" className="btn btn-outline-success">
            <i className="bi bi-person-lock me-2"></i>
            Iniciar sesión
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;