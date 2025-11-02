import React from 'react';

export const CameraIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 4h3l2-2h6l2 2h3v16H4V4zm8 13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm0-8c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z" />
  </svg>
);

export const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85l-.02.15v2c0 2.97-2.16 5.43-5 5.91V21h-2v-2.09c-2.84-.48-5-2.94-5-5.91v-2c0-.55.45-1 1-1s1 .45 1 1v2c0 2.21 1.79 4 4 4s4-1.79 4-4v-2c0-.55.45-1 1-1z" />
  </svg>
);

export const MicOffIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1.89 2.09L21.17 5.02 19.76 3.6 12 11.36V14c.55 0 1.05-.12 1.5-.32l-2.6-2.6c-.2.15-.32.35-.4.57V5c0-.98.71-1.8 1.65-1.97l-2.09-2.09C8.42 1.18 7 2.91 7 5v6c0 2.42 1.72 4.44 4 4.9v2.1h-2v2h6v-2h-2v-2.1c.07 0 .14-.01.2-.02zM4.41 2.86L3 4.27l6 6V11c0-.28.04-.55.12-.81L5.53 6.6C5.19 7.42 5 8.28 5 9.17v1.83c0 3.31 2.54 6.02 5.75 6.34v2.66h-2v2h6v-2h-2v-2.66c.29-.05.57-.12.84-.21l2.89 2.89 1.41-1.41L4.41 2.86z" />
  </svg>
);

export const MoreIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

export const EndCallIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 9c-1.6 0-3.15.25-4.62.72v3.1c0 .34.23.64.56.71.33.08.66-.03.88-.25l1.83-1.83c.53-.53.53-1.38 0-1.91L8.82 7.71C8.6 7.49 8.27 7.38 7.94 7.45c-.33.07-.56.37-.56.71v3.15C4.26 12.28 2 15.14 2 18.5c0 .83.67 1.5 1.5 1.5h17c.83 0 1.5-.67 1.5-1.5 0-3.36-2.26-6.22-5.38-7.15V8.2c0-.34-.23-.64-.56-.71-.33-.08-.66.03-.88-.25l-1.83 1.83c-.53.53-.53-1.38 0 1.91l1.83 1.83c.22.22.55.33.88.25.33-.07.56-.37.56-.71V9.72c-1.47-.47-3.02-.72-4.62-.72z" />
  </svg>
);

export const ScreenShareIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20 18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2H0v2h24v-2h-4zM4 6h16v10H4V6zm7 11.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3.5-7.5L6 11.5l3.5 3.5 2.5-2.5 4 4h-12l4-4z" />
    </svg>
);