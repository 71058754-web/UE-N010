function Footer() {
  return (
    <footer id="contacto" className="footer-institucional">
      <div className="container">
        <div className="row g-4">
          <div className="col-lg-7">
            <h3>Unidad Ejecutora N.º 010</h3>
            <p>VIII DIRTEPOL Huancayo</p>
            <p className="mb-0">
              Portal de información institucional y transparencia.
            </p>
          </div>

          <div className="col-lg-5 footer-enlaces">
            <a href="#inicio">Inicio</a>
            <a href="#dashboard">Dashboard</a>
            <a href="#transparencia">Transparencia</a>
          </div>
        </div>

        <hr />

        <p className="footer-copyright">
          © 2026 SIGI-010. Información sujeta a autorización institucional.
        </p>
      </div>
    </footer>
  );
}

export default Footer; 