
import { useEffect, useMemo, useState } from "react";
import api from "../services/api";
import * as XLSX from "xlsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

const formularioInicial = {
  anio: 2026,
  pia: 0,
  pim: 0,
  certificado: 0,
  compromisoAnual: 0,
  devengado: 0,
  girado: 0,
  fechaActualizacion: new Date().toISOString().slice(0, 10),
  periodo: "Enero - Setiembre",
  fuenteFinanciamiento: "Recursos Ordinarios",
};

const formatoSoles = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatoNumero = (valor) =>
  Number(valor || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const porcentaje = (valor, total) =>
  Number(total) > 0 ? (Number(valor || 0) / Number(total)) * 100 : 0;

const formatoPorcentaje = (valor) =>
  `${Number(valor || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;

const normalizarRegistro = (registro) => ({
  ...formularioInicial,
  ...registro,
  anio: Number(registro.anio || 2026),
  pia: Number(registro.pia || 0),
  pim: Number(registro.pim || 0),
  certificado: Number(registro.certificado || 0),
  compromisoAnual: Number(registro.compromisoAnual || 0),
  devengado: Number(registro.devengado || 0),
  girado: Number(registro.girado || 0),
});

function TarjetaIndicador({
  titulo,
  valor,
  detalle,
  color,
  porcentajeValor,
}) {
  return (
    <div className="card h-100 border shadow-sm">
      <div className="card-body p-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="text-secondary small mb-2">{titulo}</div>
            <div className="fs-5 fw-bold text-dark">
              {formatoSoles(valor)}
            </div>
          </div>
          <span
            className="rounded-circle d-inline-block"
            style={{
              width: 10,
              height: 10,
              backgroundColor: color,
              flexShrink: 0,
              marginTop: 5,
            }}
          />
        </div>

        <div className="small text-secondary mt-2">{detalle}</div>

        {porcentajeValor !== undefined && (
          <div className="mt-3">
            <div className="d-flex justify-content-between small mb-1">
              <span>Respecto al PIM</span>
              <strong>{formatoPorcentaje(porcentajeValor)}</strong>
            </div>
            <div className="progress" style={{ height: 7 }}>
              <div
                className="progress-bar"
                style={{
                  width: `${Math.min(Math.max(porcentajeValor, 0), 100)}%`,
                  backgroundColor: color,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Presupuesto() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [formulario, setFormulario] = useState({ ...formularioInicial });
  const [idEditar, setIdEditar] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState("2026");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const cargarPresupuestos = async () => {
    setCargando(true);
    setError("");

    try {
      const respuesta = await api.get("/presupuestos");
      const datos = Array.isArray(respuesta.data)
        ? respuesta.data.map(normalizarRegistro)
        : [];

      setPresupuestos(datos);
    } catch (err) {
      console.error("Error al cargar presupuestos:", err);
      setError(
        "No se pudieron cargar los presupuestos. Verifica que json-server esté funcionando en el puerto 3001."
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPresupuestos();
  }, []);

  const aniosDisponibles = useMemo(
    () =>
      [...new Set(presupuestos.map((p) => Number(p.anio)))]
        .filter(Number.isFinite)
        .sort((a, b) => b - a),
    [presupuestos]
  );

  const registrosFiltrados = useMemo(
    () =>
      presupuestos
        .filter(
          (p) =>
            filtroAnio === "todos" || String(p.anio) === filtroAnio
        )
        .filter((p) => {
          const texto = [
            p.periodo,
            p.fuenteFinanciamiento,
            p.fechaActualizacion,
            p.anio,
          ]
            .join(" ")
            .toLowerCase();

          return texto.includes(busqueda.trim().toLowerCase());
        })
        .sort((a, b) =>
          String(b.fechaActualizacion).localeCompare(
            String(a.fechaActualizacion)
          )
        ),
    [presupuestos, filtroAnio, busqueda]
  );

  const totales = useMemo(
    () =>
      registrosFiltrados.reduce(
        (acumulado, p) => ({
          pia: acumulado.pia + Number(p.pia || 0),
          pim: acumulado.pim + Number(p.pim || 0),
          certificado:
            acumulado.certificado + Number(p.certificado || 0),
          compromisoAnual:
            acumulado.compromisoAnual +
            Number(p.compromisoAnual || 0),
          devengado: acumulado.devengado + Number(p.devengado || 0),
          girado: acumulado.girado + Number(p.girado || 0),
        }),
        {
          pia: 0,
          pim: 0,
          certificado: 0,
          compromisoAnual: 0,
          devengado: 0,
          girado: 0,
        }
      ),
    [registrosFiltrados]
  );

  const saldoPim = totales.pim - totales.devengado;
  const saldoCertificar = totales.pim - totales.certificado;
  const ejecucion = porcentaje(totales.devengado, totales.pim);
  const certificacion = porcentaje(totales.certificado, totales.pim);
  const compromiso = porcentaje(totales.compromisoAnual, totales.pim);
  const giradoPorcentaje = porcentaje(totales.girado, totales.pim);

  const datosGrafico = [
    { concepto: "PIA", monto: totales.pia },
    { concepto: "PIM", monto: totales.pim },
    { concepto: "Certificado", monto: totales.certificado },
    { concepto: "Compromiso", monto: totales.compromisoAnual },
    { concepto: "Devengado", monto: totales.devengado },
    { concepto: "Girado", monto: totales.girado },
  ];

  const actualizarCampo = (evento) => {
    const { name, value } = evento.target;
    const numericos = [
      "anio",
      "pia",
      "pim",
      "certificado",
      "compromisoAnual",
      "devengado",
      "girado",
    ];

    setFormulario((actual) => ({
      ...actual,
      [name]: numericos.includes(name)
        ? value === ""
          ? ""
          : Number(value)
        : value,
    }));
  };

  const limpiarFormulario = () => {
    setFormulario({
      ...formularioInicial,
      fechaActualizacion: new Date().toISOString().slice(0, 10),
    });
    setIdEditar(null);
    setError("");
  };

  const guardarPresupuesto = async (evento) => {
    evento.preventDefault();
    setError("");
    setMensaje("");

    const camposNumericos = [
      "anio",
      "pia",
      "pim",
      "certificado",
      "compromisoAnual",
      "devengado",
      "girado",
    ];

    for (const campo of camposNumericos) {
      const valor = formulario[campo];

      if (valor === "" || !Number.isFinite(Number(valor))) {
        setError(`Ingresa un valor válido para ${campo}.`);
        return;
      }

      if (Number(valor) < 0) {
        setError(`El campo ${campo} no puede ser negativo.`);
        return;
      }
    }

    if (Number(formulario.anio) < 2000) {
      setError("El año debe ser igual o posterior al año 2000.");
      return;
    }

    if (
      !formulario.periodo.trim() ||
      !formulario.fuenteFinanciamiento.trim()
    ) {
      setError("Completa el periodo y la fuente de financiamiento.");
      return;
    }

    if (Number(formulario.devengado) > Number(formulario.pim)) {
      setError("El devengado no puede superar al PIM.");
      return;
    }

    if (Number(formulario.certificado) > Number(formulario.pim)) {
      setError("El certificado no puede superar al PIM.");
      return;
    }

    if (Number(formulario.compromisoAnual) > Number(formulario.pim)) {
      setError("El compromiso anual no puede superar al PIM.");
      return;
    }

    if (Number(formulario.girado) > Number(formulario.devengado)) {
      setError("El girado no puede superar al devengado.");
      return;
    }

    const datosGuardar = {
      ...formulario,
      anio: Number(formulario.anio),
      pia: Number(formulario.pia),
      pim: Number(formulario.pim),
      certificado: Number(formulario.certificado),
      compromisoAnual: Number(formulario.compromisoAnual),
      devengado: Number(formulario.devengado),
      girado: Number(formulario.girado),
    };

    setGuardando(true);

    try {
      if (idEditar !== null) {
        await api.put(`/presupuestos/${idEditar}`, datosGuardar);
        setMensaje("Registro presupuestal actualizado correctamente.");
      } else {
        await api.post("/presupuestos", datosGuardar);
        setMensaje("Registro presupuestal creado correctamente.");
      }

      limpiarFormulario();
      await cargarPresupuestos();
    } catch (err) {
      console.error("Error al guardar presupuesto:", err);
      setError(
        "No se pudo guardar el registro. Verifica la conexión con la API."
      );
    } finally {
      setGuardando(false);
    }
  };

  const editarPresupuesto = (registro) => {
    setFormulario(normalizarRegistro(registro));
    setIdEditar(registro.id);
    setError("");
    setMensaje("");

    document
      .getElementById("formulario-presupuesto")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const eliminarPresupuesto = async (registro) => {
    const confirmar = window.confirm(
      `¿Deseas eliminar el registro presupuestal del año ${registro.anio}, periodo ${registro.periodo}?`
    );

    if (!confirmar) return;

    setError("");
    setMensaje("");

    try {
      await api.delete(`/presupuestos/${registro.id}`);
      setMensaje("Registro eliminado correctamente.");

      if (String(idEditar) === String(registro.id)) {
        limpiarFormulario();
      }

      await cargarPresupuestos();
    } catch (err) {
      console.error("Error al eliminar presupuesto:", err);
      setError("No se pudo eliminar el registro.");
    }
  };

  const exportarExcel = () => {
    if (registrosFiltrados.length === 0) {
      setError("No hay registros para exportar.");
      return;
    }

    const datosExcel = registrosFiltrados.map((p) => ({
      Año: p.anio,
      Periodo: p.periodo,
      "Fuente de financiamiento": p.fuenteFinanciamiento,
      PIA: p.pia,
      PIM: p.pim,
      Certificado: p.certificado,
      "Compromiso anual": p.compromisoAnual,
      Devengado: p.devengado,
      Girado: p.girado,
      "Saldo PIM - Devengado": Number(p.pim) - Number(p.devengado),
      "Ejecución (%)": Number(
        porcentaje(p.devengado, p.pim).toFixed(2)
      ),
      "Fecha de actualización": p.fechaActualizacion,
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    hoja["!cols"] = Object.keys(datosExcel[0]).map((columna) => ({
      wch: Math.max(columna.length + 3, 16),
    }));

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Control presupuestal");

    XLSX.writeFile(
      libro,
      `Control_Presupuestal_${filtroAnio}_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
    );
  };

  const estiloSeccion = {
    border: "1px solid #e1e7e3",
    borderRadius: 12,
    backgroundColor: "#ffffff",
  };

  const etiqueta = {
    fontSize: 12,
    fontWeight: 700,
    color: "#46564d",
  };

  return (
    <div
      className="container-fluid px-3 px-lg-4 py-4"
      style={{ background: "#f5f7f6", minHeight: "100vh" }}
    >
      <style>{`
        .presupuesto-titulo {
          color: #173f32;
        }

        .presupuesto-seccion-titulo {
          color: #173f32;
          font-weight: 700;
        }

        .presupuesto-tabla {
          min-width: 1250px;
          border-color: #e1e7e3;
        }

        .presupuesto-tabla thead th {
          background: #e8efeb;
          color: #173f32;
          font-size: 12px;
          white-space: nowrap;
          vertical-align: middle;
          padding: 13px 10px;
          border-bottom: 2px solid #cbd9d0;
        }

        .presupuesto-tabla tbody td {
          font-size: 12px;
          vertical-align: middle;
          padding: 12px 10px;
        }

        .presupuesto-tabla tbody tr:nth-child(even) {
          background: #f8faf9;
        }

        .presupuesto-tabla tbody tr:hover {
          background: #edf5ef;
        }

        .presupuesto-tabla tfoot td {
          background: #e8efeb;
          color: #173f32;
          padding: 13px 10px;
          font-size: 12px;
          white-space: nowrap;
        }

        .presupuesto-form-control {
          border-color: #d9e2dc;
          border-radius: 7px;
        }

        .presupuesto-form-control:focus {
          border-color: #49856b;
          box-shadow: 0 0 0 .15rem rgba(44, 111, 81, .12);
        }

        .presupuesto-btn-principal {
          background: #174b39;
          color: white;
          border: 1px solid #174b39;
        }

        .presupuesto-btn-principal:hover {
          background: #103727;
          color: white;
        }
      `}</style>

      {/* ENCABEZADO */}
      <div className="card border-0 shadow-sm mb-4" style={estiloSeccion}>
        <div className="card-body p-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
            <div>
              <div className="small fw-bold text-success mb-2">
                SIGI-010 · UNIDAD EJECUTORA 010
              </div>
              <h2 className="fw-bold mb-2 presupuesto-titulo">
                Control Presupuestal
              </h2>
              <p className="text-secondary mb-1">
                VIII Dirección Territorial de Policía Huancayo
              </p>
              <span className="badge rounded-pill text-bg-light border">
                Seguimiento financiero y control de saldos
              </span>
            </div>

            <div className="d-flex flex-wrap align-items-end gap-2">
              <div>
                <label htmlFor="filtro-anio" className="form-label small fw-semibold">
                  Año fiscal
                </label>
                <select
                  id="filtro-anio"
                  className="form-select"
                  style={{ minWidth: 130 }}
                  value={filtroAnio}
                  onChange={(e) => setFiltroAnio(e.target.value)}
                >
                  <option value="todos">Todos los años</option>
                  {[...new Set([2026, ...aniosDisponibles])]
                    .sort((a, b) => b - a)
                    .map((anio) => (
                      <option key={anio} value={String(anio)}>
                        {anio}
                      </option>
                    ))}
                </select>
              </div>

              <button
                className="btn btn-success"
                onClick={exportarExcel}
                type="button"
              >
                <i className="bi bi-file-earmark-excel me-2" />
                Exportar Excel
              </button>
            </div>
          </div>

          <hr className="my-4" />

          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div className="small text-secondary">Periodo de análisis</div>
              <div className="fw-semibold">
                {[...new Set(
                  registrosFiltrados.map((p) => p.periodo).filter(Boolean)
                )].join(", ") || "Sin periodo registrado"}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="small text-secondary">Fuente de financiamiento</div>
              <div className="fw-semibold">
                {[...new Set(
                  registrosFiltrados
                    .map((p) => p.fuenteFinanciamiento)
                    .filter(Boolean)
                )].join(", ") || "Sin información"}
              </div>
            </div>
            <div className="col-12 col-md-4">
              <div className="small text-secondary">Registros encontrados</div>
              <div className="fw-semibold">{registrosFiltrados.length}</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() => setError("")}
          />
        </div>
      )}

      {mensaje && (
        <div className="alert alert-success alert-dismissible" role="alert">
          {mensaje}
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() => setMensaje("")}
          />
        </div>
      )}

      {/* RESUMEN FINANCIERO */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end mb-3 gap-2">
        <div>
          <h5 className="presupuesto-titulo fw-bold mb-1">
            Resumen financiero
          </h5>
          <div className="text-secondary small">
            Montos de los registros incluidos en el filtro seleccionado.
          </div>
        </div>
        <div className="small text-secondary">
          Registros analizados: <strong>{registrosFiltrados.length}</strong>
        </div>
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaIndicador
            titulo="PIA"
            valor={totales.pia}
            detalle="Presupuesto institucional de apertura"
            color="#527cbb"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaIndicador
            titulo="PIM"
            valor={totales.pim}
            detalle="Presupuesto institucional modificado"
            color="#b59a43"
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaIndicador
            titulo="Certificado"
            valor={totales.certificado}
            detalle="Certificación presupuestal acumulada"
            color="#39836b"
            porcentajeValor={certificacion}
          />
        </div>
        <div className="col-12 col-sm-6 col-xl-3">
          <TarjetaIndicador
            titulo="Devengado"
            valor={totales.devengado}
            detalle="Ejecución financiera acumulada"
            color="#27724f"
            porcentajeValor={ejecucion}
          />
        </div>
      </div>

      {/* CONTROL DE EJECUCIÓN */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm h-100" style={estiloSeccion}>
            <div className="card-body p-4">
              <h5 className="presupuesto-seccion-titulo mb-1">
                Control de ejecución presupuestal
              </h5>
              <p className="text-secondary small mb-4">
                Avance de las etapas financieras respecto al PIM.
              </p>

              {[
                {
                  nombre: "Certificación",
                  valor: certificacion,
                  monto: totales.certificado,
                  color: "#47856a",
                },
                {
                  nombre: "Compromiso anual",
                  valor: compromiso,
                  monto: totales.compromisoAnual,
                  color: "#b59a43",
                },
                {
                  nombre: "Devengado",
                  valor: ejecucion,
                  monto: totales.devengado,
                  color: "#285e94",
                },
                {
                  nombre: "Girado",
                  valor: giradoPorcentaje,
                  monto: totales.girado,
                  color: "#79878e",
                },
              ].map((indicador) => (
                <div className="mb-4" key={indicador.nombre}>
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                    <span className="fw-semibold small">
                      {indicador.nombre}
                    </span>
                    <div className="text-end">
                      <span className="fw-bold small">
                        {formatoPorcentaje(indicador.valor)}
                      </span>
                      <div className="text-secondary" style={{ fontSize: 11 }}>
                        {formatoSoles(indicador.monto)}
                      </div>
                    </div>
                  </div>
                  <div
                    className="progress"
                    style={{ height: 10, background: "#e9efeb" }}
                  >
                    <div
                      className="progress-bar"
                      role="progressbar"
                      aria-valuenow={Math.min(indicador.valor, 100)}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      style={{
                        width: `${Math.min(
                          Math.max(indicador.valor, 0),
                          100
                        )}%`,
                        background: indicador.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm h-100" style={estiloSeccion}>
            <div className="card-body p-4">
              <h5 className="presupuesto-seccion-titulo mb-1">
                Saldos presupuestales
              </h5>
              <p className="text-secondary small mb-4">
                Diferencias calculadas a partir de los montos registrados.
              </p>

              <div
                className="p-3 rounded-3 mb-3"
                style={{
                  background: "#edf5ef",
                  borderLeft: "4px solid #39836b",
                }}
              >
                <div className="small text-secondary">
                  Saldo PIM menos devengado
                </div>
                <div className="fs-4 fw-bold" style={{ color: "#245a42" }}>
                  {formatoSoles(saldoPim)}
                </div>
                <div className="small text-secondary mt-1">
                  Diferencia pendiente de devengar.
                </div>
              </div>

              <div
                className="p-3 rounded-3"
                style={{
                  background: "#fbf6e9",
                  borderLeft: "4px solid #b59a43",
                }}
              >
                <div className="small text-secondary">
                  PIM menos certificado
                </div>
                <div className="fs-5 fw-bold" style={{ color: "#7b6524" }}>
                  {formatoSoles(saldoCertificar)}
                </div>
                <div className="small text-secondary mt-1">
                  Diferencia respecto al monto certificado.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRÁFICO */}
      <div className="card border-0 shadow-sm mb-4" style={estiloSeccion}>
        <div className="card-body p-3 p-lg-4">
          <div className="mb-3">
            <h5 className="presupuesto-seccion-titulo mb-1">
              Comparativo presupuestal
            </h5>
            <p className="text-secondary small mb-0">
              Montos de PIA, PIM y etapas de ejecución financiera.
            </p>
          </div>

          {registrosFiltrados.length === 0 ? (
            <div className="text-center text-secondary py-5">
              No hay datos disponibles para graficar.
            </div>
          ) : (
            <div style={{ width: "100%", height: 340 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={datosGrafico}
                  margin={{ top: 10, right: 20, left: 15, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="concepto" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickFormatter={(valor) =>
                      new Intl.NumberFormat("es-PE", {
                        notation: "compact",
                        maximumFractionDigits: 1,
                      }).format(valor)
                    }
                  />
                  <Tooltip
                    formatter={(valor) => formatoSoles(valor)}
                    labelStyle={{ fontWeight: "bold" }}
                  />
                  <Legend />
                  <Bar
                    dataKey="monto"
                    name="Monto presupuestal"
                    fill="#28664d"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={65}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO */}
      <div
        className="card border-0 shadow-sm mb-4"
        id="formulario-presupuesto"
        style={estiloSeccion}
      >
        <div
          className="card-header border-0 p-3 p-lg-4"
          style={{ background: "#eaf1ec", borderRadius: "12px 12px 0 0" }}
        >
          <div className="d-flex justify-content-between align-items-center gap-2">
            <div>
              <h5 className="presupuesto-seccion-titulo mb-1">
                {idEditar !== null
                  ? "Editar registro presupuestal"
                  : "Registrar presupuesto"}
              </h5>
              <div className="small text-secondary">
                Registra o actualiza la información financiera del periodo.
              </div>
            </div>
            {idEditar !== null && (
              <span className="badge text-bg-warning">Modo edición</span>
            )}
          </div>
        </div>

        <div className="card-body p-3 p-lg-4">
          <form onSubmit={guardarPresupuesto}>
            <div className="row g-3">
              <div className="col-12 col-sm-6 col-lg-3">
                <label style={etiqueta} className="form-label">
                  Año fiscal
                </label>
                <input
                  className="form-control presupuesto-form-control"
                  type="number"
                  name="anio"
                  min="2000"
                  value={formulario.anio}
                  onChange={actualizarCampo}
                  required
                />
              </div>

              {[
                { nombre: "pia", etiqueta: "PIA (S/)" },
                { nombre: "pim", etiqueta: "PIM (S/)" },
                { nombre: "certificado", etiqueta: "Certificado (S/)" },
                {
                  nombre: "compromisoAnual",
                  etiqueta: "Compromiso anual (S/)",
                },
                { nombre: "devengado", etiqueta: "Devengado (S/)" },
                { nombre: "girado", etiqueta: "Girado (S/)" },
              ].map((campo) => (
                <div className="col-12 col-sm-6 col-lg-3" key={campo.nombre}>
                  <label style={etiqueta} className="form-label">
                    {campo.etiqueta}
                  </label>
                  <input
                    className="form-control presupuesto-form-control"
                    type="number"
                    name={campo.nombre}
                    min="0"
                    step="0.01"
                    value={formulario[campo.nombre]}
                    onChange={actualizarCampo}
                    required
                  />
                </div>
              ))}

              <div className="col-12 col-sm-6 col-lg-3">
                <label style={etiqueta} className="form-label">
                  Fecha de actualización
                </label>
                <input
                  className="form-control presupuesto-form-control"
                  type="date"
                  name="fechaActualizacion"
                  value={formulario.fechaActualizacion}
                  onChange={actualizarCampo}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label style={etiqueta} className="form-label">
                  Periodo
                </label>
                <input
                  className="form-control presupuesto-form-control"
                  type="text"
                  name="periodo"
                  placeholder="Ej. Enero - Setiembre"
                  value={formulario.periodo}
                  onChange={actualizarCampo}
                  required
                />
              </div>

              <div className="col-12 col-md-6">
                <label style={etiqueta} className="form-label">
                  Fuente de financiamiento
                </label>
                <input
                  className="form-control presupuesto-form-control"
                  type="text"
                  name="fuenteFinanciamiento"
                  placeholder="Ej. Recursos Ordinarios"
                  value={formulario.fuenteFinanciamiento}
                  onChange={actualizarCampo}
                  required
                />
              </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mt-4">
              <button
                type="submit"
                className="btn presupuesto-btn-principal px-4"
                disabled={guardando}
              >
                {guardando
                  ? "Guardando..."
                  : idEditar !== null
                    ? "Actualizar registro"
                    : "Guardar presupuesto"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                onClick={limpiarFormulario}
              >
                Limpiar formulario
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* TABLA DE CONTROL */}
      <div className="card border-0 shadow-sm" style={estiloSeccion}>
        <div className="card-body p-3 p-lg-4">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mb-3">
            <div>
              <h5 className="presupuesto-seccion-titulo mb-1">
                Registro y control de ejecución presupuestal
              </h5>
              <p className="small text-secondary mb-0">
                Consulta montos registrados, compromisos, devengados y saldos.
              </p>
            </div>

            <input
              type="search"
              className="form-control presupuesto-form-control"
              style={{ maxWidth: 340 }}
              placeholder="Buscar año, periodo o fuente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              aria-label="Buscar registros presupuestales"
            />
          </div>

          {cargando ? (
            <div className="text-center py-5">
              <div
                className="spinner-border text-success"
                role="status"
              >
                <span className="visually-hidden">Cargando...</span>
              </div>
              <div className="small text-secondary mt-2">
                Cargando información presupuestal...
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered table-hover presupuesto-tabla mb-0">
                <thead>
                  <tr>
                    <th>Año</th>
                    <th>Periodo / fuente</th>
                    <th className="text-end">PIA (S/)</th>
                    <th className="text-end">PIM (S/)</th>
                    <th className="text-end">Certificado (S/)</th>
                    <th className="text-end">Compromiso anual (S/)</th>
                    <th className="text-end">Devengado (S/)</th>
                    <th className="text-end">Girado (S/)</th>
                    <th className="text-end">% ejecución</th>
                    <th className="text-end">Saldo PIM (S/)</th>
                    <th>Actualización</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {registrosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="12" className="text-center text-secondary py-5">
                        No se encontraron registros presupuestales.
                      </td>
                    </tr>
                  ) : (
                    registrosFiltrados.map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold">{p.anio}</td>
                        <td>
                          <div className="fw-semibold">
                            {p.periodo || "Sin periodo"}
                          </div>
                          <div className="text-secondary" style={{ fontSize: 11 }}>
                            {p.fuenteFinanciamiento || "Sin fuente"}
                          </div>
                        </td>
                        <td className="text-end text-nowrap">
                          {formatoNumero(p.pia)}
                        </td>
                        <td className="text-end text-nowrap fw-semibold">
                          {formatoNumero(p.pim)}
                        </td>
                        <td className="text-end text-nowrap">
                          {formatoNumero(p.certificado)}
                        </td>
                        <td className="text-end text-nowrap">
                          {formatoNumero(p.compromisoAnual)}
                        </td>
                        <td className="text-end text-nowrap">
                          {formatoNumero(p.devengado)}
                        </td>
                        <td className="text-end text-nowrap">
                          {formatoNumero(p.girado)}
                        </td>
                        <td className="text-end">
                          <span
                            className="badge"
                            style={{
                              background: "#e5f2e9",
                              color: "#205b3d",
                            }}
                          >
                            {formatoPorcentaje(
                              porcentaje(p.devengado, p.pim)
                            )}
                          </span>
                        </td>
                        <td className="text-end text-nowrap fw-semibold">
                          {formatoNumero(
                            Number(p.pim) - Number(p.devengado)
                          )}
                        </td>
                        <td className="text-nowrap">
                          {p.fechaActualizacion || "—"}
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              title="Editar registro"
                              aria-label={`Editar presupuesto ${p.anio}`}
                              onClick={() => editarPresupuesto(p)}
                            >
                              <i className="bi bi-pencil-square" />
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              title="Eliminar registro"
                              aria-label={`Eliminar presupuesto ${p.anio}`}
                              onClick={() => eliminarPresupuesto(p)}
                            >
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>

                {registrosFiltrados.length > 0 && (
                  <tfoot>
                    <tr className="fw-bold">
                      <td colSpan="2">TOTALES</td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(totales.pia)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(totales.pim)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(totales.certificado)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(totales.compromisoAnual)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(totales.devengado)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(totales.girado)}
                      </td>
                      <td className="text-end">
                        {formatoPorcentaje(ejecucion)}
                      </td>
                      <td className="text-end text-nowrap">
                        {formatoNumero(saldoPim)}
                      </td>
                      <td colSpan="2">—</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          <div className="d-flex flex-column flex-md-row justify-content-between gap-2 mt-3 small text-secondary">
            <span>Registros mostrados: {registrosFiltrados.length}</span>
            <span>Montos expresados en soles (S/).</span>
          </div>
        </div>
      </div>

      <div className="text-center text-secondary small mt-4">
        SIGI-010 · Unidad Ejecutora 010 – VIII DIRTEPOL Huancayo
      </div>
    </div>
  );
}

export default Presupuesto;
