import { Link } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import Avatar from "../components/Avatar";
import { EmptyState, ErrorState, LoadingState } from "../components/StatusView";
import { useWorkspaces } from "../context/WorkspaceContext";

const GETTING_STARTED = [
  {
    tag: "Canales",
    title: "Creá un canal",
    text: "Ordená las conversaciones por tema. Cada canal tiene su propio historial de mensajes.",
    icon: "M9.4 4 8.8 7H5v2h3.4l-.8 4H4v2h3.2l-.6 3h2l.6-3h4l-.6 3h2l.6-3H19v-2h-3.4l.8-4H20V7h-3.2l.6-3h-2l-.6 3h-4l.6-3zm.8 5h4l-.8 4h-4z"
  },
  {
    tag: "Invitaciones",
    title: "Invitá a tu equipo",
    text: "Generá un link de invitación desde la barra lateral y compartilo con quien quieras sumar.",
    icon: "M15 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8m-9 2V11H4v3H1v2h3v3h2v-3h3v-2zm9 1c-2.7 0-8 1.3-8 4v1h16v-1c0-2.7-5.3-4-8-4"
  },
  {
    tag: "Mensajes directos",
    title: "Escribí a una persona",
    text: "Elegí a cualquier miembro en la barra lateral para hablar 1 a 1, sin salir del espacio de trabajo.",
    icon: "M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2"
  }
];

const memberCount = (workspace) => {
  const count = workspace.members?.length ?? 0;
  return count === 1 ? "1 miembro" : `${count} miembros`;
};

const HomeScreen = () => {
  const { user, workspaces, status, error, reload } = useWorkspaces();

  return (
    <div className="page">
      <AppHeader />
      <main className="page__main home">
        <p className="home__greeting">{user ? `¡Hola de nuevo, ${user.name}!` : "¡Hola de nuevo!"}</p>

        <section className="panel" aria-labelledby="workspaces-title">
          <h1 id="workspaces-title" className="panel__title">
            Tus espacios de trabajo
          </h1>
          {user && <p className="panel__subtitle">Espacios de trabajo para {user.email}</p>}

          {status === "loading" && <LoadingState>Cargando espacios de trabajo...</LoadingState>}
          {status === "error" && <ErrorState error={error} onRetry={reload} />}
          {status === "ready" && workspaces.length === 0 && (
            <EmptyState title="Todavía no pertenecés a ningún espacio de trabajo.">
              <p>Creá uno nuevo o pedile a alguien de tu equipo un link de invitación.</p>
            </EmptyState>
          )}
          {status === "ready" && workspaces.length > 0 && (
            <ul className="workspace-cards">
              {workspaces.map((workspace) => (
                <li key={workspace.id} className="workspace-card">
                  <Avatar name={workspace.name} src={workspace.image_url} size="lg" shape="square" />
                  <div className="workspace-card__info">
                    <h2 className="workspace-card__name">{workspace.name}</h2>
                    <p className="workspace-card__meta">{memberCount(workspace)}</p>
                  </div>
                  <Link
                    to={`/workspace/${workspace.id}`}
                    className="button button--primary"
                    aria-label={`Abrir ${workspace.name}`}
                  >
                    Abrir
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel panel--row panel--create" aria-labelledby="create-title">
          <div className="panel__art" aria-hidden="true">
            #
          </div>
          <h2 id="create-title" className="panel__lead">
            ¿Querés usar Slack con otro equipo?
          </h2>
          <Link to="/new-workspace" className="button button--primary">
            Crear un espacio de trabajo
          </Link>
        </section>

        <p className="home__hint">
          ¿No encontrás tu espacio de trabajo? Pedile a alguien del equipo un link de invitación.
        </p>

        <section className="home__help" aria-labelledby="help-title">
          <h2 id="help-title" className="home__section-title">
            Primeros pasos
          </h2>
          <ul className="help-cards">
            {GETTING_STARTED.map((card) => (
              <li key={card.tag} className="help-card">
                <span className="help-card__icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" focusable="false">
                    <path fill="currentColor" d={card.icon} />
                  </svg>
                </span>
                <p className="help-card__tag">{card.tag}</p>
                <h3 className="help-card__title">{card.title}</h3>
                <p className="help-card__text">{card.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
};

export default HomeScreen;
