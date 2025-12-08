import React, { useState } from 'react';
// Import icons used in the header status display
import { FaNetworkWired, FaGamepad, FaSlash } from 'react-icons/fa';
import './LogsDetailedPage.css'; // Imports component-specific styles

/**
 * Mock data array simulating a detailed log history.
 * Used for UI development and prototyping the scrollable list.
 * Each object contains a 'level' (for styling) and 'msg' (the content).
 */
const fakeDetailedLogs = [
  { level: 'INFO', msg: '[Time stamp UTC] [system-core] [INFO] Démarrage nœud <nom_nœud> (<version>) sur <machine>.' },
  { level: 'INFO', msg: '[Time stamp UTC] [system-core] [INFO] Configuration chargée : profil <nom_profil>.' },
  { level: 'INFO', msg: '[Time stamp UTC] [system-core] [INFO] Horloge synchronisée (source : GNSS / NTP). offset <val> ms.' },
  { level: 'WARN', msg: '[Time stamp UTC] [system-core] [WARN] Temps système désynchronisé (> <seuil> ms).' },
  { level: 'ERROR', msg: '[Time stamp UTC] [system-core] [ERROR] Processus <nom> interrompu (exit code <code>). Redémarrage en cours.' },
  { level: 'INFO', msg: '[Time stamp UTC] [proximity-front-left-ultra] [INFO] Capteurs proximité OK : <ultra/IR/bumper> initialisés.' },
  { level: 'WARN', msg: '[Time stamp UTC] [proximity-front-left-ultra] [WARN] Obstacle <direction> à <dist> m (capteur <id>).' },
  { level: 'ERROR', msg: '[Time stamp UTC] [safety] [ERROR] Arrêt d\'urgence (E-STOP) activé : source <physique/radio/auto>.' },
  { level: 'INFO', msg: '[Time stamp UTC] [safety] [INFO] E-STOP relâché : remise sous tension progressive.' },
  { level: 'INFO', msg: '[Time stamp UTC] [localization] [INFO] GNSS RTK : FIX (sats <nb>, HDOP <val>).' },
  { level: 'WARN', msg: '[Time stamp UTC] [localization] [WARN] RTK perdu : FIX -> FLOAT / GNSS (dégradation précision).' },
  { level: 'INFO', msg: '[Time stamp UTC] [localization] [INFO] Fusion localisation active (GNSS+IMU+ODO) : status OK.' },
  { level: 'WARN', msg: '[Time stamp UTC] [localization] [WARN] Dérive IMU : biais gyroscope élevé.' },
  { level: 'ERROR', msg: '[Time stamp UTC] [localization] [ERROR] Localisation indisponible (> <durée> s) -> bascule mode sécurité.' },
  // Additional mock data for demonstrating scrolling
  { level: 'INFO', msg: '[Time stamp UTC] [system-core] [INFO] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [system-core] [INFO] ...' },
  { level: 'WARN', msg: '[Time stamp UTC] [localization] [WARN] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [safety] [INFO] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [system-core] [INFO] ...' },
  { level: 'ERROR', msg: '[Time stamp UTC] [system-core] [ERROR] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [localization] [INFO] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [proximity-front-left-ultra] [INFO] ...' },
  { level: 'WARN', msg: '[Time stamp UTC] [system-core] [WARN] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [safety] [INFO] ...' },
  { level: 'INFO', msg: '[Time stamp UTC] [localization] [INFO] ...' },
];
// ------------------------------

/**
 * Renders the "Detailed Logs" page.
 *
 * This component displays a full, scrollable history of system logs.
 * It uses static placeholder data for UI development.
 *
 * @returns {React.ReactElement} The rendered detailed logs page.
 */
const LogsDetailedPage: React.FC = () => {
  // Placeholder state for gamepad connection (currently static).
  const [isGamepadConnected, setGamepadConnected] = useState(false);
  // Placeholder state for 5G connection (currently static).
  const [is5GConnected, set5GConnected] = useState(true);

  return (
    <div className="logs-page-container">
      {/* Page Header */}
      <header className="logs-header">
        {/* Left header group: Gamepad Status */}
        <div className="header-group">
          <div className="status-indicator">
            <FaGamepad />
            <span>Manette déconnecté</span>
          </div>
        </div>
        
        {/* Page Title */}
        <h1>Logs détaillés</h1>
        
        {/* Right header group: Network Status */}
        <div className="header-group">
          <div className="status-indicator">
            <span>Réseau 5G</span>
            <FaNetworkWired />
          </div>
        </div>
      </header>

      {/* Main Content: Scrollable Log List */}
      <main className="logs-list">
        {/*
          Iterates over the mock data array to render each log entry.
          - 'key' is set to 'index' for a stable identity in this static list.
          - 'className' is dynamically assigned based on the log's 'level'
            to allow CSS to apply color-coding (e.g., 'warn', 'error').
        */}
        {fakeDetailedLogs.map((log, index) => (
          <p key={index} className={`log-line ${log.level.toLowerCase()}`}>
            {log.msg}
          </p>
        ))}
      </main>
    </div>
  );
};

export default LogsDetailedPage;