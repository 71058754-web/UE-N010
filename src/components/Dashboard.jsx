
import { useEffect, useState } from "react";
import api from "../services/api";

function Dashboard() {
  const [indicadores, setIndicadores] = useState([
    { titulo: "Comisarías", valor: "—", icono: "bi-building" },
    { titulo: "Efectivos", valor: "—", icono: "bi-people-fill" },
    { titulo: "Patrulleros", valor: "—", icono: "bi-car-front-fill" },
    { titulo: "Ejecución presupuestal", valor: "—", icono: "bi-graph-up-arrow" },
  ]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarIndicadores();
  }, []);

  async function cargarIndicadores() {
    setCargando(true);
    setError("");

    try {
      const [
        respuestaComisarias,
        respuestaPersonal,
        respuestaPresupuesto,
      ] = await Promise.all([
        api.get("/comisarias"),
        api.get("/personal"),
        api.get("/presupuestos"),
      ]);

      const comisarias = respuestaComisarias.data;
      const personal = respuestaPersonal.data;
      const presupuestos = respuestaPresupuesto.data;

      const camposPatrulleros = [
        "patrulleros",
        "numeroPatrulleros",
        "cantidadPatrulleros",
      ];

      const existeDatoPatrulleros = comisarias.some((comisaria) =>
        camposPatrulleros.some(
          (campo) =>
            comisaria[campo] !== undefined &&
            comisaria[campo] !== null &&
            comisaria[campo] !== ""
        )
      );

      const totalPatrulleros = existeDatoPatrulleros
        ? comisarias.reduce((total, comisaria) => {
            const campo = camposPatrulleros.find(
              (nombre) =>
                comisaria[nombre] !== undefined &&
                comisaria[nombre] !== null &&
                comisaria[nombre] !== ""
            );

            return total + (campo ? Number(comisaria[campo]) || 0 : 0);
          }, 0)
        : null;

      const presupuestosOrdenados = [...presupuestos].sort(
        (a, b) =>
          new Date(b.fechaActualizacion || 0).getTime() -
          new Date(a.fechaActualizacion || 0).getTime()
      );

      const presupuestoActual = presupuestosOrdenados[0];

      let ejecucion = "Sin dato";

      if (presupuestoActual) {
        const pim = Number(presupuestoActual.pim);
        const devengado = Number(presupuestoActual.devengado);

        if (
          Number.isFinite(pim) &&
          Number.isFinite(devengado) &&
          pim > 0 &&
          devengado >= 0
        ) {
          ejecucion = `${((devengado / pim) * 100).toFixed(1)} %`;
        }
      }

      setIndicadores([
        {
          titulo: "Comisarías",
          valor: comisarias.length.toLocaleString("es-PE"),
          icono: "bi-building",
        },
        {
          titulo: "Efectivos",
          valor: personal.length.toLocaleString("es-PE"),
          icono: "bi-people-fill",
        },
        {
          titulo: "Patrulleros",
          valor:
            totalPatrulleros === null
              ? "Sin dato"
              : totalPatrulleros.toLocaleString("es-PE"),
          icono: "bi-car-front-fill",
        },
        {
          titulo: "Ejecución presupuestal",
          valor: ejecucion,
          icono: "bi-graph-up-arrow",
        },
      ]);
    } catch (err) {
      console.error("Error al cargar indicadores:", err);
      setError(
        "No se pudieron actualizar los indicadores. Verifica que json-server esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <section id="dashboard" className="seccion-dashboard">
      <div className="container">
        <div className="dashboard-encabezado">
          <div className="dashboard-titulo">
            <span className="dashboard-etiqueta">
              <i className="bi bi-shield-check me-2"></i>
              RESUMEN INSTITUCIONAL
            </span>

            <h2>Indicadores generales</h2>

            <p>
              Resumen de información de la VIII DIRTEPOL Huancayo.
            </p>
          </div>

          <button
            type="button"
            className="dashboard-actualizar"
            onClick={cargarIndicadores}
            disabled={cargando}
          >
            <i className="bi bi-arrow-clockwise me-2"></i>
            {cargando ? "Actualizando..." : "Actualizar datos"}
          </button>
        </div>

        {error && (
          <div className="alert alert-warning" role="alert">
            {error}
          </div>
        )}

        <div className="dashboard-resumen">
          <div className="row g-4">
            {indicadores.map((indicador, indice) => (
              <div className="col-sm-6 col-xl-3" key={indicador.titulo}>
                <article
                  className={`tarjeta-indicador tarjeta-indicador-${indice + 1}`}
                >
                  <div className="tarjeta-indicador-superior">
                    <div className="indicador-icono">
                      <i className={`bi ${indicador.icono}`}></i>
                    </div>

                    <span className="indicador-numero">
                      0{indice + 1}
                    </span>
                  </div>

                  <div className="indicador-contenido">
                    <p>{indicador.titulo}</p>
                    <h3>{indicador.valor}</h3>

                    <span className="indicador-detalle">
                      {indicador.titulo === "Ejecución presupuestal"
                        ? "Devengado respecto al PIM"
                        : "Registros institucionales"}
                    </span>
                  </div>

                  <div className="tarjeta-indicador-linea"></div>
                </article>
              </div>
            ))}
          </div>
        </div>

        {cargando && (
          <p className="text-secondary mt-3">
            Actualizando información...
          </p>
        )}

        <div className="dashboard-pie">
          <span>
            <i className="bi bi-shield-check me-2"></i>
            SIGI-010 · VIII DIRTEPOL Huancayo
          </span>
          <span>Resumen de indicadores institucionales</span>
        </div>
      </div>
    </section>
  );
}

export default Dashboard;
