
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import api from "../services/api";

const formularioInicial = {
  nombre: "",
  regionId: "",
  provincia: "",
  distrito: "",
  categoria: "",
  direccion: "",
  telefono: "",
  estado: "Operativa",
};

function Comisarias() {
  const [comisarias, setComisarias] = useState([]);
  const [regiones, setRegiones] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [regionSeleccionada, setRegionSeleccionada] = useState("");
  const [formulario, setFormulario] = useState(formularioInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [comisariaEditando, setComisariaEditando] = useState(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");

      const [respuestaComisarias, respuestaRegiones] =
        await Promise.all([
          api.get("/comisarias"),
          api.get("/regiones"),
        ]);

      setComisarias(respuestaComisarias.data);
      setRegiones(respuestaRegiones.data);
    } catch (err) {
      console.error(err);
      setError(
        "No se pudo cargar la información. Verifica que json-server esté funcionando."
      );
    } finally {
      setCargando(false);
    }
  }

  const cambiarFormulario = (evento) => {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  };

  const abrirFormularioNuevo = () => {
    if (mostrarFormulario && comisariaEditando === null) {
      setMostrarFormulario(false);
    } else {
      setFormulario({ ...formularioInicial });
      setComisariaEditando(null);
      setMostrarFormulario(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    setError("");
    setMensaje("");
  };

  const cancelarFormulario = () => {
    setFormulario({ ...formularioInicial });
    setComisariaEditando(null);
    setMostrarFormulario(false);
    setError("");
    setMensaje("");
  };

  const editarComisaria = (comisaria) => {
    setComisariaEditando(comisaria.id);

    setFormulario({
      nombre: comisaria.nombre || "",
      regionId: String(comisaria.regionId ?? ""),
      provincia: comisaria.provincia || "",
      distrito: comisaria.distrito || "",
      categoria: comisaria.categoria || "",
      direccion: comisaria.direccion || "",
      telefono: comisaria.telefono || "",
      estado: comisaria.estado || "Operativa",
    });

    setMostrarFormulario(true);
    setError("");
    setMensaje("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const guardarComisaria = async (evento) => {
    evento.preventDefault();
    setError("");
    setMensaje("");

    if (
      !formulario.nombre.trim() ||
      !formulario.regionId ||
      !formulario.provincia.trim() ||
      !formulario.distrito.trim() ||
      !formulario.direccion.trim()
    ) {
      setError("Completa los campos obligatorios marcados con *.");
      return;
    }

    try {
      setGuardando(true);

      const datosComisaria = {
        ...formulario,
        nombre: formulario.nombre.trim(),
        regionId: Number(formulario.regionId),
        provincia: formulario.provincia.trim(),
        distrito: formulario.distrito.trim(),
        direccion: formulario.direccion.trim(),
        telefono: formulario.telefono.trim(),
      };

      if (comisariaEditando !== null) {
        const respuesta = await api.put(
          `/comisarias/${comisariaEditando}`,
          datosComisaria
        );

        setComisarias((anteriores) =>
          anteriores.map((item) =>
            String(item.id) === String(comisariaEditando)
              ? respuesta.data
              : item
          )
        );

        setMensaje("La comisaría fue actualizada correctamente.");
      } else {
        const respuesta = await api.post(
          "/comisarias",
          datosComisaria
        );

        setComisarias((anteriores) => [
          ...anteriores,
          respuesta.data,
        ]);

        setMensaje("La comisaría fue registrada correctamente.");
      }

      setFormulario({ ...formularioInicial });
      setComisariaEditando(null);
      setMostrarFormulario(false);
    } catch (err) {
      console.error(err);
      setError(
        comisariaEditando !== null
          ? "No se pudo actualizar la comisaría."
          : "No se pudo registrar la comisaría."
      );
    } finally {
      setGuardando(false);
    }
  };

  const eliminarComisaria = async (id, nombre) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar la comisaría "${nombre}"?`
    );

    if (!confirmar) return;

    try {
      setError("");
      setMensaje("");

      await api.delete(`/comisarias/${id}`);

      setComisarias((anteriores) =>
        anteriores.filter(
          (item) => String(item.id) !== String(id)
        )
      );

      if (String(comisariaEditando) === String(id)) {
        cancelarFormulario();
      }

      setMensaje("La comisaría fue eliminada correctamente.");
    } catch (err) {
      console.error(err);
      setError("No se pudo eliminar la comisaría.");
    }
  };

  const obtenerNombreRegion = (regionId) => {
    const region = regiones.find(
      (item) => String(item.id) === String(regionId)
    );

    return region ? region.nombre : "Sin región";
  };

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case "Operativa":
        return "comisaria-estado comisaria-estado-operativa";
      case "En mantenimiento":
        return "comisaria-estado comisaria-estado-mantenimiento";
      case "Inoperativa":
        return "comisaria-estado comisaria-estado-inoperativa";
      default:
        return "comisaria-estado comisaria-estado-desconocida";
    }
  };

  const comisariasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return comisarias.filter((comisaria) => {
      const campos = [
        comisaria.nombre,
        obtenerNombreRegion(comisaria.regionId),
        comisaria.provincia,
        comisaria.distrito,
        comisaria.direccion,
        comisaria.categoria,
        comisaria.telefono,
        comisaria.estado,
      ];

      const coincideBusqueda = campos.some((campo) =>
        String(campo || "").toLowerCase().includes(texto)
      );

      const coincideRegion =
        regionSeleccionada === "" ||
        String(comisaria.regionId) === String(regionSeleccionada);

      return coincideBusqueda && coincideRegion;
    });
  }, [comisarias, regiones, busqueda, regionSeleccionada]);

  const totalComisarias = comisarias.length;

  const comisariasOperativas = comisarias.filter(
    (item) => item.estado === "Operativa"
  ).length;

  const comisariasMantenimiento = comisarias.filter(
    (item) => item.estado === "En mantenimiento"
  ).length;

  const comisariasInoperativas = comisarias.filter(
    (item) => item.estado === "Inoperativa"
  ).length;

  const exportarExcel = () => {
    if (comisariasFiltradas.length === 0) {
      setError("No hay comisarías para exportar.");
      return;
    }

    const datosExcel = comisariasFiltradas.map((item) => ({
      ID: item.id,
      "Nombre de la comisaría": item.nombre || "",
      Región: obtenerNombreRegion(item.regionId),
      Provincia: item.provincia || "",
      Distrito: item.distrito || "",
      Categoría: item.categoria || "",
      Dirección: item.direccion || "",
      Teléfono: item.telefono || "",
      Estado: item.estado || "",
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);

    hoja["!cols"] = [
      { wch: 10 },
      { wch: 32 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 35 },
      { wch: 16 },
      { wch: 22 },
    ];

    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Comisarias");
    XLSX.writeFile(libro, "Comisarias_SIGI010.xlsx");
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setRegionSeleccionada("");
    setError("");
  };

  return (
    <main className="container-fluid px-3 px-lg-4 py-4 pagina-comisarias">
      {/* Encabezado institucional */}
      <section className="comisarias-encabezado mb-4">
        <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
          <div>
            <div className="comisarias-etiqueta mb-2">
              <i className="bi bi-shield-check me-2"></i>
              SIGI-010 · GESTIÓN INSTITUCIONAL
            </div>

            <h1 className="comisarias-titulo mb-2">
              Gestión de comisarías
            </h1>

            <p className="comisarias-subtitulo mb-0">
              Consulta y administra las dependencias policiales de
              Junín, Pasco y Huancavelica.
            </p>
          </div>

          <button
            type="button"
            className="btn comisarias-boton-principal"
            onClick={abrirFormularioNuevo}
          >
            <i
              className={`bi ${
                mostrarFormulario && comisariaEditando === null
                  ? "bi-x-lg"
                  : "bi-plus-lg"
              } me-2`}
            ></i>
            {mostrarFormulario && comisariaEditando === null
              ? "Cerrar formulario"
              : "Nueva comisaría"}
          </button>
        </div>
      </section>

      {/* Mensajes */}
      {mensaje && (
        <div
          className="alert alert-success alert-dismissible fade show shadow-sm"
          role="alert"
        >
          <i className="bi bi-check-circle-fill me-2"></i>
          {mensaje}
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() => setMensaje("")}
          ></button>
        </div>
      )}

      {error && (
        <div
          className="alert alert-danger alert-dismissible fade show shadow-sm"
          role="alert"
        >
          <i className="bi bi-exclamation-circle-fill me-2"></i>
          {error}
          <button
            type="button"
            className="btn-close"
            aria-label="Cerrar"
            onClick={() => setError("")}
          ></button>
        </div>
      )}

      {/* Indicadores */}
      <section className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="comisarias-indicador indicador-total">
            <div className="indicador-icono">
              <i className="bi bi-buildings"></i>
            </div>
            <div className="indicador-contenido">
              <span>Total de comisarías</span>
              <strong>{totalComisarias}</strong>
              <small>Registros en el sistema</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="comisarias-indicador indicador-operativa">
            <div className="indicador-icono">
              <i className="bi bi-check-circle"></i>
            </div>
            <div className="indicador-contenido">
              <span>Operativas</span>
              <strong>{comisariasOperativas}</strong>
              <small>En funcionamiento</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="comisarias-indicador indicador-mantenimiento">
            <div className="indicador-icono">
              <i className="bi bi-tools"></i>
            </div>
            <div className="indicador-contenido">
              <span>En mantenimiento</span>
              <strong>{comisariasMantenimiento}</strong>
              <small>Requieren atención</small>
            </div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="comisarias-indicador indicador-inoperativa">
            <div className="indicador-icono">
              <i className="bi bi-exclamation-triangle"></i>
            </div>
            <div className="indicador-contenido">
              <span>Inoperativas</span>
              <strong>{comisariasInoperativas}</strong>
              <small>Fuera de funcionamiento</small>
            </div>
          </div>
        </div>
      </section>

      {/* Formulario de registro y edición */}
      {mostrarFormulario && (
        <section className="card comisarias-panel mb-4">
          <div className="comisarias-panel-cabecera">
            <div className="d-flex align-items-center gap-3">
              <div className="comisarias-panel-icono">
                <i
                  className={`bi ${
                    comisariaEditando !== null
                      ? "bi-pencil-square"
                      : "bi-building-add"
                  }`}
                ></i>
              </div>
              <div>
                <h2 className="h5 mb-1">
                  {comisariaEditando !== null
                    ? "Editar comisaría"
                    : "Registrar nueva comisaría"}
                </h2>
                <p className="mb-0">
                  Completa los datos de la dependencia policial.
                </p>
              </div>
            </div>
          </div>

          <div className="card-body p-3 p-lg-4">
            <form onSubmit={guardarComisaria}>
              <div className="row g-3">
                <div className="col-md-8">
                  <label className="form-label" htmlFor="comisaria-nombre">
                    Nombre de la comisaría *
                  </label>
                  <input
                    id="comisaria-nombre"
                    required
                    type="text"
                    className="form-control"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={cambiarFormulario}
                    placeholder="Ej.: Comisaría PNP Huancayo"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="comisaria-region">
                    Región *
                  </label>
                  <select
                    id="comisaria-region"
                    required
                    className="form-select"
                    name="regionId"
                    value={formulario.regionId}
                    onChange={cambiarFormulario}
                  >
                    <option value="">Seleccione una región</option>
                    {regiones.map((region) => (
                      <option key={region.id} value={region.id}>
                        {region.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="comisaria-provincia">
                    Provincia *
                  </label>
                  <input
                    id="comisaria-provincia"
                    required
                    type="text"
                    className="form-control"
                    name="provincia"
                    value={formulario.provincia}
                    onChange={cambiarFormulario}
                    placeholder="Provincia"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="comisaria-distrito">
                    Distrito *
                  </label>
                  <input
                    id="comisaria-distrito"
                    required
                    type="text"
                    className="form-control"
                    name="distrito"
                    value={formulario.distrito}
                    onChange={cambiarFormulario}
                    placeholder="Distrito"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="comisaria-categoria">
                    Categoría
                  </label>
                  <select
                    id="comisaria-categoria"
                    className="form-select"
                    name="categoria"
                    value={formulario.categoria}
                    onChange={cambiarFormulario}
                  >
                    <option value="">Seleccione una categoría</option>
                    <option value="A">Categoría A</option>
                    <option value="B">Categoría B</option>
                    <option value="C">Categoría C</option>
                    <option value="D">Categoría D</option>
                    <option value="Comisaría básica">
                      Comisaría básica
                    </option>
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label" htmlFor="comisaria-direccion">
                    Dirección *
                  </label>
                  <input
                    id="comisaria-direccion"
                    required
                    type="text"
                    className="form-control"
                    name="direccion"
                    value={formulario.direccion}
                    onChange={cambiarFormulario}
                    placeholder="Dirección de la dependencia"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="comisaria-telefono">
                    Teléfono
                  </label>
                  <input
                    id="comisaria-telefono"
                    type="text"
                    className="form-control"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={cambiarFormulario}
                    placeholder="Teléfono de contacto"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label" htmlFor="comisaria-estado">
                    Estado
                  </label>
                  <select
                    id="comisaria-estado"
                    className="form-select"
                    name="estado"
                    value={formulario.estado}
                    onChange={cambiarFormulario}
                  >
                    <option value="Operativa">Operativa</option>
                    <option value="En mantenimiento">
                      En mantenimiento
                    </option>
                    <option value="Inoperativa">Inoperativa</option>
                  </select>
                </div>
              </div>

              <div className="d-flex flex-wrap gap-2 mt-4">
                <button
                  type="submit"
                  className="btn comisarias-boton-principal"
                  disabled={guardando}
                >
                  {guardando ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-floppy me-2"></i>
                      {comisariaEditando !== null
                        ? "Guardar cambios"
                        : "Registrar comisaría"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn btn-light border"
                  onClick={cancelarFormulario}
                  disabled={guardando}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Búsqueda y filtros */}
      <section className="card comisarias-panel mb-4">
        <div className="card-body p-3 p-lg-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-funnel comisarias-icono-seccion"></i>
            <h2 className="h6 mb-0">
              Buscar y filtrar dependencias
            </h2>
          </div>

          <div className="row g-3 align-items-end">
            <div className="col-lg-8">
              <label className="form-label" htmlFor="buscar-comisaria">
                Buscar comisaría
              </label>
              <div className="input-group comisarias-buscador">
                <span className="input-group-text">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  id="buscar-comisaria"
                  type="search"
                  className="form-control"
                  placeholder="Nombre, región, provincia, distrito o dirección..."
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-4">
              <label className="form-label" htmlFor="filtrar-region">
                Filtrar por región
              </label>
              <select
                id="filtrar-region"
                className="form-select"
                value={regionSeleccionada}
                onChange={(evento) =>
                  setRegionSeleccionada(evento.target.value)
                }
              >
                <option value="">Todas las regiones</option>
                {regiones.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Directorio */}
      <section className="card comisarias-panel">
        <div className="comisarias-listado-cabecera">
          <div>
            <h2 className="h5 mb-1">Directorio de comisarías</h2>
            <p className="mb-0">
              Consulta los datos y el estado de cada dependencia.
            </p>
          </div>

          <div className="comisarias-contador">
            {comisariasFiltradas.length} de {totalComisarias} registros
          </div>
        </div>

        <div className="card-body p-3 p-lg-4">
          <div className="d-flex flex-wrap gap-2 mb-4">
            {(busqueda || regionSeleccionada) && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={limpiarFiltros}
              >
                <i className="bi bi-x-circle me-2"></i>
                Limpiar filtros
              </button>
            )}

            <button
              type="button"
              className="btn btn-outline-success"
              onClick={exportarExcel}
              disabled={comisariasFiltradas.length === 0}
            >
              <i className="bi bi-file-earmark-excel me-2"></i>
              Exportar a Excel
            </button>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={cargarDatos}
              disabled={cargando}
            >
              <i className="bi bi-arrow-clockwise me-2"></i>
              Actualizar datos
            </button>
          </div>

          {cargando ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
              <p className="text-muted mt-3 mb-0">
                Cargando información de las comisarías...
              </p>
            </div>
          ) : comisariasFiltradas.length > 0 ? (
            <div className="row g-3">
              {comisariasFiltradas.map((comisaria) => (
                <div
                  className="col-12 col-md-6 col-xl-4"
                  key={comisaria.id}
                >
                  <article className="comisaria-ficha">
                    <div className="comisaria-ficha-cabecera">
                      <div className="comisaria-ficha-icono">
                        <i className="bi bi-building"></i>
                      </div>

                      <span className={obtenerClaseEstado(comisaria.estado)}>
                        <span className="comisaria-punto"></span>
                        {comisaria.estado || "Sin estado"}
                      </span>
                    </div>

                    <div className="comisaria-ficha-contenido">
                      <span className="comisaria-region">
                        <i className="bi bi-geo-alt me-1"></i>
                        {obtenerNombreRegion(comisaria.regionId)}
                      </span>

                      <h3 className="comisaria-ficha-titulo">
                        {comisaria.nombre || "Sin nombre"}
                      </h3>

                      <div className="comisaria-dato">
                        <i className="bi bi-map"></i>
                        <div>
                          <small>Provincia y distrito</small>
                          <p>
                            {comisaria.provincia || "No registrada"}
                            {" · "}
                            {comisaria.distrito || "No registrado"}
                          </p>
                        </div>
                      </div>

                      <div className="comisaria-dato">
                        <i className="bi bi-diagram-3"></i>
                        <div>
                          <small>Categoría</small>
                          <p>{comisaria.categoria || "No registrada"}</p>
                        </div>
                      </div>

                      <div className="comisaria-dato">
                        <i className="bi bi-geo"></i>
                        <div>
                          <small>Dirección</small>
                          <p>{comisaria.direccion || "No registrada"}</p>
                        </div>
                      </div>

                      <div className="comisaria-dato">
                        <i className="bi bi-telephone"></i>
                        <div>
                          <small>Teléfono</small>
                          <p>{comisaria.telefono || "No registrado"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="comisaria-ficha-acciones">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => editarComisaria(comisaria)}
                      >
                        <i className="bi bi-pencil-square me-1"></i>
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          eliminarComisaria(
                            comisaria.id,
                            comisaria.nombre
                          )
                        }
                      >
                        <i className="bi bi-trash3 me-1"></i>
                        Eliminar
                      </button>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          ) : (
            <div className="comisarias-vacio">
              <div className="comisarias-vacio-icono">
                <i className="bi bi-search"></i>
              </div>
              <h3 className="h5">No se encontraron comisarías</h3>
              <p className="text-muted mb-3">
                Prueba con otra búsqueda o cambia los filtros seleccionados.
              </p>
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={limpiarFiltros}
              >
                Limpiar búsqueda
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default Comisarias;
