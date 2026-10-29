import { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import Avatar from "../components/Avatar";
import Brand from "../components/Brand";
import { ErrorState, LoadingState } from "../components/StatusView";
import UserButton from "../components/UserButton";
import CreateChannelModal from "../components/workspace/CreateChannelModal";
import InviteModal from "../components/workspace/InviteModal";
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
        <Brand />
        <Link to={`/workspace/${workspace.id}`} className="workspace__name">
          <Avatar name={workspace.name} src={workspace.image_url} size="sm" shape="square" />
          <span>{workspace.name}</span>
        </Link>
        <div className="workspace__topbar-actions">
          <Link to="/home" className="button button--ghost button--small workspace__home-link">
            Mis espacios
          </Link>
          <UserButton />
        </div>
      </header>

      <div className="workspace__body">
        <WorkspaceSidebar
          id={SIDEBAR_ID}
          workspace={workspace}
          channels={channels}
          currentUser={user}
          isOpen={isSidebarOpen}
          onCreateChannel={() => setOpenModal("channel")}
          onInvite={() => setOpenModal("invite")}
        />
        {isSidebarOpen && (
          <div className="workspace__scrim" aria-hidden="true" onClick={() => setIsSidebarOpen(false)} />
        )}
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
