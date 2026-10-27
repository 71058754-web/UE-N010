
import { NavLink } from "react-router-dom";

function Navbar() {
  const claseEnlace = ({ isActive }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-institucional">
      <div className="container">
        <NavLink className="navbar-brand fw-bold" to="/">
          SIGI-010
        </NavLink>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#menuPrincipal"
          aria-controls="menuPrincipal"
          aria-expanded="false"
          aria-label="Mostrar navegación"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="menuPrincipal">
          <ul className="navbar-nav ms-auto">
            <li className="nav-item">
              <NavLink
                end
                className={claseEnlace}
                to="/"
              >
                Inicio
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={claseEnlace} to="/personal">
                Personal
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={claseEnlace} to="/comisarias">
                Comisarías
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={claseEnlace} to="/presupuesto">
                Presupuesto
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={claseEnlace} to="/noticias">
                Transparencia
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={claseEnlace} to="/contacto">
                Contacto
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
