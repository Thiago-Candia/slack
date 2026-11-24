import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Brand from "../components/Brand";
import { ErrorState, LoadingState } from "../components/StatusView";
import UserButton from "../components/UserButton";
import CreateChannelModal from "../components/workspace/CreateChannelModal";
import InviteModal from "../components/workspace/InviteModal";
import WorkspaceRail from "../components/workspace/WorkspaceRail";
import WorkspaceSidebar from "../components/workspace/WorkspaceSidebar";
import { useWorkspaces } from "../context/WorkspaceContext";
import { useResource } from "../hooks/useResource";
import { channelService } from "../services";
import { sameId } from "../utils/format";

const SIDEBAR_ID = "workspace-sidebar";

const WorkspaceScreen = () => {
  const { workspace_id: workspaceId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, workspaces, status, error, reload } = useWorkspaces();
  const workspace = workspaces.find((item) => sameId(item.id, workspaceId));
  const channels = useResource(() => channelService.getByWorkspace(workspaceId), workspaceId);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openModal, setOpenModal] = useState(null);
  // La búsqueda pertenece al espacio en el que se escribió: al cambiar de espacio arranca vacía, sin un efecto extra.
  const [search, setSearch] = useState({ workspaceId, query: "" });
  const query = search.workspaceId === workspaceId ? search.query : "";
  const setQuery = (value) => setSearch({ workspaceId, query: value });
  const { setData: setChannels } = channels;

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleChannelCreated = useCallback(
    (channel) => {
      setChannels((previous) => [...(previous ?? []), channel]);
      setOpenModal(null);
      navigate(`/workspace/${workspaceId}/channel/${channel.id}`);
    },
    [setChannels, navigate, workspaceId]
  );

  if (status === "loading") {
    return (
      <div className="page page--center">
        <LoadingState>Cargando espacio de trabajo...</LoadingState>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="page page--center">
        <ErrorState error={error} onRetry={reload} />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="page page--center">
        <div className="panel panel--compact">
          <h1 className="panel__title">Espacio de trabajo no encontrado</h1>
          <p className="panel__subtitle">No existe o no sos miembro.</p>
          <Link to="/home" className="button button--primary">
            Volver a mis espacios
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="workspace">
      <WorkspaceRail workspaces={workspaces} user={user} />
      <WorkspaceSidebar
        id={SIDEBAR_ID}
        workspace={workspace}
        channels={channels}
        currentUser={user}
        isOpen={isSidebarOpen}
        query={query}
        onCreateChannel={() => setOpenModal("channel")}
        onInvite={() => setOpenModal("invite")}
      />
      {isSidebarOpen && <div className="workspace__scrim" aria-hidden="true" onClick={() => setIsSidebarOpen(false)} />}

      <div className="workspace__content">
        <header className="workspace__topbar">
          <button
            type="button"
            className="icon-button workspace__menu"
            aria-controls={SIDEBAR_ID}
            aria-expanded={isSidebarOpen}
            aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setIsSidebarOpen((open) => !open)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
              <path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z" />
            </svg>
          </button>
          <div className="workspace__mobile-only">
            <Brand />
          </div>
          <div className="search">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="M10 4a6 6 0 1 0 3.5 10.9l5 5 1.4-1.4-5-5A6 6 0 0 0 10 4m0 2a4 4 0 1 1 0 8 4 4 0 0 1 0-8"
              />
            </svg>
            <input
              type="search"
              className="search__input"
              aria-label={`Buscar en ${workspace.name}`}
              placeholder={`Buscar en ${workspace.name}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
            />
          </div>
          <div className="workspace__mobile-only">
            <UserButton />
          </div>
        </header>

        <main className="workspace__main">
          <Outlet context={{ workspace, channels, user, openCreateChannel: () => setOpenModal("channel") }} />
        </main>
      </div>

      {openModal === "channel" && (
        <CreateChannelModal
          workspaceId={workspace.id}
          onCreated={handleChannelCreated}
          onClose={() => setOpenModal(null)}
        />
      )}
      {openModal === "invite" && <InviteModal workspace={workspace} onClose={() => setOpenModal(null)} />}
    </div>
  );
};

export default WorkspaceScreen;
