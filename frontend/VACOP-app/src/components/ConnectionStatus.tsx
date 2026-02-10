import React, { useEffect, useState } from 'react';
import { FaGamepad, FaWifi, FaSlash } from 'react-icons/fa';
import './ConnectionStatus.css';

interface ConnectionStatusProps {
  label: string;
  isConnected: boolean;
  type: 'gamepad' | 'robot';
  onStatusChange?: (nextConnected: boolean) => void;
  endpointUrl?: string;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  label,
  isConnected,
  type,
  onStatusChange,
  endpointUrl = 'http://localhost:5000/command/robot/connection',
}) => {
  const isRobot = type === 'robot';
  const [isSaving, setIsSaving] = useState(false);

  // UI state (optimiste) synchronisé avec la prop
  const [uiConnected, setUiConnected] = useState(isConnected);
  useEffect(() => setUiConnected(isConnected), [isConnected]);

  const getIcon = (): React.ReactElement => {
    const baseIcon = type === 'gamepad' ? <FaGamepad /> : <FaWifi />;
    if (!uiConnected) {
      return (
        <span className="icon-disconnected" aria-hidden="true">
          {baseIcon}
          <FaSlash className="icon-slash" />
        </span>
      );
    }
    return <span aria-hidden="true">{baseIcon}</span>;
  };

  const handleClick = async () => {
    if (!isRobot || isSaving) return;

    const next = !uiConnected;

    // Optimiste: on toggle direct
    setUiConnected(next);

    try {
      setIsSaving(true);

      const res = await fetch(endpointUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isConnected: next }),
      });

      const text = await res.text().catch(() => '');
      if (!res.ok) throw new Error(`Backend ${res.status}: ${text || res.statusText}`);

      // On informe le parent
      onStatusChange?.(next);
    } catch (err) {
      console.error('Failed to update robot connection status:', err);
      // rollback UI si erreur
      setUiConnected(!next);
      alert("Impossible d'envoyer la commande au backend.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      className={`status-button ${uiConnected ? 'connected' : 'disconnected'} ${
        isRobot ? 'clickable' : 'not-clickable'
      }`}
      onClick={isRobot ? handleClick : undefined}
      disabled={!isRobot || isSaving}
      aria-label={`${label}: ${uiConnected ? 'connected' : 'disconnected'}`}
    >
      {getIcon()}
      <span>{isSaving ? 'Saving…' : label}</span>
    </button>
  );
};

export default ConnectionStatus;
