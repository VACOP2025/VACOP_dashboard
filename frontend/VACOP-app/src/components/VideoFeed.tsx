import React from 'react';
import './VideoFeed.css'; // Imports component-specific styles

/**
 * Defines the props accepted by the VideoFeed component.
 */
interface VideoFeedProps {
  /** The title to display in the panel's header (e.g., "Caméra RGB"). */
  title: string;
}

/**
 * A placeholder component for a single video feed panel.
 *
 * This component is used on the dashboards to represent where a
 * real-time video stream (e.g., WebRTC) will be rendered.
 * It displays a title and a dark, styled content area.
 *
 * @param {VideoFeedProps} props The component props.
 * @returns {React.ReactElement} The rendered video feed panel.
 */
const VideoFeed: React.FC<VideoFeedProps> = ({ title }) => {
  return (
    <div className="video-feed-placeholder">
      <h4>{title}</h4>
      <div className="feed-content">
        <p>(Video Feed Placeholder)</p>
      </div>
    </div>
  );
};

export default VideoFeed;