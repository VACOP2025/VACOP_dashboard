import React from 'react';
import './LogsPanel.css'; // Import component-specific styles

/**
 * Mock data array for the 'Important Logs' panel.
 * Used for UI development and layout prototyping.
 */
const fakeLogs = [
  { level: 'INFO', msg: '[raspberry] Obstacle reçu, distance X m...' },
  { level: 'INFO', msg: '[backend-api] Requête...' },
  { level: 'INFO', msg: '[frontend-ui] Opérateur admin connecté' },
  { level: 'WARN', msg: '[network-5G] Perte de signal 5G' },
  { level: 'INFO', msg: '[backend] Déclenchement arrêt d\'urgence.' },
  { level: 'INFO', msg: '[frontend-ui] Commande avancer...' },
  { level: 'WARN', msg: '[proximity-front-left-ultra] [WARN] Obstacle...' },
  { level: 'INFO', msg: '[raspberry] Moteur gauche activé' },
  { level: 'INFO', msg: '[raspberry] Mode automatique' },
];

/**
 * A component that renders the "Important Logs" panel.
 *
 * It iterates over the 'fakeLogs' data source to display each log entry,
 * dynamically assigning a CSS class based on the log's 'level'
 * (e.g., 'info', 'warn', 'error') for level-specific styling.
 *
 * @returns {React.ReactElement} The rendered log panel.
 */
const LogsPanel: React.FC = () => {
  return (
    <div className="logs-panel">
      <h4>Logs importants</h4>
      <div className="logs-content">
        {/*
          Map over the mock data array to render each log entry.
          - 'key' is set to 'index' for a stable identity in this static list.
          - 'className' is dynamically set to the log level (e..g, 'info')
            to allow CSS to color-code the log.
        */}
        {fakeLogs.map((log, index) => (
          <p key={index} className={log.level.toLowerCase()}>
            {log.msg}
          </p>
        ))}
      </div>
    </div>
  );
};

export default LogsPanel;