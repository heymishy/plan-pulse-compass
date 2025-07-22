/**
 * Screen Reader Announcement Hook
 * Separated from components to comply with react-refresh rules
 */

import React, { useState } from 'react';
import { LiveRegion } from '@/components/accessibility/screen-reader';

export const useScreenReaderAnnouncement = () => {
  const [announcement, setAnnouncement] = useState('');
  const [politeness, setPoliteness] = useState<'polite' | 'assertive'>(
    'polite'
  );

  const announce = (
    message: string,
    options: {
      politeness?: 'polite' | 'assertive';
      clearAfter?: number;
    } = {}
  ) => {
    const { politeness: level = 'polite', clearAfter = 1000 } = options;

    setPoliteness(level);
    setAnnouncement(message);

    if (clearAfter > 0) {
      setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);
    }
  };

  const LiveRegionComponent = () => (
    <LiveRegion
      politeness={politeness}
      clearAfter={0} // We handle clearing manually
    >
      {announcement}
    </LiveRegion>
  );

  return { announce, LiveRegion: LiveRegionComponent };
};
